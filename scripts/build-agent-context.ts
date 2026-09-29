// O contexto que o agente do n8n le.
//
// Este arquivo existe por causa de um defeito medido em producao: o agente
// respondia "voce cobre 1 das 5 frentes" enquanto a tela do lead dizia
// "1 de 3". As frentes cairam de cinco para tres em ago/2026 e o prompt do
// n8n, mantido a mao, nao soube. Corrigir o texto la nao impediria a proxima
// divergencia — so tirar a manutencao manual do caminho impede.
//
// Entao: o build le src/content/* e emite public/agent-context.json; o n8n
// baixa esse arquivo a cada conversa. Mudar o posicionamento no site atualiza
// o agente no proximo deploy, sem ninguem tocar no n8n.
//
// O arquivo NAO carrega timestamp. Com um, toda regeracao diferiria e o teste
// de drift (tests/agent-context.test.ts) nao teria como comparar. Sem ele, o
// gerador e deterministico e a comparacao e direta.
//
// MUDANCA DE POSICIONAMENTO (set/2026): as tres frentes viraram dois caminhos
// (`paths`), o Diagnostico de Gargalo saiu, e o bloco `measurement` descreve os
// dois instrumentos da medicao. Sairam tambem `authorities` (a parede de videos
// deixou de existir) e `vulnerability` (o indice sintetico deixou de existir).
// O prompt do n8n que ainda leia `fronts`, `authorities`, `vulnerability` ou
// `offer.diagnosticPrice` precisa ser atualizado no mesmo cutover — ver
// docs/n8n-contrato-agente.md.
//
// O QUE E HISTORICO (set/2026, achado da revisao da Task 11): este arquivo e
// lido por agentes de IA como descricao verdadeira e ATUAL da empresa, e tres
// blocos ainda falavam do produto que saiu — o estudo do MIT e o da HBR (com
// takeaways de "processo errado para automatizar" e de SDR), os casos de agente
// SDR e de automacao de atendimento, e a bio ("onde esta o gargalo"). Nada disso
// e fabricado, e prova real de cliente nao sai da pagina por mudanca de
// posicionamento. Entao ha duas saidas, e a escolhida foi MARCAR, nao filtrar:
//
//   - Filtrar recriaria a assimetria que este repositorio existe para impedir,
//     so que ao contrario. A pagina continua mostrando os tres casos
//     (CredibilitySection) e as quatro fontes (rodape); o agente que nao os
//     conhecesse nao saberia responder — ou negaria — algo que o lead acabou de
//     ler na tela. Robo e comprador leem o mesmo conjunto.
//   - Marcar mantem o dado inteiro e diz ao agente o que ele sustenta.
//     `offerRelation` ('oferta-atual' | 'parcial' | 'historico') e `note`
//     acompanham cada evidencia e cada caso; `positioning.currentOffer` e
//     `notOfferedToday` dizem, em texto, o que se vende e o que nao se vende.
//
// A marcacao mora AQUI, no contexto publicado, e nao em content/*: cases.ts e
// evidence.ts garantem que so entra o que e verificavel e nao devem carregar
// posicionamento comercial. Cada item precisa estar classificado — um caso ou
// uma evidencia novos sem classificacao derrubam o build, em vez de chegar ao
// agente sem marca (ver `relacaoDe`).
//
// O `takeaway` das evidencias historicas sai como null: a "leitura" do estudo
// era a ponte para a oferta anterior (processo errado para automatizar, lead na
// primeira hora), nao dado. O numero, a afirmacao, a fonte, o ano, o metodo e o
// link seguem integros, e o texto original continua em content/evidence.ts.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PATHS } from '../src/content/paths';
import {
  OFFER_TERMS,
  FAQ,
  PRICE,
  IMPLEMENTATION_RANGE,
  MEASUREMENT,
} from '../src/content/offer';
import { EVIDENCE } from '../src/content/evidence';
import { CASES } from '../src/content/cases';
import { CONSULTANT } from '../src/content/consultant';
import { WHATSAPP_URL } from '../src/constants/links';

