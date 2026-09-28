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
  earned: number;
  available: number;
  passing: number;
  total: number;
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

function texto(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numero(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

/** Um apontamento so entra se tiver id, nome, nivel e resultado reconheciveis.
 *  Descartar o malformado e melhor que imprimir "undefined" num laudo. */
function issue(raw: unknown): AgenticIssue | null {
  if (!raw || typeof raw !== 'object') return null;
  const i = raw as Record<string, unknown>;
  const tier = i.tier === 'essential' || i.tier === 'recommended' ? i.tier : null;
  const result = i.result === 'failed' || i.result === 'partial' ? i.result : null;
  if (typeof i.id !== 'string' || typeof i.name !== 'string' || !tier || !result) return null;
  return {
    id: i.id,
    name: i.name,
    tier,
    result,
    details: texto(i.details),
    recommendation: texto(i.recommendation),
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
