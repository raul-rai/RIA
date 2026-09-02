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

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FRONTS } from '../src/content/fronts';
import {
  OFFER_TERMS,
  FAQ,
  DIAGNOSTIC_PRICE,
  IMPLEMENTATION_RANGE,
} from '../src/content/offer';
import { EVIDENCE } from '../src/content/evidence';
import { CASES } from '../src/content/cases';
import { CONSULTANT } from '../src/content/consultant';
import { AUTHORITIES, AUTHORITIES_DISCLAIMER } from '../src/content/authorities';
import { WHATSAPP_URL } from '../src/constants/links';
import { FLOOR, NO_WEBSITE_INDEX } from '../src/context/VulnerabilityContext';

/**
 * O que cada clique de CTA significou.
 *
 * Escrito a mao, e nao derivado de content/intents.ts, porque as funcoes
 * daquele arquivo dependem de contexto de runtime e nao serializam. O agente
 * nao precisa da fala exata — ela ja esta na memoria da sessao, gravada pelo
 * proprio site via action: 'intent'. O que falta a ele e saber o que o clique
 * queria dizer.
 *
 * tests/agent-context.test.ts (CTX-08) exige que esta lista cubra exatamente
 * os IntentId de content/intents.ts.
 */
const INTENT_MEANINGS = [
  {
    id: 'hero-cold',
    meaning: 'Clicou no CTA do topo. Ainda nao se diagnosticou; chegou frio.',
  },
  {
    id: 'diagnostic-result',
    meaning: 'Acabou de auditar o proprio site e quer entender o que a nota custa.',
  },
  {
    id: 'diagnostic-no-website',
    meaning:
      'Declarou que ainda nao tem site. E o caso mais urgente e o de ordem invertida: existir antes de automatizar.',
  },
  {
    id: 'front-pick',
    meaning: 'Escolheu uma frente especifica no cartao e quer falar sobre ela.',
  },
  {
    id: 'fronts-agenda',
    meaning: 'Marcou o que ja cobre e pediu para montar a pauta com o que falta.',
  },
  {
    id: 'credibility',
    meaning: 'Leu os casos e quer saber o que da para fazer na empresa dele.',
  },
] as const;

export interface AgentContext {
  readme: string;
  positioning: {
    entryProduct: string;
    entryProductSummary: string;
    firstCall: { minutes: number; free: boolean; format: string };
  };
  fronts: { id: number; label: string; promise: string; tag: string; probe: string }[];
  offer: {
    diagnosticPrice: string | null;
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
    front: number | null;
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
  authorities: { name: string; title: string; quote: string }[];
  authoritiesDisclaimer: string;
  vulnerability: { floor: number; cap: number; noWebsiteIndex: number; note: string };
  intents: { id: string; meaning: string }[];
  contact: { whatsapp: string };
}

export function buildAgentContext(): AgentContext {
  return {
    readme:
      'Gerado por scripts/build-agent-context.ts a partir de src/content/*. Nao edite a mao: a proxima build sobrescreve.',

    positioning: {
      entryProduct: 'Diagnóstico de Gargalo',
      entryProductSummary:
        'Trinta dias medindo horas e volume das rotinas, no sistema do cliente. Sai com os três gargalos mais caros, em ordem de custo por hora, e o que atacar primeiro.',
      firstCall: { minutes: 15, free: true, format: 'vídeo ou WhatsApp' },
    },

    fronts: FRONTS.map((f) => ({
      id: f.id,
      label: f.label,
      promise: f.promise,
      tag: f.tag,
      probe: f.probe,
    })),

    offer: {
      diagnosticPrice: DIAGNOSTIC_PRICE,
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
      front: c.front ?? null,
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

    authorities: AUTHORITIES.map((a) => ({ name: a.name, title: a.title, quote: a.quote })),

    // Vai junto para o agente pelo mesmo motivo que esta na tela: se ele citar
    // uma das vozes, precisa saber que nenhuma delas endossa a RIA.
    authoritiesDisclaimer: AUTHORITIES_DISCLAIMER,

    vulnerability: {
      floor: FLOOR,
      cap: 95,
      noWebsiteIndex: NO_WEBSITE_INDEX,
      note:
        'O indice vai de 8 a 100. O valor 101 nao e medicao: e o marcador de que o visitante declarou nao ter site. Nunca o apresente como percentual de exposicao.',
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