/**
 * O que cada clique de CTA significou.
 *
 * Escrito a mao, e nao derivado de content/intents.ts, porque as funcoes
 * daquele arquivo dependem de contexto de runtime e nao serializam. O agente
 * nao precisa da fala exata — ela ja esta na memoria da sessao, gravada pelo
 * proprio site via action: 'intent'. O que falta a ele e saber o que o clique
 * queria dizer.
 *
 * tests/agent-context.test.ts (CTX-08) le os IntentId direto de
 * content/intents.ts e exige que esta lista cubra exatamente esses ids: uma
 * intencao nova sem significado declarado aqui reprova o teste.
 */
const INTENT_MEANINGS = [
  {
    id: 'report-result',
    meaning:
      'Acabou de medir o próprio site e quer entender o que as notas significam. Chega com até duas notas independentes (Google e prontidão para agentes); qualquer uma pode vir null, que quer dizer não medida e nunca zero.',
  },
  {
    id: 'sem-site',
    meaning:
      'Declarou que ainda não tem site. É o caso de ordem invertida: antes de otimizar qualquer coisa, precisa existir para quem procura o que ele vende. O caminho é o site novo.',
  },
  {
    id: 'path-pick',
    meaning:
      'Escolheu um dos dois caminhos no cartão (site novo ou otimização) e quer falar sobre ele. O caminho escolhido chega em context.path.',
  },
  {
    id: 'credibility',
    meaning: 'Leu os casos e quer saber o que dá para fazer no site da empresa dele.',
  },
] as const;

/**
 * O que um item de prova sustenta, em relacao ao que a RIA vende HOJE.
 *
 *   'oferta-atual' — sustenta a medicao e o site (criar ou otimizar).
 *   'parcial'      — parte da entrega e a oferta atual, parte nao e.
 *   'historico'    — real e verificavel, mas sustenta o que se vendia antes.
 */
export type OfferRelation = 'oferta-atual' | 'parcial' | 'historico';

interface Marca {
  relation: OfferRelation;
  /** O que o agente precisa saber para nao vender o que nao se vende. */
  note: string | null;
}

/**
 * As evidencias, chaveadas por `source` (unica por construcao: EVID-04).
 *
 * As duas historicas continuam sendo dado real — o numero, a fonte, o ano e o
 * link vao integros. O que muda e o agente saber que elas eram argumento de
 * outra oferta.
 */
const EVIDENCIA: Record<string, Marca> = {
  'McKinsey — The State of AI': { relation: 'oferta-atual', note: null },
  'Cetic.br / CGI.br — TIC Empresas': { relation: 'oferta-atual', note: null },
  'MIT Project NANDA — The GenAI Divide': {
    relation: 'historico',
    note: 'Dado real e verificável, mas era argumento da oferta anterior (implantar agentes e automações). Não sustenta o que a RIA vende hoje, que é medir e melhorar sites. Use-o, no máximo, como contexto de mercado sobre projetos de IA; nunca como razão para contratar a RIA.',
  },
  'Harvard Business Review — The Short Life of Online Sales Leads': {
    relation: 'historico',
    note: 'Dado real e verificável, mas era argumento da oferta anterior (agente de vendas que responde leads na primeira hora). Não sustenta o que a RIA vende hoje, que é medir e melhorar sites. Use-o, no máximo, como contexto sobre atendimento de leads; nunca como razão para contratar a RIA.',
  },
};

/**
 * Os casos, chaveados por `segment` (sem nome de cliente, e unico na lista).
 *
 * Nenhum sai daqui: prova real de cliente nao sai do contexto por mudanca de
 * posicionamento. Ela so ganha a marca do que prova.
 */
