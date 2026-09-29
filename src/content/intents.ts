import type { SitePath } from './paths';
import { PATHS } from './paths';
import { scoreBand, agenticBand } from '../lib/intent-format';

/**
 * As intencoes contextuais do agente.
 *
 * Cada CTA que leva ao chat carrega uma intencao. Ela vira duas falas: o que o
 * lead "diz" ao chegar e o que o agente responde na hora. As duas sao locais —
 * o n8n recebe as duas para memoria, mas nao responde a primeira. Ver
 * docs/superpowers/specs/2026-08-19-intencoes-contextuais-do-agente-design.md.
 *
 * As falas do agente comentam AS DUAS notas, cada uma na sua voz: a do Google
 * fala do site, a dos agentes fala de agente. Nenhuma fala junta as duas num
 * numero so — e nenhuma inventa nota que nao foi medida.
 */

export type IntentId =
  | 'report-result'
  | 'sem-site'
  | 'path-pick'
  | 'credibility';

/** Segmentos aceitos em ?ref=. Fonte unica: o hero le daqui para a etiqueta e
 *  readCampaignRef valida o valor da URL contra estas chaves. */
export const REF_LABEL: Record<string, string> = {
  industria: 'Indústria',
  servicos: 'Serviços',
  varejo: 'Varejo',
};

/** Le o ?ref da campanha. Valor desconhecido vira null — a intencao degrada
 *  para a variante sem segmento em vez de montar uma frase quebrada. */
export function readCampaignRef(search: string): string | null {
  const ref = new URLSearchParams(search).get('ref')?.toLowerCase();
  return ref && ref in REF_LABEL ? ref : null;
}

export const GREETING =
  'Olá. Sou o Agente de Inteligência da RIA. Me diga em uma frase o que sua empresa faz — eu volto com o que precisa mudar no seu site para ele ser encontrado, lido e citado.';

export const NO_WEBSITE_GREETING =
  'Sem site, não existe página para o ChatGPT, o Gemini ou o Perplexity citarem quando alguém procura o que você vende. Me diga em uma frase o que sua empresa faz — eu volto com o que precisa estar no ar primeiro.';

export interface IntentContext {
  /** Segmento da campanha, ja validado por readCampaignRef. Nenhuma intencao le
   *  este campo hoje: a unica que o lia, a hero-cold, saiu com o botao que a
   *  disparava (set/2026). */
  ref: string | null;
  /** Nota do Google (Lighthouse). null = nao medida — nunca 0. */
  googleScore: number | null;
  /** Nota de prontidao para agentes (Is Agentic). null = nao medida — nunca 0. */
  agenticScore: number | null;
  hasNoWebsite: boolean;
  /** Presente so em path-pick. */
  path?: SitePath;
}

export interface IntentDefinition {
  id: IntentId;
  /** O que o lead "diz" ao chegar no chat. */
  userMessage: (ctx: IntentContext) => string;
  /** O que o agente responde, instantaneo, sem passar pelo n8n. */
  agentReply: (ctx: IntentContext) => string;
}

/** path-pick sem caminho e um estado impossivel pela UI, mas o tipo permite.
 *  Cair no primeiro caminho e melhor do que renderizar "undefined" no chat. */
function pickedPath(ctx: IntentContext): SitePath {
  return ctx.path ?? PATHS[0];
}

export const INTENTS: Record<IntentId, IntentDefinition> = {
  'report-result': {
    id: 'report-result',
    userMessage: (ctx) => {
      const partes: string[] = [];
      if (ctx.googleScore !== null) partes.push(`${ctx.googleScore}/100 no Google`);
      if (ctx.agenticScore !== null) partes.push(`${ctx.agenticScore}/100 em prontidão para agentes`);
      if (partes.length === 0) return 'Medi meu site e quero entender o que o resultado significa.';
      return `Meu site tirou ${partes.join(' e ')}. Quero entender o que isso me custa.`;
    },
    agentReply: (ctx) => {
      if (ctx.googleScore === null && ctx.agenticScore === null)
        return 'Sem as notas eu não chuto o tamanho do buraco. Roda a medição aqui em cima que eu leio o resultado com você — e me diz o que sua empresa vende e para quem.';
      // Uma frase por instrumento, na voz de cada um. A que nao foi medida diz
      // que nao foi medida: calar sobre ela deixaria o lead achar que a
      // conversa ja cobriu as duas.
      const google =
        ctx.googleScore === null
          ? 'A nota do Google não foi medida.'
          : `${ctx.googleScore}/100 no Google. ${scoreBand(ctx.googleScore)}.`;
      const agentes =
        ctx.agenticScore === null
          ? 'A nota de prontidão para agentes não foi medida.'
          : `${ctx.agenticScore}/100 em prontidão para agentes: ${agenticBand(ctx.agenticScore)}.`;
      return `${google} ${agentes} Me diz o que sua empresa vende e para quem — eu volto com o que consertar primeiro e o que isso muda em quem chega até você.`;
    },
  },

  'sem-site': {
    id: 'sem-site',
    userMessage: () => 'Ainda não tenho site. Quero saber o que preciso para existir na era da IA.',
    agentReply: () =>
      'Então a ordem é outra: antes de otimizar qualquer coisa, você precisa existir para quem procura o que vende. Me diz o que sua empresa faz e para quem — eu volto com o que precisa estar no ar primeiro, e em quanto tempo.',
  },

  'path-pick': {
    id: 'path-pick',
    // "o caminho Site novo", e nao "sobre Site novo": o rotulo entra com
    // maiuscula e, solto no meio da frase, le como titulo colado.
    userMessage: (ctx) => `Quero falar sobre o caminho ${pickedPath(ctx).label}.`,
    agentReply: (ctx) => {
      const path = pickedPath(ctx);
      return `${path.promise} Pra dimensionar isso: o que sua empresa faz, e ${path.probe}?`;
    },
  },

  credibility: {
    id: 'credibility',
    userMessage: () => 'Vi os casos. Quero saber o que dá pra fazer no meu site.',
    agentReply: () =>
      'Operações diferentes, método igual. Me conta o que sua empresa faz e como as pessoas te encontram hoje — eu volto com qual dos casos se parece com o seu.',
  },
};
