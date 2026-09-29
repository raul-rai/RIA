// O laudo agentico — segundo instrumento da dobra do laudo.
//
// Mede o que o Lighthouse nao mede: se um agente consegue DESCOBRIR, ACESSAR e
// USAR o site. Fonte: Is Agentic (Vercel Labs), API publica e somente leitura.
//
// A REGRA QUE ESTE ARQUIVO PROTEGE
//
// Resposta sem nota numerica devolve `null`, nunca um laudo com score 0. Zero e
// reprovacao e a tela le como reprovacao; ausencia de medicao e outra coisa, e
// dizer uma pela outra e o defeito que ja custou caro a esta pagina (ver a nota
// de remocao do `generateHeuristicDiagnostic` no historico).

export type IssueTier = 'essential' | 'recommended';
export type IssueResult = 'failed' | 'partial';

export interface AgenticIssue {
  id: string;
  name: string;
  tier: IssueTier;
  result: IssueResult;
  /** A evidencia: o que o scanner encontrou. E isto que faz do bloco um laudo. */
  details: string;
  recommendation: string;
}

export interface AgenticBucket {
  // Mesma regra do score: campo ausente ou de tipo errado vira `null`, nunca
  // `0`. `0` so aparece aqui quando a API mandou `0` de verdade (por exemplo
  // "0 de 7 checagens passaram" e um resultado medido, nao a ausencia dele).
  // Quem renderiza a coluna do laudo ("N de M checagens passaram") decide o
  // que exibir para `null` — nao esconde atras de um zero que parece reprovacao.
  earned: number | null;
  available: number | null;
  passing: number | null;
  total: number | null;
}

export interface AgenticReport {
  score: number;
  scoreLabel: string;
  scannedAt: string;
  /** O laudo publico deles, para quem quiser conferir. */
  reportUrl: string;
  essential: AgenticBucket;
  recommended: AgenticBucket;
  issues: AgenticIssue[];
}

export type AgenticFailure = 'rate-limited' | 'unreachable' | 'invalid-url';

const AGENTIC_FAILURES: readonly AgenticFailure[] = ['rate-limited', 'unreachable', 'invalid-url'];

/**
 * O motivo de falha que a ponte mandou, validado. Um `as AgenticFailure` no
 * cliente aceitaria qualquer coisa — motivo desconhecido chegaria ao cartao e
 * imprimiria "nao medido — undefined". Motivo que nao e um dos tres nomes vira
 * 'unreachable': continua sendo ausencia de medicao, com o nome mais generico.
 */
export function parseAgenticFailure(raw: unknown): AgenticFailure {
  return AGENTIC_FAILURES.find((reason) => reason === raw) ?? 'unreachable';
}

function texto(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

// Mesma checagem do `score` em parseAgenticReport: Number(null) e 0, Number('')
// e 0, Number(undefined) e NaN que cairia no fallback — qualquer coercao cega
// fabricaria um "zero medido" para um campo que so esta ausente. So aceitamos
// um `number` finito que a API realmente mandou; o resto vira `null`.
export function numero(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function bucket(raw: unknown): AgenticBucket {
  const b = (raw ?? {}) as Record<string, unknown>;
  return {
    earned: numero(b.earned),
    available: numero(b.available),
    passing: numero(b.passing),
    total: numero(b.total),
  };
}

/** Um apontamento so entra se tiver id, nome, nivel, resultado, `details` e
 *  `recommendation` reconheciveis (todos string). Descartar o malformado e
 *  melhor que imprimir "undefined" num laudo — e isso vale tambem para
 *  `details`, que e a propria evidencia que faz do bloco um laudo: um
 *  `details` de tipo errado nao vira `''` em silencio, derruba o apontamento
 *  inteiro, do mesmo jeito que um `id` ou `tier` invalido ja derrubava. */
function issue(raw: unknown): AgenticIssue | null {
  if (!raw || typeof raw !== 'object') return null;
  const i = raw as Record<string, unknown>;
  const tier = i.tier === 'essential' || i.tier === 'recommended' ? i.tier : null;
  const result = i.result === 'failed' || i.result === 'partial' ? i.result : null;
  if (
    typeof i.id !== 'string'
    || typeof i.name !== 'string'
    || !tier
    || !result
    || typeof i.details !== 'string'
    || typeof i.recommendation !== 'string'
  ) {
    return null;
  }
  return {
    id: i.id,
    name: i.name,
    tier,
    result,
    details: i.details,
    recommendation: i.recommendation,
  };
}

export function parseAgenticReport(raw: unknown): AgenticReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  // Number(null) e 0, um numero finito — coagir direto fabricaria uma nota
  // onde nao ha uma. So aceitamos um `number` de verdade, nunca outro tipo
  // convertido.
  if (typeof r.score !== 'number' || !Number.isFinite(r.score)) return null;
  const score = r.score;

  const breakdown = (r.score_breakdown ?? {}) as Record<string, unknown>;
  const issues = Array.isArray(r.issues)
    ? r.issues.map(issue).filter((i): i is AgenticIssue => i !== null)
    : [];

  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    scoreLabel: texto(r.score_label),
    scannedAt: texto(r.scanned_at),
    reportUrl: texto(r.report_url),
    essential: bucket(breakdown.essential),
    recommended: bucket(breakdown.recommended),
    issues,
  };
}

export function issuesByTier(report: AgenticReport, tier: IssueTier): AgenticIssue[] {
  return report.issues.filter((i) => i.tier === tier);
}

/**
 * Traduz o problema RFC 9457 deles para o que a tela sabe dizer.
 *
 * `rate-limited` e separado de `unreachable` de proposito: sao 10 scans por
 * minuto por IP, e na nossa funcao de borda o IP e o da Vercel — ou seja, o
 * limite e do SITE, nao do visitante. Ele precisa ler "a fila encheu", nao
 * "seu site nao respondeu", que seria uma acusacao falsa ao site dele.
 */
export function classifyProblem(status: number, code: unknown): AgenticFailure {
  if (status === 429 || code === 'rate_limit_exceeded') return 'rate-limited';
  if (status === 400 || code === 'invalid_url') return 'invalid-url';
  return 'unreachable';
}

/**
 * Endereco que vai para o scanner.
 *
 * Aceita so http/https: um `javascript:` ou `ftp:` digitado no campo nao pode
 * virar requisicao nossa. Sem ponto no host nao e dominio publico — e mandar
 * `localhost` para o scanner deles devolve laudo de nada.
 */
export function normalizeTarget(input: string): string | null {
  const limpo = input.trim();
  if (!limpo) return null;

  const comEsquema = /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
  let url: URL;
  try {
    url = new URL(comEsquema);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname.includes('.')) return null;
  return url.toString();
}
