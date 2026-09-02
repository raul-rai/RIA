// A quinta dimensão do laudo: o site é alcançável por um motor de IA?
//
// O QUE ISTO SUBSTITUI
//
// Até ago/2026 a dimensão "Navegação agêntica" era esta linha:
//
//     const d5 = d4 >= 80 ? 100 : d4 >= 50 ? 67 : 33;
//
// — uma função degrau da nota de SEO, publicada com porcentagem, barra e
// crachá "3/3" sob o rótulo "Fonte: Google Lighthouse (PageSpeed Insights)".
// O Lighthouse não mede navegação agêntica. A nota de SEO entrava DUAS vezes na
// média (15% como D4, mais 10% disfarçados de D5) fingindo ser dois
// instrumentos independentes.
//
// Era o mesmo pecado que motivou a remoção do `generateHeuristicDiagnostic` —
// e o comentário que documenta aquela remoção fica 250 linhas acima da linha
// acima, no mesmo arquivo.
//
// O QUE ENTRA NO LUGAR
//
// Três auditorias REAIS do Lighthouse, nomeadas, cada uma com score binário
// próprio na resposta da API. Verificadas contra a API de produção antes de
// entrarem aqui.
//
// O LIMITE, QUE A TELA PRECISA DIZER JUNTO
//
// Estas três medem se um motor CONSEGUE CHEGAR e SEGUIR a página. É condição
// necessária para ser citado, não suficiente: nenhuma delas responde se o HTML
// servido já contém o conteúdo antes do JavaScript rodar, que é a outra metade
// da Frente 1. O Lighthouse audita a página RENDERIZADA, então ele não tem como
// responder isso.
//
// `structured-data` ficou de fora de propósito: na API ela volta com
// `scoreDisplayMode: "manual"` e `score: null` — é um lembrete para humano
// conferir, não uma medição. Incluí-la seria repetir o defeito com outra roupa.

export interface AgenticCheck {
  /** Id da auditoria no Lighthouse, para quem quiser conferir na fonte. */
  id: string;
  /** Como o visitante lê. */
  label: string;
  ok: boolean;
}

export interface AgenticReadiness {
  pct: number;
  passed: number;
  total: number;
  checks: AgenticCheck[];
}

export const AGENTIC_AUDITS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'is-crawlable', label: 'Indexação liberada' },
  { id: 'crawlable-anchors', label: 'Links rastreáveis' },
  { id: 'robots-txt', label: 'robots.txt válido' },
];

/**
 * Lê as três auditorias do bloco `lighthouseResult.audits`.
 *
 * Devolve `null` quando QUALQUER uma delas falta ou vem sem score numérico.
 * Isso é deliberado e é o coração da correção: sem as três, a resposta honesta
 * é "não medido" — nunca uma nota parcial apresentada como se fosse completa,
 * e nunca zero, que a tela leria como reprovação.
 */
export function readAgenticReadiness(audits: unknown): AgenticReadiness | null {
  if (!audits || typeof audits !== 'object') return null;
  const fonte = audits as Record<string, { score?: unknown } | undefined>;

  const checks: AgenticCheck[] = [];
  for (const { id, label } of AGENTIC_AUDITS) {
    const score = fonte[id]?.score;
    // `null` aqui é auditoria manual ou não aplicável — ausência de medição,
    // não reprovação. Ver a nota sobre `structured-data` no topo.
    if (typeof score !== 'number' || !Number.isFinite(score)) return null;
    checks.push({ id, label, ok: score >= 1 });
  }

  const passed = checks.filter((c) => c.ok).length;
  return {
    pct: Math.round((passed / checks.length) * 100),
    passed,
    total: checks.length,
    checks,
  };
}

/** Peso de cada dimensão na nota geral. Somam 1. */
export const PESOS = { D1: 0.35, D2: 0.25, D3: 0.15, D4: 0.15, D5: 0.1 } as const;

/**
 * A nota geral.
 *
 * Quando D5 não foi medida, o peso dela é REDISTRIBUÍDO em vez de contar como
 * zero. A diferença não é de arredondamento: tratar ausência de medição como
 * nota zero derruba a nota geral em até 10 pontos por causa de algo que o
 * instrumento não conseguiu observar — exatamente o erro que esta dimensão já
 * cometeu uma vez, ao apresentar ausência como "3/3".
 */
export function overallScore(input: {
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number | null;
}): number {
  const { d1, d2, d3, d4, d5 } = input;
  const base = d1 * PESOS.D1 + d2 * PESOS.D2 + d3 * PESOS.D3 + d4 * PESOS.D4;
  if (d5 === null) return Math.round(base / (1 - PESOS.D5));
  return Math.round(base + d5 * PESOS.D5);
}
