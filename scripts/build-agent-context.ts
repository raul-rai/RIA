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

export interface AgentContext {
  readme: string;
  positioning: {
    entryProduct: string;
    entryProductSummary: string;
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
    takeaway: string;
    source: string;
    year: number;
    method: string;
    url: string;
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
  }[];
  consultant: {
    name: string;
    role: string;
    tagline: string;
    bio: string[];
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
    evidence: EVIDENCE.map((e) => ({
      value: e.value,
      claim: e.claim,
      takeaway: e.takeaway,
      source: e.source,
      year: e.year,
      method: e.method,
      url: e.url,
    })),

    // `audited` e o campo que decide se o agente pode falar do numero como
    // apurado. Hoje nenhum caso tem measurement, entao os tres chegam false —
    // e o prompt manda dizer que o numero foi informado pelo cliente.
    cases: CASES.map((c) => ({
      kind: c.kind,
      segment: c.segment,
      headline: c.headline,
      before: c.before,
      intervention: c.intervention,
      timeframe: c.timeframe,
      measurement: c.measurement ?? null,
      audited: Boolean(c.measurement),
    })),

    consultant: {
      name: CONSULTANT.name,
      role: CONSULTANT.role,
      tagline: CONSULTANT.tagline,
      bio: [...CONSULTANT.bio],
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
