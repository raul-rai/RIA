import type { Front } from './fronts';
import { FRONTS } from './fronts';
import { formatList, scoreBand, uncoveredFronts } from '../lib/intent-format';

/**
 * As intencoes contextuais do agente.
 *
 * Cada CTA que leva ao chat carrega uma intencao. Ela vira duas falas: o que o
 * lead "diz" ao chegar e o que o agente responde na hora. As duas sao locais —
 * o n8n recebe as duas para memoria, mas nao responde a primeira. Ver
 * docs/superpowers/specs/2026-08-19-intencoes-contextuais-do-agente-design.md.
 */

export type IntentId =
  | 'hero-cold'
  | 'diagnostic-result'
  | 'diagnostic-no-website'
  | 'front-pick'
  | 'fronts-agenda'
  | 'credibility';

/** Segmentos aceitos em ?ref=. Fonte unica: o hero le daqui para a etiqueta,
 *  a intencao le daqui para a mensagem. */
export const REF_LABEL: Record<string, string> = {
  industria: 'Indústria',
  servicos: 'Serviços',
  varejo: 'Varejo',
};

/** Como o segmento abre a fala do lead. Nao da para derivar de REF_LABEL:
 *  "Tenho uma Serviços" nao e portugues. */
const REF_PHRASE: Record<string, string> = {
  industria: 'Tenho uma indústria',
  servicos: 'Tenho uma empresa de serviços',
  varejo: 'Tenho um varejo',
};

/** Le o ?ref da campanha. Valor desconhecido vira null — a intencao degrada
 *  para a variante sem segmento em vez de montar uma frase quebrada. */
export function readCampaignRef(search: string): string | null {
  const ref = new URLSearchParams(search).get('ref')?.toLowerCase();
  return ref && ref in REF_LABEL ? ref : null;
}

export const GREETING =
  'Olá. Sou o Agente de Inteligência da RIA. Me conte em uma frase o que sua empresa faz e onde o tempo da equipe está indo — eu volto com onde a IA paga mais rápido.';

export const NO_WEBSITE_GREETING =
  'Você ainda nem tem um site para surfar a era da inteligência artificial. Por isso seu índice bateu 101%: não existe página para o ChatGPT, o Gemini ou o Perplexity citarem quando alguém procura o que você vende. Me diga em uma frase o que sua empresa faz — eu volto com o que precisa estar no ar primeiro.';

export interface IntentContext {
  /** Segmento da campanha, ja validado por readCampaignRef. */
  ref: string | null;
  websiteScore: number | null;
  hasNoWebsite: boolean;
  frontsChecked: boolean[];
  /** Presente so em front-pick. */
  front?: Front;
}

export interface IntentDefinition {
  id: IntentId;
  /** O que o lead "diz" ao chegar no chat. */
  userMessage: (ctx: IntentContext) => string;
  /** O que o agente responde, instantaneo, sem passar pelo n8n. */
  agentReply: (ctx: IntentContext) => string;
}

/** front-pick sem frente e um estado impossivel pela UI, mas o tipo permite.
 *  Cair na frente 1 e melhor do que renderizar "undefined" no chat do lead. */
function pickedFront(ctx: IntentContext): Front {
  return ctx.front ?? FRONTS[0];
}