const CASO: Record<string, Marca> = {
  'Design de interiores': {
    relation: 'parcial',
    note: 'A criação do site faz parte deste caso, e é o que a RIA vende hoje. A automação do atendimento e a gestão de mídias que vieram junto não são oferta atual: a oferta são os dois caminhos em `paths`.',
  },
  'Crédito': {
    relation: 'historico',
    note: 'Prova real, mas de um agente SDR autônomo, que não é o que a RIA vende hoje. Cite como trabalho já feito, nunca como serviço disponível.',
  },
  'Produto digital de decoração': {
    relation: 'historico',
    note: 'Prova real de capacidade de execução (desenvolvimento em parceria), não de uma oferta atual: a oferta são os dois caminhos em `paths`. Cite como trabalho já feito, nunca como serviço disponível.',
  },
};

/**
 * Cada item precisa estar classificado. Sem isto, uma evidencia ou um caso novo
 * chegaria ao agente sem marca e seria lido como oferta atual — o defeito que
 * esta classificacao existe para impedir. Cair aqui e cair no build, de
 * proposito: decidir o que o item sustenta e parte de adiciona-lo.
 */
function relacaoDe(tabela: Record<string, Marca>, chave: string, onde: string): Marca {
  const marca = tabela[chave];
  if (!marca) {
    throw new Error(
      `[agent-context] ${onde} "${chave}" nao esta classificado em scripts/build-agent-context.ts: ` +
        `diga se sustenta a oferta atual, parte dela ou so o historico.`
    );
  }
  return marca;
}

export interface AgentContext {
  readme: string;
  positioning: {
    entryProduct: string;
    entryProductSummary: string;
    /** O que a RIA vende hoje, em uma frase. */
    currentOffer: string;
    /** O que aparece na prova mas NAO e vendido hoje. */
    notOfferedToday: string[];
    /** Como ler `offerRelation` em `evidence` e `cases`. */
    historicalProof: string;
    firstCall: { minutes: number; free: boolean; format: string };
  };
  paths: { id: string; label: string; promise: string; tag: string; probe: string }[];
  measurement: {
    instruments: { name: string; measures: string }[];
    note: string;
  };
  offer: {
    price: string | null;
    implementationRange: string;
    terms: { label: string; value: string; detail: string }[];
  };
  faq: { question: string; answer: string }[];
  evidence: {
    value: string;
    claim: string;
    /** null quando a leitura do estudo era ponte para a oferta anterior. */
    takeaway: string | null;
    source: string;
    year: number;
    method: string;
    url: string;
    offerRelation: OfferRelation;
    note: string | null;
  }[];
  cases: {
    kind: string;
    segment: string;
    headline: string;
    before: string;
    intervention: string;
    timeframe: string;
    measurement: string | null;
    audited: boolean;
    offerRelation: OfferRelation;
    note: string | null;
  }[];
  consultant: {
    name: string;
    role: string;
    tagline: string;
    bio: string[];
    /** Como ler a bio: e o metodo de trabalho, nao um produto a venda. */
    methodNote: string;
    credentials: string[];
  };
  intents: { id: string; meaning: string }[];
  contact: { whatsapp: string };
}