export const INTENTS: Record<IntentId, IntentDefinition> = {
  'hero-cold': {
    id: 'hero-cold',
    userMessage: (ctx) => {
      const abertura = ctx.ref ? REF_PHRASE[ctx.ref] : undefined;
      return abertura
        ? `${abertura} e quero parar de rasgar dinheiro. Por onde eu começo?`
        : 'Quero parar de rasgar dinheiro. Por onde eu começo?';
    },
    agentReply: () =>
      'Começa por saber onde está o vazamento. Na maioria das operações ele está em três lugares: lead que não é respondido, rotina que consome hora de gente cara, e decisão tomada no achismo. Me diz o que sua empresa faz — eu volto com qual dos três está te custando mais.',
  },

  'diagnostic-result': {
    id: 'diagnostic-result',
    userMessage: (ctx) =>
      ctx.websiteScore === null
        ? 'Fiz o diagnóstico do meu site e quero entender o que ele me custa.'
        : `Meu site tirou ${ctx.websiteScore}/100 no diagnóstico. Quero entender o que isso me custa.`,
    agentReply: (ctx) => {
      if (ctx.websiteScore === null)
        return 'Sem a nota eu não chuto o tamanho do buraco. Me diz o que sua empresa vende e pra quem — e, se puder, roda a auditoria do site aqui em cima que eu leio o resultado com você.';
      const cauda =
        ctx.websiteScore >= 80
          ? 'Então o gargalo não está na vitrine: está no que acontece depois que o lead chega. Me diz o que sua empresa vende e pra quem.'
          : 'A nota é sintoma — o custo está nas buscas e nas citações de IA que passam longe de você. Me diz o que sua empresa vende e pra quem.';
      return `${scoreBand(ctx.websiteScore)}. ${cauda}`;
    },
  },

  'diagnostic-no-website': {
    id: 'diagnostic-no-website',
    userMessage: () =>
      'Ainda não tenho site. Quero saber o que preciso pra existir na era da IA.',
    agentReply: () =>
      'Isso muda a ordem das coisas: antes de automatizar qualquer processo, você precisa existir para quem procura o que você vende. Me diz o que sua empresa faz e para quem — eu volto com o que precisa estar no ar primeiro, e em quanto tempo.',
  },

  'front-pick': {
    id: 'front-pick',
    userMessage: (ctx) => {
      const front = pickedFront(ctx);
      return `Quero falar sobre a frente ${front.id}: ${front.label}.`;
    },
    agentReply: (ctx) => {
      const front = pickedFront(ctx);
      return `${front.promise} Pra dimensionar isso na sua operação: o que sua empresa faz, e ${front.probe}?`;
    },
  },

  'fronts-agenda': {
    id: 'fronts-agenda',
    userMessage: (ctx) => {
      const faltando = uncoveredFronts(FRONTS, ctx.frontsChecked);
      const marcadas = FRONTS.length - faltando.length;
      if (marcadas === 0) return 'Não cubro nenhuma das seis frentes. Quero montar minha pauta.';
      if (faltando.length === 0)
        return 'Marquei as seis frentes. Quero saber o que ainda dá pra melhorar.';
      const verbo = faltando.length === 1 ? 'Falta' : 'Faltam';
      return `Marquei ${marcadas} de ${FRONTS.length}. ${verbo} ${formatList(
        faltando.map((f) => f.tag)
      )}. Quero montar minha pauta.`;
    },
    agentReply: (ctx) => {
      const faltando = uncoveredFronts(FRONTS, ctx.frontsChecked);
      if (faltando.length === 0)
        return 'Seis de seis é raro. Então a conversa deixa de ser sobre o que falta e passa a ser sobre o que está rodando abaixo do que poderia. Me diz o que sua empresa faz e qual dessas seis te dá mais trabalho hoje.';
      const primeira = faltando[0];
      const fecho =
        faltando.length === 1
          ? 'Me diz o que sua empresa faz que eu dimensiono essa e já abro a agenda.'
          : `Me diz o que sua empresa faz que eu ordeno as ${faltando.length} por retorno e já abro a agenda.`;
      return `Pauta anotada. Começo pela ${primeira.label} — ${primeira.promise} ${fecho}`;
    },
  },

  credibility: {
    id: 'credibility',
    userMessage: () => 'Vi os casos. Quero saber o que dá pra fazer na minha empresa.',
    agentReply: () =>
      'Operações diferentes, método igual. Me conta o que sua empresa faz e onde dói mais — eu volto com qual dos casos se parece com o seu.',
  },
};