export function buildAgentContext(): AgentContext {
  return {
    readme:
      'Gerado por scripts/build-agent-context.ts a partir de src/content/*. Nao edite a mao: a proxima build sobrescreve.',

    positioning: {
      entryProduct: 'Medição do site em duas notas independentes',
      entryProductSummary:
        'A página mede o site do visitante na primeira dobra, de graça e sem cadastro: a nota do Google Lighthouse (desempenho, acessibilidade, práticas recomendadas e SEO) e a nota de prontidão para agentes de IA, do Is Agentic (se ChatGPT, Gemini, Perplexity e Claude conseguem descobrir, acessar e usar o site). Depois do laudo, dois caminhos: site novo ou otimização do existente.',
      currentOffer:
        'Medir o site do visitante em duas notas independentes e, a partir do laudo, criar um site novo ou otimizar o que existe. São os dois caminhos em `paths`; não há outra oferta.',
      notOfferedToday: [
        'Agente de IA autônomo para prospecção e qualificação de leads (SDR)',
        'Automação de atendimento e de processos internos da empresa',
      ],
      historicalProof:
        'Em `evidence` e `cases`, `offerRelation` diz o que cada item sustenta. "oferta-atual" sustenta o que a RIA vende hoje. "parcial" mistura entrega atual e não atual, e a `note` separa as duas. "historico" é prova real de trabalho ou dado verificável sobre a oferta anterior: cite-o como trabalho já feito ou contexto de mercado, nunca como serviço disponível, e nunca o use para dizer que a RIA vende o que está em `notOfferedToday`.',
      firstCall: { minutes: 15, free: true, format: 'vídeo ou WhatsApp' },
    },

    paths: PATHS.map((p) => ({
      id: p.id,
      label: p.label,
      promise: p.promise,
      tag: p.tag,
      probe: p.probe,
    })),

    // Os dois instrumentos vem de content/offer.ts. A nota e parte do dado: o
    // agente nunca pode somar, fazer media ou resumir as duas numa so.
    measurement: {
      instruments: MEASUREMENT.instruments.map((i) => ({ name: i.name, measures: i.measures })),
      note: MEASUREMENT.note,
    },

    offer: {
      price: PRICE,
      implementationRange: IMPLEMENTATION_RANGE,
      terms: OFFER_TERMS.map((t) => ({ label: t.label, value: t.value, detail: t.detail })),
    },

    faq: FAQ.map((f) => ({ question: f.question, answer: f.answer })),

    // `icon` e LucideIcon: nao e JSON e nao diz nada ao agente.
    //
    // Nenhuma evidencia sai. As historicas perdem so o `takeaway` — a leitura que
    // era ponte para a oferta anterior — e ganham a marca e a nota.
    evidence: EVIDENCE.map((e) => {
      const { relation, note } = relacaoDe(EVIDENCIA, e.source, 'A evidência');
      return {
        value: e.value,
        claim: e.claim,
        takeaway: relation === 'historico' ? null : e.takeaway,
        source: e.source,
        year: e.year,
        method: e.method,
        url: e.url,
        offerRelation: relation,
        note,
      };
    }),

    // `audited` e o campo que decide se o agente pode falar do numero como
    // apurado. Hoje nenhum caso tem measurement, entao os tres chegam false —
    // e o prompt manda dizer que o numero foi informado pelo cliente.
    //
    // Os tres casos seguem inteiros; so ganham a marca do que provam.
    cases: CASES.map((c) => {
      const { relation, note } = relacaoDe(CASO, c.segment, 'O caso');
      return {
        kind: c.kind,
        segment: c.segment,
        headline: c.headline,
        before: c.before,
        intervention: c.intervention,
        timeframe: c.timeframe,
        measurement: c.measurement ?? null,
        audited: Boolean(c.measurement),
        offerRelation: relation,
        note,
      };
    }),

    // A bio e a mesma que a pagina mostra (CredibilitySection), entao nao e
    // reescrita aqui: o robo le o que o comprador le. A nota diz como le-la.
    consultant: {
      name: CONSULTANT.name,
      role: CONSULTANT.role,
      tagline: CONSULTANT.tagline,
      bio: [...CONSULTANT.bio],
      methodNote:
        'A bio descreve o método de trabalho do consultor: medir o processo, achar o ponto que trava e atacar o de maior custo. Hoje esse método se aplica à medição do site em duas notas. Ela não descreve um produto à venda; o que a RIA vende está em `positioning.currentOffer`.',
      credentials: [...CONSULTANT.credentials],
    },

    intents: INTENT_MEANINGS.map((i) => ({ id: i.id, meaning: i.meaning })),

    contact: { whatsapp: WHATSAPP_URL },
  };
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const destino = resolve(root, 'public/agent-context.json');
  writeFileSync(destino, JSON.stringify(buildAgentContext(), null, 2) + '\n', 'utf-8');
  console.log(`[RIA] agent-context.json gerado em ${destino}`);
}
