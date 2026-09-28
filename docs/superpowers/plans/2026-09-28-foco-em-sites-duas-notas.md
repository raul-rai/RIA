# Foco em sites — scanner no hero e duas notas no laudo — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposicionar a landing para um verbo só — medir o site do visitante e consertá-lo — trocando o hero pelo scanner, publicando duas notas independentes (Google Lighthouse e Is Agentic) e substituindo as três frentes por dois caminhos (criar / otimizar).

**Architecture:** Toda lógica de medição e decisão vive em módulos puros sob `src/lib/`, testáveis em Node sem DOM; os componentes React só desenham. O scan do Is Agentic exige uma função de borda (`api/agentic-scan.ts`) porque o endpoint de disparo deles não tem CORS — ela repassa o SSE para o navegador, o que resolve o CORS e dá progresso real de graça. O contexto React encolhe de "índice de vulnerabilidade calculado" para "duas notas medidas".

**Tech Stack:** React 19 + Vite 6 + TypeScript 5.8, Tailwind 4, motion 12, Vitest 4 (ambiente `node`), funções de borda da Vercel, prerender próprio em Node.

**Spec:** `docs/superpowers/specs/2026-09-28-foco-em-sites-duas-notas-design.md`

## Global Constraints

- **Nenhum número exibido é fabricado.** Ausência de medição imprime "não medido", **nunca** `0` — zero a tela lê como reprovação.
- **Sem média entre as duas notas.** Nenhuma função pode somar, ponderar ou combinar `googleScore` com `agenticScore`.
- **Endpoints externos só em `src/config.ts`.** `tests/config.test.ts` reprova URL de serviço em qualquer outro arquivo de `src/`.
- **Ambiente de teste é `node`** (`vitest.config.ts`): não existe DOM, não existe testing-library. Componentes se testam por leitura de fonte como texto — padrão já usado em `tests/pacote.test.ts`, `tests/movimento.test.ts`, `tests/foco.test.ts`.
- **Testes rodam com `npm test`** (`vitest run`). Um teste isolado: `npx vitest run tests/<arquivo>.test.ts`.
- **Tipos:** `npm run lint` é `tsc --noEmit`. Precisa passar limpo ao fim de cada tarefa.
- **Todo commit termina com a linha de atribuição:** `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Português nos textos de tela e nos comentários**, seguindo o repositório. Comentário explica *por quê*, não *o quê*.
- `SESSION_MINUTES = 15` permanece fonte única. **Não** alterar para 30 — o conflito com o slug `/30min` do Cal.com é pendência registrada na spec, não tarefa deste plano.
- `DIAGNOSTIC_PRICE`/`PRICE` permanece `null`. **Não** preencher com estimativa: alimenta JSON-LD.
- A base do Is Agentic é `https://is-agentic.com`; limites deles: 120 leituras/min e **10 scans/min por IP**.

## Estrutura de arquivos

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/sse.ts` | Quebrar um buffer de bytes em quadros SSE. Puro. |
| `src/lib/agentic-report.ts` | Tipos e parsing do laudo Is Agentic + classificação de falha. Puro. |
| `src/lib/lighthouse-report.ts` | Parsing do PageSpeed em 4 dimensões + Core Web Vitals + nota geral. Puro. |
| `src/lib/agentic-scan-client.ts` | Consumo do nosso `/api/agentic-scan` (monta URL, lê o stream). |
| `src/lib/paths.ts` | Resolver qual caminho (criar/otimizar) a nota indica. Puro. |
| `src/content/paths.ts` | Os dois caminhos, como o visitante lê. |
| `src/context/SiteScoreContext.tsx` | Estado das duas notas + `hasNoWebsite` + caminho escolhido. |
| `src/hooks/useSiteScan.tsx` | Orquestra as duas medições em paralelo, num provedor de instância única. |
| `src/components/ScannerForm.tsx` | Campo de URL + CTAs. Vive no hero. |
| `src/components/ReportSection.tsx` | O capítulo do laudo: duas colunas. |
| `src/components/GoogleReportCard.tsx` | Coluna A. |
| `src/components/AgenticReportCard.tsx` | Coluna B. |
| `src/components/PathsSection.tsx` | Criar ou otimizar. |
| `api/agentic-scan.ts` | Função de borda: lê laudo pronto ou dispara scan, repassando SSE. |
| `tests/fixtures/is-agentic-report.json` | Resposta real da API deles, recortada. |

**Removidos:** `src/components/SocialProofSection.tsx`, `VideoWall3D.tsx`, `AuthorityCard.tsx`, `AuthorityAccordion.tsx`, `AwarenessCheck.tsx`, `VideoModal.tsx`, `PotentialDiagnostic.tsx`, `FrontsSection.tsx`, `src/hooks/useOrbitWall.ts`, `src/lib/orbit-wall.ts`, `src/lib/youtube.ts`, `src/lib/fronts.ts`, `src/lib/agentic-readiness.ts`, `src/content/authorities.ts`, `src/content/proofPanels.ts`, `src/content/fronts.ts`, `src/constants/socialNetworks.ts`, `src/context/VulnerabilityContext.tsx`, e os testes `authorities`, `orbit-wall`, `youtube`, `proof-panels`, `agentic-readiness`, `vulnerability`.

**Modificados:** `src/config.ts`, `src/content/offer.ts`, `src/content/meta.ts`, `src/content/intents.ts`, `src/content/privacy.ts`, `src/lib/qualification.ts`, `src/lib/intent-format.ts`, `src/components/EliteHUD.tsx`, `src/components/AIChatAgent.tsx`, `src/pages/LandingPage.tsx`, `src/index.css`, `scripts/prerender.js`, `scripts/build-agent-context.ts`, `api/mcp.ts`, `docs/n8n-contrato-agente.md`, e os testes `seo`, `pacote`, `movimento`, `terceiros`, `foco`, `dialogo`, `intents`, `intent-format`, `fronts`, `qualification`, `agent-context`.

---

### Task 1: Módulo puro do laudo agêntico

**Files:**
- Create: `src/lib/sse.ts`
- Create: `src/lib/agentic-report.ts`
- Create: `tests/fixtures/is-agentic-report.json`
- Test: `tests/agentic-report.test.ts`

**Interfaces:**
- Consumes: nada (primeira tarefa).
- Produces:
  - `parseSseFrames(buffer: string): { frames: string[]; rest: string }`
  - `type IssueTier = 'essential' | 'recommended'`
  - `type IssueResult = 'failed' | 'partial'`
  - `interface AgenticIssue { id: string; name: string; tier: IssueTier; result: IssueResult; details: string; recommendation: string }`
  - `interface AgenticBucket { earned: number; available: number; passing: number; total: number }`
  - `interface AgenticReport { score: number; scoreLabel: string; scannedAt: string; reportUrl: string; essential: AgenticBucket; recommended: AgenticBucket; issues: AgenticIssue[] }`
  - `type AgenticFailure = 'rate-limited' | 'unreachable' | 'invalid-url'`
  - `parseAgenticReport(raw: unknown): AgenticReport | null`
  - `classifyProblem(status: number, code: unknown): AgenticFailure`
  - `issuesByTier(report: AgenticReport, tier: IssueTier): AgenticIssue[]`

- [ ] **Step 1: Criar a fixture com a resposta real da API**

Crie `tests/fixtures/is-agentic-report.json` com exatamente este conteúdo (é a resposta real de 2026-09-07 para `raulvieira.vercel.app`, recortada para três apontamentos):

```json
{
  "target": "https://raulvieira.vercel.app",
  "display_target": "raulvieira.vercel.app",
  "report_url": "https://is-agentic.com/scan/raulvieira.vercel.app",
  "score": 72,
  "score_label": "Ready with a few material gaps",
  "scanned_at": "2026-09-07T15:35:19.037Z",
  "eligible_checks": 16,
  "score_breakdown": {
    "essential": { "earned": 59, "available": 80, "passing": 4, "total": 7 },
    "recommended": { "earned": 10.2, "available": 20, "passing": 3, "total": 9 },
    "bonus": { "points": 2.3, "positive_signals": 9 }
  },
  "issues": [
    {
      "id": "agent-friendly-404",
      "name": "Agent-friendly 404s",
      "tier": "essential",
      "result": "partial",
      "details": "Nonexistent paths return a real HTTP 404. For full credit, include a short markdown body (site map links, where to look next) so agents can recover.",
      "recommendation": "Return a real HTTP 404 (or 410) status for nonexistent paths."
    },
    {
      "id": "markdown-negotiation-vary",
      "name": "Markdown content negotiation (acceptmarkdown.com)",
      "tier": "essential",
      "result": "failed",
      "details": "Not acceptmarkdown.com compliant: Accept: text/markdown returned text/html; charset=utf-8; Vary header missing Accept (got \"none\")",
      "recommendation": "Add Accept to the Vary header (Vary: Accept, Accept-Encoding)."
    },
    {
      "id": "trust-anchors",
      "name": "Trust anchor pages",
      "tier": "recommended",
      "result": "failed",
      "details": "No trust anchor pages found with sufficient content (About, Contact, Privacy)",
      "recommendation": "Publish real /about, /contact, and /privacy pages with at least 500 characters of content each."
    }
  ]
}
```

- [ ] **Step 2: Escrever o teste que falha**

Crie `tests/agentic-report.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  parseAgenticReport, classifyProblem, issuesByTier,
} from '../src/lib/agentic-report';
import { parseSseFrames } from '../src/lib/sse';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/is-agentic-report.json'), 'utf-8')
);

describe('AGT: laudo do Is Agentic', () => {
  it('AGT-01: lê nota, rótulo, data e link de conferência', () => {
    const report = parseAgenticReport(fixture)!;
    expect(report.score).toBe(72);
    expect(report.scoreLabel).toBe('Ready with a few material gaps');
    expect(report.scannedAt).toBe('2026-09-07T15:35:19.037Z');
    expect(report.reportUrl).toBe('https://is-agentic.com/scan/raulvieira.vercel.app');
  });

  it('AGT-02: separa os apontamentos por nível', () => {
    const report = parseAgenticReport(fixture)!;
    expect(issuesByTier(report, 'essential').map((i) => i.id)).toEqual([
      'agent-friendly-404',
      'markdown-negotiation-vary',
    ]);
    expect(issuesByTier(report, 'recommended').map((i) => i.id)).toEqual(['trust-anchors']);
  });

  it('AGT-03: preserva o `details`, que é a evidência do laudo', () => {
    const report = parseAgenticReport(fixture)!;
    const vary = report.issues.find((i) => i.id === 'markdown-negotiation-vary')!;
    expect(vary.details).toContain('Vary header missing Accept');
    expect(vary.result).toBe('failed');
  });

  it('AGT-04: resposta sem nota numérica vira null — nunca zero', () => {
    expect(parseAgenticReport({ ...fixture, score: null })).toBeNull();
    expect(parseAgenticReport({ ...fixture, score: 'alto' })).toBeNull();
    expect(parseAgenticReport(null)).toBeNull();
    expect(parseAgenticReport('oi')).toBeNull();
  });

  it('AGT-05: apontamento malformado é descartado, o laudo sobrevive', () => {
    const sujo = { ...fixture, issues: [...fixture.issues, { id: 42 }, null] };
    const report = parseAgenticReport(sujo)!;
    expect(report.issues).toHaveLength(3);
  });

  it('AGT-06: classifica as falhas documentadas da API', () => {
    expect(classifyProblem(429, 'rate_limit_exceeded')).toBe('rate-limited');
    expect(classifyProblem(400, 'invalid_url')).toBe('invalid-url');
    expect(classifyProblem(503, 'report_temporarily_unavailable')).toBe('unreachable');
    expect(classifyProblem(500, undefined)).toBe('unreachable');
  });
});

describe('SSE: quadros', () => {
  it('SSE-01: separa quadros completos e devolve o resto', () => {
    const { frames, rest } = parseSseFrames('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"');
    expect(frames).toEqual(['data: {"a":1}', 'data: {"b":2}']);
    expect(rest).toBe('data: {"c"');
  });

  it('SSE-02: normaliza CRLF', () => {
    const { frames } = parseSseFrames('data: 1\r\n\r\n');
    expect(frames).toEqual(['data: 1']);
  });

  it('SSE-03: buffer sem quadro fechado não emite nada', () => {
    const { frames, rest } = parseSseFrames('data: parcial');
    expect(frames).toEqual([]);
    expect(rest).toBe('data: parcial');
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/agentic-report.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/agentic-report"`.

- [ ] **Step 4: Implementar `src/lib/sse.ts`**

```ts
// Quebra de quadros SSE.
//
// Existe separado do consumidor porque é a única parte do streaming que dá para
// testar sem rede: um quadro chega partido em dois `read()` com frequência, e é
// exatamente aí que um parser ingênuo perde eventos.

export interface SseSplit {
  /** Quadros completos, sem o separador. */
  frames: string[];
  /** O que sobrou depois do último separador — volta no próximo ciclo. */
  rest: string;
}

export function parseSseFrames(buffer: string): SseSplit {
  const normalizado = buffer.replace(/\r\n/g, '\n');
  const frames: string[] = [];
  let rest = normalizado;

  for (;;) {
    const corte = rest.indexOf('\n\n');
    if (corte === -1) break;
    frames.push(rest.slice(0, corte));
    rest = rest.slice(corte + 2);
  }

  return { frames, rest };
}

/** O JSON de um quadro `data: {...}`. `null` quando o quadro não traz JSON. */
export function sseData(frame: string): unknown {
  const linha = frame.split('\n').find((l) => l.startsWith('data:'));
  if (!linha) return null;
  try {
    return JSON.parse(linha.slice(5).trim());
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Implementar `src/lib/agentic-report.ts`**

```ts
// O laudo agêntico — segundo instrumento da dobra do laudo.
//
// Mede o que o Lighthouse não mede: se um agente consegue DESCOBRIR, ACESSAR e
// USAR o site. Fonte: Is Agentic (Vercel Labs), API pública e somente leitura.
//
// A REGRA QUE ESTE ARQUIVO PROTEGE
//
// Resposta sem nota numérica devolve `null`, nunca um laudo com score 0. Zero é
// reprovação e a tela lê como reprovação; ausência de medição é outra coisa, e
// dizer uma pela outra é o defeito que já custou caro a esta página (ver a nota
// de remoção do `generateHeuristicDiagnostic` no histórico).

export type IssueTier = 'essential' | 'recommended';
export type IssueResult = 'failed' | 'partial';

export interface AgenticIssue {
  id: string;
  name: string;
  tier: IssueTier;
  result: IssueResult;
  /** A evidência: o que o scanner encontrou. É isto que faz do bloco um laudo. */
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
  /** O laudo público deles, para quem quiser conferir. */
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

/** Um apontamento só entra se tiver id, nome, nível e resultado reconhecíveis.
 *  Descartar o malformado é melhor que imprimir "undefined" num laudo. */
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

  const score = Number(r.score);
  if (!Number.isFinite(score)) return null;

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
 * `rate-limited` é separado de `unreachable` de propósito: são 10 scans por
 * minuto por IP, e na nossa função de borda o IP é o da Vercel — ou seja, o
 * limite é do SITE, não do visitante. Ele precisa ler "a fila encheu", não
 * "seu site não respondeu", que seria uma acusação falsa ao site dele.
 */
export function classifyProblem(status: number, code: unknown): AgenticFailure {
  if (status === 429 || code === 'rate_limit_exceeded') return 'rate-limited';
  if (status === 400 || code === 'invalid_url') return 'invalid-url';
  return 'unreachable';
}
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/agentic-report.test.ts`
Expected: PASS — 9 testes.

- [ ] **Step 7: Verificar tipos**

Run: `npm run lint`
Expected: sem saída (sucesso).

- [ ] **Step 8: Commit**

```bash
git add src/lib/sse.ts src/lib/agentic-report.ts tests/agentic-report.test.ts tests/fixtures/is-agentic-report.json
git commit -m "feat: modulo puro do laudo agentico (Is Agentic) e quebra de quadros SSE" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Função de borda do scan + cliente

**Files:**
- Create: `api/agentic-scan.ts`
- Create: `src/lib/agentic-scan-client.ts`
- Modify: `src/config.ts`
- Test: `tests/agentic-scan.test.ts`

**Interfaces:**
- Consumes: `parseSseFrames`, `sseData` (`src/lib/sse.ts`); `parseAgenticReport`, `classifyProblem`, `AgenticFailure`, `AgenticReport` (`src/lib/agentic-report.ts`).
- Produces:
  - `normalizeTarget(input: string): string | null` (em `src/lib/agentic-report.ts`)
  - `type ScanEvent = { type: 'progress'; done: number; total: number } | { type: 'report'; report: AgenticReport } | { type: 'failure'; reason: AgenticFailure }`
  - `scanAgentic(url: string, onEvent: (e: ScanEvent) => void, signal?: AbortSignal): Promise<void>` (em `src/lib/agentic-scan-client.ts`)
  - `config.agenticScanPath` = `'/api/agentic-scan'`

**Contexto que o implementador precisa:** o endpoint de leitura deles (`/api/v1/report`) tem CORS aberto, mas o de **disparo** (`/api/scan/stream`) não — por isso a função de borda. Ela responde em `text/event-stream` desde o primeiro byte, o que evita o teto de resposta inicial da Vercel num scan que leva ~19 s, e ainda dá progresso real para a barra (hoje a barra é um `setInterval` com número aleatório).

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/agentic-scan.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { normalizeTarget } from '../src/lib/agentic-report';
import { config } from '../src/config';

const root = (p: string) => resolve(process.cwd(), p);

describe('SCAN: alvo do scan', () => {
  it('SCAN-01: completa o esquema quando falta', () => {
    expect(normalizeTarget('exemplo.com.br')).toBe('https://exemplo.com.br/');
  });

  it('SCAN-02: preserva https e http explícitos', () => {
    expect(normalizeTarget('https://exemplo.com.br/pagina')).toBe('https://exemplo.com.br/pagina');
    expect(normalizeTarget('http://exemplo.com.br/')).toBe('http://exemplo.com.br/');
  });

  it('SCAN-03: recusa o que não é endereço público', () => {
    expect(normalizeTarget('')).toBeNull();
    expect(normalizeTarget('sem-ponto')).toBeNull();
    expect(normalizeTarget('ftp://exemplo.com')).toBeNull();
    expect(normalizeTarget('javascript:alert(1)')).toBeNull();
  });

  it('SCAN-04: apara espaço em volta', () => {
    expect(normalizeTarget('  exemplo.com  ')).toBe('https://exemplo.com/');
  });
});

describe('SCAN: fronteira de configuração', () => {
  it('SCAN-05: o domínio do Is Agentic só aparece em config.ts e na função de borda', () => {
    const cliente = readFileSync(root('src/lib/agentic-scan-client.ts'), 'utf-8');
    expect(cliente, 'o cliente fala com a NOSSA rota, não com a deles').not.toContain('is-agentic.com');
    expect(cliente).toContain('config.agenticScanPath');
  });

  it('SCAN-06: a função de borda não inventa nota', () => {
    const fn = readFileSync(root('api/agentic-scan.ts'), 'utf-8');
    const semComentario = fn.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(semComentario, 'nenhum score literal na função').not.toMatch(/score:\s*\d/);
    expect(semComentario).toContain("type: 'failure'");
  });

  it('SCAN-07: a rota da nossa função está em config.ts', () => {
    expect(config.agenticScanPath).toBe('/api/agentic-scan');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/agentic-scan.test.ts`
Expected: FAIL — `normalizeTarget` não exportado.

- [ ] **Step 3: Acrescentar `normalizeTarget` a `src/lib/agentic-report.ts`**

Adicione ao fim do arquivo:

```ts
/**
 * Endereço que vai para o scanner.
 *
 * Aceita só http/https: um `javascript:` ou `ftp:` digitado no campo não pode
 * virar requisição nossa. Sem ponto no host não é domínio público — e mandar
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
```

- [ ] **Step 4: Acrescentar a rota a `src/config.ts`**

Dentro do objeto `config`, depois de `pageSpeedApiKey`:

```ts
  /**
   * Nossa função de borda que fala com o Is Agentic.
   *
   * É caminho relativo, não URL: o endpoint DELES (is-agentic.com) mora só na
   * função, em api/agentic-scan.ts, porque o disparo de scan não tem CORS e
   * portanto nunca pode ser chamado do navegador.
   */
  agenticScanPath: '/api/agentic-scan',
```

- [ ] **Step 5: Implementar `api/agentic-scan.ts`**

```ts
// Ponte para o Is Agentic (Vercel Labs).
//
// POR QUE ESTA FUNÇÃO EXISTE
//
// O endpoint de LEITURA deles (/api/v1/report) tem CORS aberto e poderia ser
// chamado direto do navegador. O de DISPARO (/api/scan/stream) não tem — o
// OPTIONS responde 204 sem Access-Control-Allow-Origin. Como um site que nunca
// foi escaneado precisa do disparo, o caminho inteiro passa por aqui.
//
// POR QUE ELA RESPONDE EM STREAMING
//
// Um scan novo leva ~19 s (medido em 2026-09-21). Segurar a resposta esse tempo
// encosta no teto de resposta inicial da plataforma; devolvendo text/event-stream
// o primeiro byte sai imediatamente. De brinde, o progresso vira real: a barra da
// página era um setInterval com incremento aleatório.
//
// O LIMITE QUE O CHAMADOR PRECISA SABER
//
// São 10 scans por minuto POR IP, e o IP visto pelo Is Agentic é o desta função,
// não o do visitante — ou seja, o limite é global do site. Por isso 429 vira um
// evento de falha nomeado ('rate-limited'), que a tela traduz como fila cheia.

import { normalizeTarget, classifyProblem } from '../src/lib/agentic-report';
import { parseSseFrames, sseData } from '../src/lib/sse';

export const config = { runtime: 'edge' };

const BASE = 'https://is-agentic.com';
const UA = 'ria-site/1.0 (+https://raulvieira.vercel.app)';

function sse(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function readReport(target: string): Promise<
  { ok: true; body: unknown } | { ok: false; status: number; code: unknown }
> {
  const endpoint = new URL('/api/v1/report', BASE);
  endpoint.searchParams.set('url', target);
  const response = await fetch(endpoint, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  const body = await response.json().catch(() => null);
  if (response.ok) return { ok: true, body };
  const code = body && typeof body === 'object' ? (body as Record<string, unknown>).code : undefined;
  return { ok: false, status: response.status, code };
}

export default async function handler(request: Request): Promise<Response> {
  const alvo = normalizeTarget(new URL(request.url).searchParams.get('url') ?? '');

  const stream = new ReadableStream({
    async start(controller) {
      const enfileira = (event: unknown) => controller.enqueue(new TextEncoder().encode(sse(event)));

      if (!alvo) {
        enfileira({ type: 'failure', reason: 'invalid-url' });
        controller.close();
        return;
      }

      try {
        // 1. Laudo já arquivado? Devolve na hora — é o caminho barato.
        const pronto = await readReport(alvo);
        if (pronto.ok) {
          enfileira({ type: 'report', report: pronto.body });
          controller.close();
          return;
        }

        // 404 é o único erro que justifica gastar um scan. Os outros são falha.
        if (pronto.status !== 404) {
          enfileira({ type: 'failure', reason: classifyProblem(pronto.status, pronto.code) });
          controller.close();
          return;
        }

        // 2. Sem laudo: dispara o scan e acompanha até o arquivamento.
        const scan = new URL('/api/scan/stream', BASE);
        scan.searchParams.set('target', alvo);
        const upstream = await fetch(scan, {
          headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-store', 'User-Agent': UA },
        });

        if (!upstream.ok || !upstream.body) {
          const code = upstream.status === 429 ? 'rate_limit_exceeded' : undefined;
          enfileira({ type: 'failure', reason: classifyProblem(upstream.status, code) });
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let total = 0;
        let done = 0;
        let arquivado = false;

        for (;;) {
          const { done: fim, value } = await reader.read();
          if (fim) break;
          buffer += decoder.decode(value, { stream: true });
          const { frames, rest } = parseSseFrames(buffer);
          buffer = rest;

          for (const frame of frames) {
            const evento = sseData(frame) as Record<string, unknown> | null;
            if (!evento || typeof evento.type !== 'string') continue;
            if (evento.type === 'scan_init' && Array.isArray(evento.checkRoster)) {
              total = evento.checkRoster.length;
            } else if (evento.type === 'check_complete') {
              done += 1;
              enfileira({ type: 'progress', done, total });
            } else if (evento.type === 'scan_archived') {
              arquivado = true;
            } else if (evento.type === 'error') {
              enfileira({ type: 'failure', reason: 'unreachable' });
              controller.close();
              return;
            }
          }
        }

        if (!arquivado) {
          enfileira({ type: 'failure', reason: 'unreachable' });
          controller.close();
          return;
        }

        // 3. O scan arquivou: relê o laudo, que agora existe.
        const depois = await readReport(alvo);
        if (depois.ok) enfileira({ type: 'report', report: depois.body });
        else enfileira({ type: 'failure', reason: classifyProblem(depois.status, depois.code) });
      } catch {
        // Qualquer exceção vira falha nomeada. Nunca nota.
        enfileira({ type: 'failure', reason: 'unreachable' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    },
  });
}
```

- [ ] **Step 6: Implementar `src/lib/agentic-scan-client.ts`**

```ts
// Consumo da nossa ponte /api/agentic-scan.
//
// `fetch` + leitor de stream em vez de EventSource por uma razão só: EventSource
// não dá para cancelar com AbortSignal, e a medição precisa morrer junto com o
// componente quando o visitante muda de ideia no meio.

import { config } from '../config';
import { parseSseFrames, sseData } from './sse';
import { parseAgenticReport, type AgenticFailure, type AgenticReport } from './agentic-report';

export type ScanEvent =
  | { type: 'progress'; done: number; total: number }
  | { type: 'report'; report: AgenticReport }
  | { type: 'failure'; reason: AgenticFailure };

export function scanUrl(target: string): string {
  return `${config.agenticScanPath}?url=${encodeURIComponent(target)}`;
}

export async function scanAgentic(
  target: string,
  onEvent: (event: ScanEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(scanUrl(target), { signal });
  } catch {
    onEvent({ type: 'failure', reason: 'unreachable' });
    return;
  }

  if (!response.ok || !response.body) {
    onEvent({ type: 'failure', reason: 'unreachable' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = parseSseFrames(buffer);
      buffer = rest;

      for (const frame of frames) {
        const evento = sseData(frame) as Record<string, unknown> | null;
        if (!evento) continue;

        if (evento.type === 'progress') {
          onEvent({ type: 'progress', done: Number(evento.done) || 0, total: Number(evento.total) || 0 });
        } else if (evento.type === 'report') {
          const report = parseAgenticReport(evento.report);
          // Laudo que não parseia é ausência de medição, não nota ruim.
          onEvent(report ? { type: 'report', report } : { type: 'failure', reason: 'unreachable' });
        } else if (evento.type === 'failure') {
          onEvent({ type: 'failure', reason: evento.reason as AgenticFailure });
        }
      }
    }
  } catch {
    if (!signal?.aborted) onEvent({ type: 'failure', reason: 'unreachable' });
  } finally {
    reader.releaseLock();
  }
}
```

- [ ] **Step 7: Rodar os testes e confirmar que passam**

Run: `npx vitest run tests/agentic-scan.test.ts tests/config.test.ts`
Expected: PASS nos dois arquivos.

- [ ] **Step 8: Verificar tipos**

Run: `npm run lint`
Expected: sem saída.

- [ ] **Step 9: Verificação manual contra a API real**

Run: `curl -s "https://is-agentic.com/api/v1/report?url=https%3A%2F%2Fraulvieira.vercel.app" | head -c 200`
Expected: JSON começando em `{"target":"https://raulvieira.vercel.app"` — confirma que o contrato de leitura não mudou desde a escrita deste plano.

- [ ] **Step 10: Commit**

```bash
git add api/agentic-scan.ts src/lib/agentic-scan-client.ts src/lib/agentic-report.ts src/config.ts tests/agentic-scan.test.ts
git commit -m "feat: ponte de borda para o scan do Is Agentic, com progresso real por SSE" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Módulo puro do laudo Google (sem a D5)

**Files:**
- Create: `src/lib/lighthouse-report.ts`
- Test: `tests/lighthouse-report.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface WebVital { id: string; name: string; value: string; score: number }`
  - `interface GoogleReport { score: number; dimensions: { id: 'D1'|'D2'|'D3'|'D4'; nome: string; pct: number }[]; webVitals: WebVital[]; reading: { nivel: number; nome: string; texto: string } }`
  - `PESOS = { D1: 0.4, D2: 0.25, D3: 0.15, D4: 0.2 }`
  - `parseLighthouse(raw: unknown): GoogleReport | null`
  - `pageSpeedUrl(target: string, apiKey: string): string`

**Contexto:** isto é a extração do que hoje vive solto dentro de `PotentialDiagnostic.tsx` (linhas ~255–345), **menos a D5**. Os pesos mudam porque a dimensão que saía valia 0,1: em vez de rateio com decimal feio, a redistribuição é explícita — SEO sobe de 0,15 para 0,20 por ser, agora, o único sinal de encontrabilidade dentro do laudo Google (o resto migrou para o laudo agêntico), e Performance sobe de 0,35 para 0,40.

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/lighthouse-report.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseLighthouse, pageSpeedUrl, PESOS } from '../src/lib/lighthouse-report';

const bruto = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.5 },
      accessibility: { score: 0.9 },
      'best-practices': { score: 1 },
      seo: { score: 0.8 },
    },
    audits: {
      'largest-contentful-paint': { displayValue: '2,8 s', score: 0.4 },
      'first-contentful-paint': { displayValue: '1,2 s', score: 0.9 },
      'cumulative-layout-shift': { displayValue: '0,02', score: 1 },
      'total-blocking-time': { displayValue: '210 ms', score: 0.6 },
    },
  },
};

describe('LH: laudo do Lighthouse', () => {
  it('LH-01: os pesos somam 1', () => {
    expect(PESOS.D1 + PESOS.D2 + PESOS.D3 + PESOS.D4).toBeCloseTo(1, 10);
  });

  it('LH-02: quatro dimensões, nenhuma quinta', () => {
    const r = parseLighthouse(bruto)!;
    expect(r.dimensions.map((d) => d.id)).toEqual(['D1', 'D2', 'D3', 'D4']);
    expect(r.dimensions.map((d) => d.pct)).toEqual([50, 90, 100, 80]);
  });

  it('LH-03: a nota geral é a média ponderada das quatro', () => {
    const r = parseLighthouse(bruto)!;
    expect(r.score).toBe(Math.round(50 * 0.4 + 90 * 0.25 + 100 * 0.15 + 80 * 0.2));
  });

  it('LH-04: publica os quatro Core Web Vitals com o valor legível', () => {
    const r = parseLighthouse(bruto)!;
    expect(r.webVitals.map((v) => v.id)).toEqual(['lcp', 'fcp', 'cls', 'tbt']);
    expect(r.webVitals[0].value).toBe('2,8 s');
    expect(r.webVitals[3].score).toBe(60);
  });

  it('LH-05: resposta sem categorias vira null — nunca laudo zerado', () => {
    expect(parseLighthouse({ lighthouseResult: { categories: {} } })).toBeNull();
    expect(parseLighthouse({})).toBeNull();
    expect(parseLighthouse(null)).toBeNull();
  });

  it('LH-06: a leitura acompanha a faixa da nota', () => {
    expect(parseLighthouse(bruto)!.reading.nivel).toBe(2);
    const alto = { lighthouseResult: { ...bruto.lighthouseResult, categories: {
      performance: { score: 1 }, accessibility: { score: 1 },
      'best-practices': { score: 1 }, seo: { score: 1 },
    } } };
    expect(parseLighthouse(alto)!.reading.nivel).toBe(3);
  });

  it('LH-07: monta a URL do PageSpeed com as quatro categorias', () => {
    const url = pageSpeedUrl('https://exemplo.com/', 'CHAVE');
    expect(url).toContain('category=performance');
    expect(url).toContain('category=accessibility');
    expect(url).toContain('category=best-practices');
    expect(url).toContain('category=seo');
    expect(url).toContain('strategy=mobile');
    expect(url).toContain('key=CHAVE');
  });

  it('LH-08: sem chave, a URL não leva parâmetro key vazio', () => {
    expect(pageSpeedUrl('https://exemplo.com/', '')).not.toContain('key=');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/lighthouse-report.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `src/lib/lighthouse-report.ts`**

```ts
// O laudo do Google — primeiro instrumento da dobra do laudo.
//
// Era código solto dentro de PotentialDiagnostic.tsx. Saiu de lá por duas
// razões: a única maneira de testá-lo aqui é como módulo puro (o ambiente de
// teste é `node`, sem DOM), e porque o componente passou de 900 linhas fazendo
// medição, parsing e desenho ao mesmo tempo.
//
// A QUINTA DIMENSÃO NÃO EXISTE MAIS
//
// "Navegação agêntica" eram três auditorias do Lighthouse (is-crawlable,
// crawlable-anchors, robots-txt) que medem se um crawler CHEGA à página — não
// se um agente consegue USÁ-LA. Isso agora é medido pelo instrumento certo, no
// laudo ao lado (lib/agentic-report.ts). Manter as duas seria publicar o mesmo
// sinal duas vezes, com a nota fraca puxando a forte.

import { config } from '../config';

export interface WebVital {
  id: string;
  name: string;
  value: string;
  score: number;
}

export interface GoogleDimension {
  id: 'D1' | 'D2' | 'D3' | 'D4';
  nome: string;
  pct: number;
}

export interface GoogleReport {
  score: number;
  dimensions: GoogleDimension[];
  webVitals: WebVital[];
  reading: { nivel: number; nome: string; texto: string };
}

/**
 * Peso de cada dimensão. Somam 1.
 *
 * Eram cinco pesos (0,35 / 0,25 / 0,15 / 0,15 / 0,10). Com a saída da D5, os
 * 0,10 dela foram redistribuídos de forma explícita em vez de rateados com
 * decimal infinito: SEO sobe para 0,20 por ser agora o único sinal de
 * encontrabilidade dentro DESTE laudo, e Performance para 0,40.
 */
export const PESOS = { D1: 0.4, D2: 0.25, D3: 0.15, D4: 0.2 } as const;

const pct = (score: unknown): number => Math.round((Number(score) || 0) * 100);

export function pageSpeedUrl(target: string, apiKey: string): string {
  const params = new URLSearchParams({ url: target, strategy: 'mobile' });
  for (const c of ['performance', 'seo', 'accessibility', 'best-practices']) {
    params.append('category', c);
  }
  if (apiKey) params.append('key', apiKey);
  return `${config.pageSpeedApiUrl}?${params.toString()}`;
}

export function parseLighthouse(raw: unknown): GoogleReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const resultado = (raw as Record<string, any>).lighthouseResult;
  const categorias = resultado?.categories;

  // Sem a categoria de performance não há laudo. Melhor nenhuma nota que uma
  // nota montada sobre ausência.
  if (!categorias?.performance) return null;

  const d1 = pct(categorias.performance?.score);
  const d2 = pct(categorias.accessibility?.score);
  const d3 = pct(categorias['best-practices']?.score);
  const d4 = pct(categorias.seo?.score);

  const score = Math.round(d1 * PESOS.D1 + d2 * PESOS.D2 + d3 * PESOS.D3 + d4 * PESOS.D4);
  const audits = resultado?.audits ?? {};

  const vital = (id: string, name: string, fallback: number): WebVital => ({
    id,
    name,
    value: audits[id]?.displayValue || '—',
    score: Math.round((audits[id]?.score ?? fallback) * 100),
  });

  const [nivel, nome, texto] =
    score >= 80
      ? [3, 'Otimizado', 'Velocidade, estrutura semântica e conformidade técnica dentro das diretrizes do Google.']
      : score >= 50
        ? [2, 'Atenção requerida', 'Boa base técnica, com ajustes de carregamento e marcação semântica pendentes.']
        : [1, 'Crítico', 'Gargalos severos de carregamento e estruturação detectados pelo Lighthouse.'];

  return {
    score,
    dimensions: [
      { id: 'D1', nome: 'Desempenho', pct: d1 },
      { id: 'D2', nome: 'Acessibilidade', pct: d2 },
      { id: 'D3', nome: 'Práticas recomendadas', pct: d3 },
      { id: 'D4', nome: 'SEO', pct: d4 },
    ],
    webVitals: [
      vital('largest-contentful-paint', 'LCP (Maior Pintura)', d1 / 100),
      vital('first-contentful-paint', 'FCP (Primeira Pintura)', d1 / 100),
      vital('cumulative-layout-shift', 'CLS (Estabilidade Visual)', 1),
      vital('total-blocking-time', 'TBT (Tempo de Bloqueio)', 1),
    ],
    reading: { nivel, nome: nome as string, texto: texto as string },
  };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/lighthouse-report.test.ts`
Expected: PASS — 8 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lighthouse-report.ts tests/lighthouse-report.test.ts
git commit -m "feat: laudo do Lighthouse vira modulo puro de quatro dimensoes" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Os dois caminhos substituem as três frentes

**Files:**
- Create: `src/content/paths.ts`
- Create: `src/lib/paths.ts`
- Delete: `src/content/fronts.ts`, `src/lib/fronts.ts`, `tests/fronts.test.ts`
- Modify: `src/lib/qualification.ts`, `src/lib/intent-format.ts`, `tests/intent-format.test.ts`, `tests/qualification.test.ts`, `docs/n8n-contrato-agente.md`
- Test: `tests/paths.test.ts`

**Interfaces:**
- Consumes: nada de tarefas anteriores.
- Produces:
  - `type PathId = 'novo' | 'otimizar'`
  - `interface SitePath { id: PathId; label: string; promise: string; tag: string; probe: string }`
  - `PATHS: SitePath[]`, `pathById(id: PathId): SitePath`
  - `HEALTHY_SITE_SCORE = 70`
  - `resolvePath(input: { hasNoWebsite: boolean; googleScore: number | null }): PathId | null`
  - `QualificationPayload['context']` passa a ser `{ hasNoWebsite: boolean; googleScore: number | null; agenticScore: number | null; path: PathId | null }`

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/paths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PATHS, pathById } from '../src/content/paths';
import { resolvePath, HEALTHY_SITE_SCORE } from '../src/lib/paths';

describe('PATH: os dois caminhos', () => {
  it('PATH-01: são exatamente dois, com ids estáveis', () => {
    expect(PATHS.map((p) => p.id)).toEqual(['novo', 'otimizar']);
  });

  it('PATH-02: cada um tem rótulo, promessa, etiqueta e sondagem', () => {
    for (const p of PATHS) {
      expect(p.label.length, `${p.id} sem rótulo`).toBeGreaterThan(3);
      expect(p.promise.length, `${p.id} sem promessa`).toBeGreaterThan(20);
      expect(p.tag.length, `${p.id} sem etiqueta`).toBeGreaterThan(2);
      // A sondagem entra no meio de uma frase: minúscula e sem ponto final.
      expect(p.probe[0]).toBe(p.probe[0].toLowerCase());
      expect(p.probe.endsWith('.'), `${p.id}: probe não leva ponto`).toBe(false);
    }
  });

  it('PATH-03: pathById devolve o caminho pedido', () => {
    expect(pathById('novo').id).toBe('novo');
    expect(pathById('otimizar').id).toBe('otimizar');
  });
});

describe('PATH: qual caminho a medição indica', () => {
  it('PATH-04: sem site, o caminho é criar', () => {
    expect(resolvePath({ hasNoWebsite: true, googleScore: null })).toBe('novo');
  });

  it('PATH-05: sem medição, nenhum caminho é sugerido', () => {
    expect(resolvePath({ hasNoWebsite: false, googleScore: null })).toBeNull();
  });

  it('PATH-06: com site medido, o caminho é otimizar — em qualquer faixa', () => {
    expect(resolvePath({ hasNoWebsite: false, googleScore: 20 })).toBe('otimizar');
    expect(resolvePath({ hasNoWebsite: false, googleScore: HEALTHY_SITE_SCORE })).toBe('otimizar');
    expect(resolvePath({ hasNoWebsite: false, googleScore: 98 })).toBe('otimizar');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/paths.test.ts`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Criar `src/content/paths.ts`**

```ts
// Os dois caminhos.
//
// MUDANÇA DE POSICIONAMENTO (set/2026): eram três frentes — presença digital,
// agente SDR e automação de processos. Três coisas diferentes numa página só é
// cardápio, e cardápio obriga o visitante a escolher antes de entender.
//
// Agora a página faz uma coisa: mede o site e conserta. Os dois caminhos abaixo
// não são um menu, são o resultado da medição. Quem não tem site vai para
// `novo`; quem tem, e acabou de ver a nota, vai para `otimizar`.
//
// Ver src/lib/paths.ts — a escolha chega pré-resolvida pelo laudo.

export type PathId = 'novo' | 'otimizar';

export interface SitePath {
  id: PathId;
  /** Como o visitante lê no cartão. */
  label: string;
  /** O que o caminho entrega, numa linha. */
  promise: string;
  /** Etiqueta curta, para quando um caso ou o agente cita o caminho. */
  tag: string;
  /**
   * A pergunta que o agente faz quando o lead escolhe este caminho. Entra no
   * meio de uma frase ("o que sua empresa faz, e {probe}?"), então começa em
   * minúscula e não leva pontuação final.
   */
  probe: string;
}

export const PATHS: SitePath[] = [
  {
    id: 'novo',
    label: 'Site novo',
    promise:
      'Um site construído desde o começo para ser rápido, encontrável e legível por ChatGPT, Gemini e Perplexity — não um modelo pronto com o seu logo em cima.',
    tag: 'Criação',
    probe: 'o que alguém precisa encontrar quando procura o que você vende',
  },
  {
    id: 'otimizar',
    label: 'Otimização',
    promise:
      'O site que já existe passa a carregar rápido, aparecer na busca e responder ao que os agentes de IA perguntam — corrigindo exatamente o que o laudo apontou.',
    tag: 'Otimização',
    probe: 'qual desses pontos do laudo mais te preocupa',
  },
];

export function pathById(id: PathId): SitePath {
  const found = PATHS.find((p) => p.id === id);
  // Impossível pela UI, mas o tipo permite chamada direta. Cair no primeiro é
  // melhor que devolver undefined para dentro de uma string de chat.
  return found ?? PATHS[0];
}
```

- [ ] **Step 4: Criar `src/lib/paths.ts`**

```ts
import type { PathId } from '../content/paths';

/**
 * Corte de saúde do site.
 *
 * Mantido do arquivo que este substitui (lib/fronts.ts) porque outros textos
 * ainda o citam como referência de faixa. Não decide mais o caminho — decide
 * só o tom com que o agente comenta a nota.
 */
export const HEALTHY_SITE_SCORE = 70;

export interface PathInput {
  hasNoWebsite: boolean;
  googleScore: number | null;
}

/**
 * Qual caminho a medição indica.
 *
 * `null` significa "o visitante ainda não mediu" — os dois cartões aparecem
 * neutros, sem nenhum destacado. Não confundir com uma recomendação fraca:
 * destacar um caminho sem medição seria fingir que a página sabe algo que ela
 * não sabe.
 *
 * Nota alta também cai em `otimizar`, de propósito: nota boa não quer dizer que
 * não há o que fazer, quer dizer que o trabalho é outro — e quem decide isso é
 * a conversa, não esta função. O que muda com a faixa é o texto do agente
 * (ver scoreBand em lib/intent-format.ts), não o caminho.
 */
export function resolvePath(input: PathInput): PathId | null {
  if (input.hasNoWebsite) return 'novo';
  if (input.googleScore === null) return null;
  return 'otimizar';
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run tests/paths.test.ts`
Expected: PASS — 6 testes.

- [ ] **Step 6: Reescrever `src/lib/intent-format.ts`**

Substitua o import e a função `uncoveredFronts` (a lista de frentes descobertas deixa de existir). O arquivo inteiro passa a ser:

```ts
/**
 * Lista legivel dentro de uma frase: "A, B e C".
 *
 * Existe porque join(', ') produz "A, B, C" — que ninguem fala. A mensagem
 * injetada no chat se apresenta como fala do lead; se ela nao soar como fala,
 * a ilusao inteira cai.
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/**
 * Leitura da nota do site em uma linha, sem ponto final.
 *
 * Os cortes (50 e 80) sao os mesmos que o cartao do laudo usa para colorir a
 * nota. Se um mudar, o outro muda junto — o lead nao pode ver vermelho na tela
 * e ler "sustenta" no chat.
 */
export function scoreBand(score: number): string {
  if (score < 50) return 'Essa nota quer dizer que o site trava antes de convencer alguém';
  if (score < 80) return 'Essa nota quer dizer que o site funciona, mas não compete';
  return 'Essa nota é boa — o site sustenta, e o ajuste é fino';
}

/**
 * Leitura da nota agentica, na mesma forma.
 *
 * A escala e a mesma 0–100 do Is Agentic. O texto fala de AGENTE, nunca de
 * Google: sao dois instrumentos e o lead precisa saber qual esta falando.
 */
export function agenticBand(score: number): string {
  if (score < 50) return 'os agentes de IA não conseguem ler nem citar o seu site';
  if (score < 80) return 'os agentes chegam ao seu site, mas tropeçam no que encontram';
  return 'os agentes conseguem ler e citar o seu site';
}
```

- [ ] **Step 7: Atualizar `tests/intent-format.test.ts`**

Remova o bloco de testes de `uncoveredFronts` (e o import de `FRONTS`/`Front`) e acrescente:

```ts
import { agenticBand } from '../src/lib/intent-format';

describe('IF: leitura da nota agêntica', () => {
  it('IF-10: fala de agentes, nunca de Google', () => {
    for (const nota of [10, 60, 95]) {
      expect(agenticBand(nota).toLowerCase()).not.toContain('google');
    }
  });

  it('IF-11: as três faixas são distintas', () => {
    expect(new Set([agenticBand(10), agenticBand(60), agenticBand(95)]).size).toBe(3);
  });
});
```

- [ ] **Step 8: Reescrever o contexto do payload em `src/lib/qualification.ts`**

Troque o import do topo e o bloco `QualificationPayloadInput` / `QualificationPayload` / `buildQualificationPayload`:

```ts
import type { PathId } from '../content/paths';
```

```ts
export interface QualificationPayloadInput {
  sessionId: string;
  qualification: Qualification;
  hasNoWebsite: boolean;
  googleScore: number | null;
  agenticScore: number | null;
  path: PathId | null;
}

export interface QualificationPayload {
  action: 'qualification';
  sessionId: string;
  qualification: Qualification;
  /**
   * MUDANÇA DE CONTRATO (set/2026). Saíram `vulnerabilityIndex`, `frontsCovered`
   * e `frontsMissing`: o índice era sintético e as frentes deixaram de existir.
   * Entraram as DUAS notas medidas e o caminho escolhido. O workflow do n8n lê
   * estes campos — ver docs/n8n-contrato-agente.md.
   */
  context: {
    hasNoWebsite: boolean;
    googleScore: number | null;
    agenticScore: number | null;
    path: PathId | null;
  };
}

export function buildQualificationPayload(
  input: QualificationPayloadInput
): QualificationPayload {
  return {
    action: 'qualification',
    sessionId: input.sessionId,
    qualification: {
      ...input.qualification,
      phone: onlyDigits(input.qualification.phone),
    },
    context: {
      hasNoWebsite: input.hasNoWebsite,
      googleScore: input.googleScore,
      agenticScore: input.agenticScore,
      path: input.path,
    },
  };
}
```

Remova o `import { missingFronts } from './fronts';` e a constante `FRONT_IDS`.

- [ ] **Step 9: Atualizar `tests/qualification.test.ts`**

Nos três casos que montam payload (linhas ~95, ~114, ~126), troque os campos do contexto:

```ts
    const payload = buildQualificationPayload({
      sessionId: 'sessao-1',
      qualification: completa,
      hasNoWebsite: false,
      googleScore: 63,
      agenticScore: 41,
      path: 'otimizar',
    });

    expect(payload.context.googleScore).toBe(63);
    expect(payload.context.agenticScore).toBe(41);
    expect(payload.context.path).toBe('otimizar');
    expect(payload.context).not.toHaveProperty('vulnerabilityIndex');
    expect(payload.context).not.toHaveProperty('frontsMissing');
```

- [ ] **Step 10: Tirar a etiqueta de frente dos casos**

`src/content/cases.ts` declara `front?: FrontId` e dois casos usam (`front: 1`, `front: 2`). Apagar `content/fronts.ts` sem mexer aqui quebra a compilação. Remova o import de `FrontId`, o campo `front` da interface `CaseStudy` e as duas linhas `front: N` dos casos.

O comentário que justifica a remoção, no lugar do campo:

```ts
  /**
   * O campo `front` saiu com as três frentes (set/2026). Não foi substituído
   * por um `path`: um caso é prova do que foi feito, e forçá-lo a apontar para
   * um dos dois caminhos comerciais seria a mesma fabricação de etiqueta que
   * este arquivo proíbe para números.
   */
```

- [ ] **Step 11: Apagar os arquivos das frentes**

```bash
git rm src/content/fronts.ts src/lib/fronts.ts tests/fronts.test.ts
```

Run: `npm run lint`
Expected: sem saída. Qualquer erro aqui nomeia um consumidor esquecido de `content/fronts` — conserte antes de seguir.

- [ ] **Step 12: Atualizar `docs/n8n-contrato-agente.md`**

Substitua os dois exemplos de `context` pelo formato novo e acrescente, logo abaixo do primeiro exemplo:

```markdown
> **Mudança de contrato — set/2026.** Saíram `vulnerabilityIndex`,
> `frontsCovered` e `frontsMissing`. Entraram `googleScore`, `agenticScore` e
> `path` (`"novo"` | `"otimizar"` | `null`). As duas notas são independentes e
> **não devem ser somadas nem promediadas** em nenhum ponto do workflow: são
> instrumentos diferentes (Google Lighthouse e Is Agentic). Qualquer template de
> prompt que ainda referencie `context.vulnerabilityIndex` passa a receber
> `undefined` — o workflow no n8n precisa ser atualizado no mesmo cutover.
```

- [ ] **Step 13: Rodar o conjunto e ver o que quebrou**

Run: `npm test`
Expected: falham `tests/intents.test.ts`, `tests/seo.test.ts`, `tests/agent-context.test.ts` e qualquer arquivo que ainda importe `content/fronts` — são as próximas tarefas. `tests/paths.test.ts`, `tests/qualification.test.ts` e `tests/intent-format.test.ts` **passam**.

- [ ] **Step 14: Commit**

```bash
git add -A src/content/paths.ts src/lib/paths.ts src/content/cases.ts src/lib/intent-format.ts src/lib/qualification.ts tests/paths.test.ts tests/intent-format.test.ts tests/qualification.test.ts docs/n8n-contrato-agente.md
git commit -m "feat: dois caminhos (criar/otimizar) substituem as tres frentes" -m "O payload do n8n perde o indice sintetico e passa a levar as duas notas medidas." -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: `SiteScoreContext` substitui o índice de vulnerabilidade

**Files:**
- Create: `src/context/SiteScoreContext.tsx`
- Delete: `src/context/VulnerabilityContext.tsx`, `src/constants/socialNetworks.ts`, `tests/vulnerability.test.ts`
- Modify: `src/components/EliteHUD.tsx`
- Test: `tests/site-score.test.ts`

**Interfaces:**
- Consumes: `PathId`, `resolvePath` (Task 4); `AgenticReport` (Task 1); `GoogleReport` (Task 3).
- Produces:
  - `interface SiteScoreState { google: GoogleReport | null; agentic: AgenticReport | null; hasNoWebsite: boolean; target: string | null; path: PathId | null; measured: boolean; setGoogle(r: GoogleReport | null): void; setAgentic(r: AgenticReport | null): void; setNoWebsite(v: boolean): void; setTarget(t: string | null): void; choosePath(p: PathId): void; reset(): void }`
  - `useSiteScore(): SiteScoreState`
  - `SiteScoreProvider`

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/site-score.test.ts` (testa o que dá para testar sem DOM: as regras puras exportadas e a ausência de mistura entre notas):

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { derivePath, hasAnyMeasurement } from '../src/context/SiteScoreContext';

const root = (p: string) => resolve(process.cwd(), p);

function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe('SS: estado das duas notas', () => {
  it('SS-01: sem nenhuma medição, não há caminho sugerido', () => {
    expect(derivePath({ hasNoWebsite: false, googleScore: null })).toBeNull();
  });

  it('SS-02: declarar que não tem site sugere criar', () => {
    expect(derivePath({ hasNoWebsite: true, googleScore: null })).toBe('novo');
  });

  it('SS-03: medição feita conta como medida', () => {
    expect(hasAnyMeasurement({ google: null, agentic: null, hasNoWebsite: false })).toBe(false);
    expect(hasAnyMeasurement({ google: null, agentic: null, hasNoWebsite: true })).toBe(true);
    expect(hasAnyMeasurement({ google: { score: 50 }, agentic: null, hasNoWebsite: false })).toBe(true);
    expect(hasAnyMeasurement({ google: null, agentic: { score: 72 }, hasNoWebsite: false })).toBe(true);
  });
});

describe('SS: as duas notas nunca se misturam', () => {
  it('SS-04: nenhum arquivo de src/ combina googleScore com agenticScore numa conta', () => {
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      const texto = readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      // Soma, média ou ponderação entre as duas notas, em qualquer ordem.
      if (/(google\w*Score|google\.score)[^;\n]{0,40}[+*/][^;\n]{0,40}(agentic\w*Score|agentic\.score)/i.test(texto)
        || /(agentic\w*Score|agentic\.score)[^;\n]{0,40}[+*/][^;\n]{0,40}(google\w*Score|google\.score)/i.test(texto)) {
        infratores.push(file.replace(root('.'), '.'));
      }
    }
    expect(infratores, `combinam as duas notas:\n${infratores.join('\n')}`).toEqual([]);
  });

  it('SS-05: o índice de vulnerabilidade não sobrevive em lugar nenhum', () => {
    const infratores = sourceFiles().filter((f) =>
      /vulnerabilityIndex|VulnerabilityProvider|useVulnerability/.test(readFileSync(f, 'utf-8'))
    );
    expect(infratores, `ainda citam o índice:\n${infratores.join('\n')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/site-score.test.ts`
Expected: FAIL — `src/context/SiteScoreContext` não existe.

- [ ] **Step 3: Criar `src/context/SiteScoreContext.tsx`**

```tsx
import React, { createContext, useContext, useMemo, useState } from 'react';
import type { AgenticReport } from '../lib/agentic-report';
import type { GoogleReport } from '../lib/lighthouse-report';
import type { PathId } from '../content/paths';
import { resolvePath } from '../lib/paths';

/**
 * O estado da medição.
 *
 * O QUE ISTO SUBSTITUI
 *
 * Havia aqui um "Índice de Vulnerabilidade": um número de 8 a 100 calculado a
 * partir de frentes marcadas (60 dos 95 pontos de proteção), saúde do site (25)
 * e presença em redes sociais (10). Com as três frentes virando dois caminhos
 * mutuamente exclusivos, 60 daqueles pontos perderam base — e reponderar os que
 * sobraram seria inventar uma escala nova para manter um número que a página
 * não precisa mais.
 *
 * O que ficou é o que foi MEDIDO: duas notas, cada uma com seu instrumento, mais
 * a declaração de "não tenho site". Nada aqui é calculado a partir do que o
 * visitante concorda ou marca.
 *
 * REGRA: as duas notas não se somam, não se promediam e não viram uma terceira.
 * tests/site-score.test.ts (SS-04) tranca isso na varredura de fonte.
 */

export interface SiteScoreState {
  google: GoogleReport | null;
  agentic: AgenticReport | null;
  hasNoWebsite: boolean;
  /** O endereço medido, para o agente poder citá-lo. */
  target: string | null;
  /** Caminho escolhido no cartão, ou o sugerido pela medição. */
  path: PathId | null;
  /** Houve alguma medição ou declaração? O HUD só aparece depois disso. */
  measured: boolean;
  setGoogle: (report: GoogleReport | null) => void;
  setAgentic: (report: AgenticReport | null) => void;
  setNoWebsite: (value: boolean) => void;
  setTarget: (target: string | null) => void;
  choosePath: (path: PathId) => void;
  reset: () => void;
}

/** Puro e exportado para o teste — a regra de sugestão mora em lib/paths.ts. */
export function derivePath(input: { hasNoWebsite: boolean; googleScore: number | null }): PathId | null {
  return resolvePath(input);
}

/** Puro e exportado para o teste. */
export function hasAnyMeasurement(input: {
  google: { score: number } | null;
  agentic: { score: number } | null;
  hasNoWebsite: boolean;
}): boolean {
  return input.hasNoWebsite || input.google !== null || input.agentic !== null;
}

const SiteScore = createContext<SiteScoreState | undefined>(undefined);

export function SiteScoreProvider({ children }: { children: React.ReactNode }) {
  const [google, setGoogleState] = useState<GoogleReport | null>(null);
  const [agentic, setAgenticState] = useState<AgenticReport | null>(null);
  const [hasNoWebsite, setHasNoWebsite] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [chosen, setChosen] = useState<PathId | null>(null);

  const setGoogle = (report: GoogleReport | null) => {
    setGoogleState(report);
    if (report) setHasNoWebsite(false);
  };

  const setAgentic = (report: AgenticReport | null) => {
    setAgenticState(report);
    if (report) setHasNoWebsite(false);
  };

  const setNoWebsite = (value: boolean) => {
    setHasNoWebsite(value);
    if (value) {
      setGoogleState(null);
      setAgenticState(null);
      setTarget(null);
    }
  };

  const reset = () => {
    setGoogleState(null);
    setAgenticState(null);
    setHasNoWebsite(false);
    setTarget(null);
    setChosen(null);
  };

  const sugerido = useMemo(
    () => derivePath({ hasNoWebsite, googleScore: google?.score ?? null }),
    [hasNoWebsite, google]
  );

  const value: SiteScoreState = {
    google,
    agentic,
    hasNoWebsite,
    target,
    // A escolha explícita do visitante ganha da sugestão da medição: ele pode
    // ter site e ainda assim querer um novo, e a página não discute com ele.
    path: chosen ?? sugerido,
    measured: hasAnyMeasurement({ google, agentic, hasNoWebsite }),
    setGoogle,
    setAgentic,
    setNoWebsite,
    setTarget,
    choosePath: setChosen,
    reset,
  };

  return <SiteScore.Provider value={value}>{children}</SiteScore.Provider>;
}

export function useSiteScore(): SiteScoreState {
  const context = useContext(SiteScore);
  if (!context) throw new Error('useSiteScore precisa de um SiteScoreProvider acima');
  return context;
}
```

- [ ] **Step 4: Reescrever `src/components/EliteHUD.tsx`**

O HUD deixa de exibir índice. Substitua o corpo que lê `useVulnerability` por:

```tsx
import { useSiteScore } from '../context/SiteScoreContext';
```

e, no lugar do bloco do índice, as duas notas medidas:

```tsx
  const { google, agentic, hasNoWebsite, measured } = useSiteScore();

  // Sem medição não há o que mostrar. O HUD antigo exibia um índice inicial de
  // 100% antes de qualquer medição — um número inventado no primeiro frame.
  if (!measured) return null;

  const notas = hasNoWebsite
    ? [{ rotulo: 'Site', valor: 'não existe' }]
    : [
        { rotulo: 'Google', valor: google ? `${google.score}/100` : 'não medido' },
        { rotulo: 'Agentes', valor: agentic ? `${agentic.score}/100` : 'não medido' },
      ];
```

Renderize `notas` no mesmo invólucro visual que o índice ocupava (mesmas classes de vidro e posicionamento), uma linha por item.

- [ ] **Step 5: Apagar o contexto antigo e as redes**

```bash
git rm src/context/VulnerabilityContext.tsx src/constants/socialNetworks.ts tests/vulnerability.test.ts
```

- [ ] **Step 6: Rodar o teste novo**

Run: `npx vitest run tests/site-score.test.ts`
Expected: PASS — 5 testes. (SS-05 exige que nenhum arquivo cite mais `useVulnerability`; se falhar, os arquivos apontados são consumidores que as tarefas 6–10 reescrevem — rode este passo de novo ao fim da Task 10, mas **não** relaxe a asserção.)

- [ ] **Step 7: Commit**

```bash
git add -A src/context/SiteScoreContext.tsx src/components/EliteHUD.tsx tests/site-score.test.ts
git commit -m "refactor: indice de vulnerabilidade sai; o estado passa a ser as duas notas medidas" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: O scanner sobe para o hero

**Files:**
- Create: `src/hooks/useSiteScan.tsx`
- Create: `src/components/ScannerForm.tsx`
- Modify: `src/pages/LandingPage.tsx`
- Test: `tests/scanner.test.ts`

**Interfaces:**
- Consumes: `scanAgentic`, `ScanEvent` (Task 2); `parseLighthouse`, `pageSpeedUrl` (Task 3); `useSiteScore` (Task 5); `normalizeTarget` (Task 2).
- Produces:
  - `type ScanPhase = 'idle' | 'running' | 'done'`
  - `interface SiteScanState { phase: ScanPhase; googleFailure: 'quota' | 'unreachable' | null; agenticFailure: AgenticFailure | null; progress: number; start(input: string): void; cancel(): void }`
  - `useSiteScan(): SiteScanState` — **lido por consumidores através do contexto**, nunca chamado duas vezes (ver Step 4).
  - `<ScannerForm onMeasured={() => void} />`

> **Armadilha desta tarefa.** `useSiteScan` guarda estado local. Se `ScannerForm` e `ReportSection` chamarem o hook cada um, serão duas instâncias independentes: o formulário dispara a medição e o laudo nunca vê progresso nem falha. Por isso o Step 4 embrulha o hook num provedor e os componentes consomem `useScan()`. Nenhum teste de texto pega esse erro — a página simplesmente não funciona.

> **Ordem das intenções.** O id `'sem-site'` só passa a existir na Task 8. Aqui, use o id atual `'diagnostic-no-website'`; a Task 8 renomeia os dois pontos de uma vez. Usar o nome futuro agora quebra `npm run lint`.

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/scanner.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = (p: string) => resolve(process.cwd(), p);
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const hook = readFileSync(root('src/hooks/useSiteScan.tsx'), 'utf-8');
const form = readFileSync(root('src/components/ScannerForm.tsx'), 'utf-8');
const landing = readFileSync(root('src/pages/LandingPage.tsx'), 'utf-8');

describe('SCN: o scanner é a primeira dobra', () => {
  it('SCN-01: o hero renderiza o formulário do scanner', () => {
    const heroBloco = landing.slice(landing.indexOf('function SceneHero'), landing.indexOf('// ─── Pagina'));
    expect(heroBloco).toContain('<ScannerForm');
  });

  it('SCN-02: a landing tem cinco capítulos, sem "Vozes do mercado"', () => {
    const chapters = landing.slice(landing.indexOf('const CHAPTERS'), landing.indexOf('export default function LandingPage'));
    expect(chapters).not.toMatch(/Vozes do mercado/);
    expect((chapters.match(/label:/g) ?? [])).toHaveLength(5);
  });

  it('SCN-03: o CTA da oferta aponta para o último capítulo', () => {
    expect(landing).toMatch(/const CTA_CHAPTER = 4/);
  });

  it('SCN-04: as duas medições disparam em paralelo, não em cascata', () => {
    const corpo = semComentarios(hook);
    // Promise.all/allSettled, e nunca um await de uma antes de começar a outra.
    expect(corpo).toMatch(/Promise\.(all|allSettled)\(/);
  });

  it('SCN-05: falha de medição nunca vira nota zero', () => {
    const corpo = semComentarios(hook);
    expect(corpo).not.toMatch(/setGoogle\(\s*0\s*\)/);
    expect(corpo).not.toMatch(/score:\s*0\b/);
  });

  it('SCN-06: o campo recusa endereço inválido antes de qualquer requisição', () => {
    expect(semComentarios(form) + semComentarios(hook)).toContain('normalizeTarget');
  });

  it('SCN-07: o botão de "não tenho site" continua existindo', () => {
    expect(form).toContain('setNoWebsite');
    expect(form).toMatch(/não tenho site/i);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/scanner.test.ts`
Expected: FAIL — arquivos inexistentes.

- [ ] **Step 3: Criar `src/hooks/useSiteScan.tsx`**

```ts
import { useCallback, useRef, useState } from 'react';
import { config } from '../config';
import { useSiteScore } from '../context/SiteScoreContext';
import { normalizeTarget, type AgenticFailure } from '../lib/agentic-report';
import { parseLighthouse, pageSpeedUrl } from '../lib/lighthouse-report';
import { scanAgentic } from '../lib/agentic-scan-client';
import { track } from '../lib/analytics';

/**
 * As duas medições.
 *
 * Elas rodam EM PARALELO e resolvem separadas: o Lighthouse leva ~10 s e o Is
 * Agentic ~19 s, e cada coluna do laudo publica assim que a sua chega. Encadear
 * as duas faria o visitante esperar a soma dos dois tempos para ver a primeira.
 *
 * Nenhuma falha vira nota. `googleFailure` e `agenticFailure` são estados
 * próprios, que a tela imprime como "não medido" com motivo.
 */

/** Teto de espera do PageSpeed. Medido: ~21 s na primeira chamada (sem cache
 *  no PSI). O texto da tela promete o mesmo número — se um mudar, o outro muda. */
const PAGESPEED_TIMEOUT_MS = 30000;

export type ScanPhase = 'idle' | 'running' | 'done';
export type GoogleFailure = 'quota' | 'unreachable' | 'invalid-url';

export interface SiteScanState {
  phase: ScanPhase;
  googleFailure: GoogleFailure | null;
  agenticFailure: AgenticFailure | null;
  /** 0–100, alimentado pelos eventos reais do scan agêntico. */
  progress: number;
  start: (input: string) => void;
  cancel: () => void;
}

export function useSiteScan(): SiteScanState {
  const { setGoogle, setAgentic, setTarget } = useSiteScore();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [googleFailure, setGoogleFailure] = useState<GoogleFailure | null>(null);
  const [agenticFailure, setAgenticFailure] = useState<AgenticFailure | null>(null);
  const [progress, setProgress] = useState(0);
  const abort = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setPhase('idle');
    setProgress(0);
  }, []);

  const start = useCallback(
    (input: string) => {
      const target = normalizeTarget(input);
      if (!target) {
        setGoogleFailure('invalid-url');
        setAgenticFailure(null);
        return;
      }

      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;

      setPhase('running');
      setProgress(0);
      setGoogleFailure(null);
      setAgenticFailure(null);
      setGoogle(null);
      setAgentic(null);
      setTarget(target);
      track('scan_started');

      const google = (async () => {
        const timer = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS);
        try {
          const response = await fetch(pageSpeedUrl(target, config.pageSpeedApiKey), {
            signal: controller.signal,
          });
          if (response.status === 429) {
            setGoogleFailure('quota');
            return;
          }
          const report = response.ok ? parseLighthouse(await response.json()) : null;
          if (report) setGoogle(report);
          else setGoogleFailure('unreachable');
        } catch {
          if (!controller.signal.aborted) setGoogleFailure('unreachable');
        } finally {
          clearTimeout(timer);
        }
      })();

      const agentic = scanAgentic(
        target,
        (event) => {
          if (event.type === 'progress') {
            setProgress(event.total ? Math.round((event.done / event.total) * 100) : 0);
          } else if (event.type === 'report') {
            setProgress(100);
            setAgentic(event.report);
          } else {
            setAgenticFailure(event.reason);
          }
        },
        controller.signal
      );

      void Promise.allSettled([google, agentic]).then(() => {
        if (!controller.signal.aborted) setPhase('done');
        track('scan_finished');
      });
    },
    [setGoogle, setAgentic, setTarget]
  );

  return { phase, googleFailure, agenticFailure, progress, start, cancel };
}
```

- [ ] **Step 4: Embrulhar o hook num provedor (uma instância só)**

Ainda em `src/hooks/useSiteScan.tsx`, exporte um provedor e o leitor de contexto, e renomeie o hook interno:

```tsx
import { createContext, useContext } from 'react';

const ScanContext = createContext<SiteScanState | undefined>(undefined);

/**
 * Uma instância só da medição para a página inteira.
 *
 * O formulário dispara no capítulo 0 e o laudo publica no capítulo 1. Sem este
 * provedor, cada um teria seu próprio estado e o laudo nunca veria o que o
 * formulário começou — o bug não aparece em teste de texto, só na tela.
 */
export function ScanProvider({ children }: { children: React.ReactNode }) {
  return <ScanContext.Provider value={useSiteScanState()}>{children}</ScanContext.Provider>;
}

export function useScan(): SiteScanState {
  const context = useContext(ScanContext);
  if (!context) throw new Error('useScan precisa de um ScanProvider acima');
  return context;
}
```

Renomeie a função implementada no Step 3 de `useSiteScan` para `useSiteScanState` (mesmo corpo) e mude a extensão do arquivo para `.tsx`, já que agora ele tem JSX: `src/hooks/useSiteScan.tsxx`. `ScannerForm` e `ReportSection` passam a chamar `useScan()`.

Em `src/pages/LandingPage.tsx`, o `ScanProvider` fica **dentro** do `SiteScoreProvider` (ele lê o contexto das notas) e **fora** do `<main>`:

```tsx
<SiteScoreProvider>
  <ScanProvider>
    <AgentIntentProvider onReachAgent={goToCta}>
```

- [ ] **Step 5: Criar `src/components/ScannerForm.tsx`**

```tsx
import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useSiteScore } from '../context/SiteScoreContext';
import { useScan } from '../hooks/useSiteScan';
import { normalizeTarget } from '../lib/agentic-report';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * O campo que abre a página.
 *
 * Ele morava no meio do capítulo 2, atrás de duas dobras de argumento. Subiu
 * para o hero porque medir o site do visitante é a única coisa que esta página
 * faz melhor que qualquer concorrente — e era a última que ela oferecia.
 */
export default function ScannerForm({ onMeasured }: { onMeasured: () => void }) {
  const [url, setUrl] = useState('');
  const { setNoWebsite } = useSiteScore();
  const { requestIntent } = useAgentIntent();
  const { start, phase, googleFailure } = useScan();

  const invalido = googleFailure === 'invalid-url';

  const medir = () => {
    if (!normalizeTarget(url)) {
      start(url); // deixa o hook publicar 'invalid-url'
      return;
    }
    start(url);
    track('cta_click', { location: 'hero-scanner' });
    onMeasured();
  };

  const semSite = () => {
    setNoWebsite(true);
    track('diagnostic_no_website');
    requestIntent('sem-site');
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
      <div className="glass-field flex items-center w-full rounded-xl px-4 py-3 gap-3">
        <Search size={16} className="text-accent shrink-0" aria-hidden="true" />
        <label htmlFor="scanner-url" className="sr-only">
          Endereço do seu site
        </label>
        <input
          id="scanner-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="suaempresa.com.br"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') medir(); }}
          className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 min-h-[28px]"
          aria-invalid={invalido}
          aria-describedby={invalido ? 'scanner-erro' : undefined}
        />
      </div>

      {invalido && (
        <p id="scanner-erro" role="alert" className="text-sm text-red-600">
          Preciso de um endereço completo — algo como suaempresa.com.br.
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          onClick={medir}
          disabled={phase === 'running'}
          className="w-full sm:w-auto px-7 py-4 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2.5 min-h-[52px] disabled:opacity-60"
        >
          <span>{phase === 'running' ? 'Medindo…' : 'Medir meu site'}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>

        <button
          onClick={semSite}
          className="glass glass-hover w-full sm:w-auto px-7 py-4 text-slate-900 hover:text-accent rounded-xl font-black text-xs uppercase tracking-widest min-h-[52px]"
        >
          Ainda não tenho site
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Reescrever o hero e os capítulos em `src/pages/LandingPage.tsx`**

- Troque `VulnerabilityProvider` por `SiteScoreProvider` (import e JSX).
- `const CTA_CHAPTER = 4;`
- `CHAPTERS` passa a ser:

```tsx
const CHAPTERS = [
  { label: 'Meça seu site' },
  { label: 'O laudo' },
  { label: 'Criar ou otimizar' },
  { label: 'Prova e quem executa' },
  { label: 'O agente e a agenda' },
];
```

- `chapterContent` passa a ser:

```tsx
  const chapterContent = useMemo(() => [
    <SceneHero onMeasured={goToReport} />,
    <ReportSection />,
    <PathsSection />,
    <CredibilitySection />,
    <SceneCTA />,
  ], [goToReport]);
```

com `const goToReport = useCallback(() => goToChapter(1), [goToChapter]);` no lugar de `goToSocialProof`.

- Em `SceneHero`, troque os dois `MagneticButton` por `<ScannerForm onMeasured={onMeasured} />` e reescreva `HEADLINES`:

```tsx
const HEADLINES: Record<string, readonly [string, string]> = {
  default: ['Quando alguém pergunta ao ChatGPT o que você vende,', 'o seu site aparece?'],
  industria: ['Quem procura o que sua indústria produz', 'encontra você ou o concorrente?'],
  servicos: ['Quando buscam o serviço que você presta,', 'o seu site é o que a IA cita?'],
  varejo: ['Quem procura o que sua loja vende', 'chega até você pela busca de IA?'],
};
```

- [ ] **Step 7: Rodar o teste**

Run: `npx vitest run tests/scanner.test.ts`
Expected: PASS — 7 testes. (`SCN-01`/`SCN-02` dependem de `ReportSection` e `PathsSection`, criados nas tarefas 7 e 8; se o import ainda não existir, crie-os como stubs de uma linha nesta tarefa e preencha depois — **não** deixe o teste passar por ausência.)

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useSiteScan.tsxx src/components/ScannerForm.tsx src/pages/LandingPage.tsx tests/scanner.test.ts
git commit -m "feat: o scanner vira a primeira dobra e as duas medicoes correm em paralelo" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: O laudo em duas colunas

**Files:**
- Create: `src/components/ReportSection.tsx`, `src/components/GoogleReportCard.tsx`, `src/components/AgenticReportCard.tsx`
- Delete: `src/components/PotentialDiagnostic.tsx`, `src/lib/agentic-readiness.ts`, `tests/agentic-readiness.test.ts`
- Test: `tests/report-section.test.ts`

**Interfaces:**
- Consumes: `useSiteScore` (Task 5), `useSiteScan` (Task 6), `GoogleReport` (Task 3), `AgenticReport`/`issuesByTier` (Task 1).
- Produces: `<ReportSection />` (sem props), `<GoogleReportCard report={GoogleReport|null} failure={GoogleFailure|null} />`, `<AgenticReportCard report={AgenticReport|null} failure={AgenticFailure|null} progress={number} />`.

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/report-section.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = (p: string) => resolve(process.cwd(), p);
const ler = (p: string) => readFileSync(root(p), 'utf-8');
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const secao = ler('src/components/ReportSection.tsx');
const google = ler('src/components/GoogleReportCard.tsx');
const agentic = ler('src/components/AgenticReportCard.tsx');

describe('LAUDO: duas notas, dois instrumentos', () => {
  it('LAU-01: a seção monta as duas colunas', () => {
    expect(secao).toContain('<GoogleReportCard');
    expect(secao).toContain('<AgenticReportCard');
  });

  it('LAU-02: cada coluna nomeia a sua fonte', () => {
    expect(google).toMatch(/Google Lighthouse/);
    expect(agentic).toMatch(/Is Agentic/);
    expect(agentic).toMatch(/Vercel Labs/);
  });

  it('LAU-03: a coluna agêntica publica o link de conferência', () => {
    expect(agentic).toContain('reportUrl');
  });

  it('LAU-04: a coluna agêntica separa essencial de recomendado', () => {
    expect(agentic).toContain("issuesByTier");
    expect(agentic).toMatch(/'essential'/);
    expect(agentic).toMatch(/'recommended'/);
  });

  it('LAU-05: a coluna agêntica mostra a evidência, não só o nome do problema', () => {
    expect(agentic).toMatch(/\.details/);
  });

  it('LAU-06: nenhuma das três combina as duas notas', () => {
    const tudo = semComentarios(secao + google + agentic);
    expect(tudo).not.toMatch(/média|media geral|notaGeral|combinedScore/i);
  });

  it('LAU-07: ausência de medição imprime texto, nunca zero', () => {
    for (const [nome, fonte] of [['google', google], ['agentic', agentic]] as const) {
      const corpo = semComentarios(fonte);
      expect(corpo, `${nome}: score literal zero`).not.toMatch(/score\s*[=:]\s*0\b/);
      expect(corpo).toMatch(/não medido/);
    }
  });

  it('LAU-08: a quinta dimensão não sobreviveu', () => {
    expect(google).not.toMatch(/Navegação agêntica|D5/);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/report-section.test.ts`
Expected: FAIL — arquivos inexistentes.

- [ ] **Step 3: Criar `src/components/GoogleReportCard.tsx`**

Reaproveite o desenho do cartão que existe hoje em `PotentialDiagnostic.tsx` (barras por dimensão, faixa de cor por nota, grade de Core Web Vitals). Estrutura mínima:

```tsx
import type { GoogleReport } from '../lib/lighthouse-report';
import type { GoogleFailure } from '../hooks/useSiteScan';

/** Uma escala de cor só para o laudo inteiro — nota, dimensões e vitals. */
function toneOf(pct: number) {
  if (pct < 50) return { text: 'text-red-600', bar: 'bg-red-500' };
  if (pct < 80) return { text: 'text-amber-600', bar: 'bg-amber-500' };
  return { text: 'text-accent', bar: 'bg-accent' };
}

const MOTIVO: Record<GoogleFailure, string> = {
  quota: 'A cota do PageSpeed estourou agora. Tente de novo em alguns minutos.',
  unreachable: 'O Lighthouse não conseguiu abrir o endereço.',
  'invalid-url': 'O endereço não parece completo.',
};

export default function GoogleReportCard({
  report, failure,
}: { report: GoogleReport | null; failure: GoogleFailure | null }) {
  return (
    <section className="glass-panel rounded-[1.5rem] p-5 md:p-8" aria-label="Laudo do Google">
      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">
        Fonte: Google Lighthouse (PageSpeed Insights)
      </p>

      {!report ? (
        <p className="mt-4 text-slate-500">
          <strong className="text-slate-700">não medido</strong>
          {failure ? ` — ${MOTIVO[failure]}` : ' — a medição ainda não terminou.'}
        </p>
      ) : (
        <>
          <p className={`mt-3 text-5xl font-black ${toneOf(report.score).text}`}>
            {report.score}<span className="text-xl text-slate-400">/100</span>
          </p>
          <p className="text-slate-700 font-semibold">{report.reading.nome}</p>
          <p className="text-sm text-slate-600 mt-1">{report.reading.texto}</p>

          <ul className="mt-5 space-y-3">
            {report.dimensions.map((d) => (
              <li key={d.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{d.nome}</span>
                  <span className={toneOf(d.pct).text}>{d.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 mt-1">
                  <div className={`h-full rounded-full ${toneOf(d.pct).bar}`} style={{ width: `${d.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>

          <ul className="mt-5 grid grid-cols-2 gap-3">
            {report.webVitals.map((v) => (
              <li key={v.id} className="glass-chip rounded-xl px-3 py-2">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">{v.name}</span>
                <span className={`font-black ${toneOf(v.score).text}`}>{v.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Criar `src/components/AgenticReportCard.tsx`**

```tsx
import { issuesByTier, type AgenticFailure, type AgenticReport } from '../lib/agentic-report';

/**
 * A segunda nota.
 *
 * Mede o que o Lighthouse não mede: se um agente de IA DESCOBRE, ACESSA e USA o
 * site. Nota e apontamentos vêm do Is Agentic (Vercel Labs), e o laudo público
 * deles fica linkado — quem publica número publica a fonte conferível.
 *
 * Esta coluna NÃO se combina com a do Google. São instrumentos diferentes; uma
 * média entre eles seria um número que ninguém mediu.
 */

const MOTIVO: Record<AgenticFailure, string> = {
  'rate-limited': 'A fila de varreduras encheu (são 10 por minuto, para o site inteiro). Tente daqui a um minuto.',
  unreachable: 'A varredura não completou desta vez.',
  'invalid-url': 'O endereço não parece completo.',
};

function toneOf(score: number) {
  if (score < 50) return 'text-red-600';
  if (score < 80) return 'text-amber-600';
  return 'text-accent';
}

function Bloco({ titulo, itens }: { titulo: string; itens: ReturnType<typeof issuesByTier> }) {
  if (itens.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">{titulo}</h3>
      <ul className="mt-2 space-y-3">
        {itens.map((i) => (
          <li key={i.id} className="glass-chip rounded-xl px-3 py-2">
            <p className="font-semibold text-slate-800 text-sm">
              {i.name}
              <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">
                {i.result === 'failed' ? 'falhou' : 'parcial'}
              </span>
            </p>
            <p className="text-sm text-slate-600 mt-1">{i.details}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AgenticReportCard({
  report, failure, progress,
}: { report: AgenticReport | null; failure: AgenticFailure | null; progress: number }) {
  return (
    <section className="glass-panel rounded-[1.5rem] p-5 md:p-8" aria-label="Laudo de prontidão para agentes">
      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">
        Fonte: Is Agentic (Vercel Labs)
      </p>

      {!report ? (
        <div className="mt-4">
          <p className="text-slate-500">
            <strong className="text-slate-700">não medido</strong>
            {failure ? ` — ${MOTIVO[failure]}` : ' — a varredura leva cerca de 20 segundos.'}
          </p>
          {!failure && (
            <div className="h-1.5 rounded-full bg-slate-200 mt-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <>
          <p className={`mt-3 text-5xl font-black ${toneOf(report.score)}`}>
            {report.score}<span className="text-xl text-slate-400">/100</span>
          </p>
          <p className="text-slate-700 font-semibold">{report.scoreLabel}</p>
          <p className="text-sm text-slate-600 mt-1">
            {report.essential.passing} de {report.essential.total} checagens essenciais e{' '}
            {report.recommended.passing} de {report.recommended.total} recomendadas passaram.
          </p>

          <Bloco titulo="Essencial" itens={issuesByTier(report, 'essential')} />
          <Bloco titulo="Recomendado" itens={issuesByTier(report, 'recommended')} />

          <a
            href={report.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-5 text-sm font-semibold text-accent-dark underline"
          >
            Conferir o laudo completo no Is Agentic
          </a>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Criar `src/components/ReportSection.tsx`**

```tsx
import { useSiteScore } from '../context/SiteScoreContext';
import { useScan } from '../hooks/useSiteScan';
import GoogleReportCard from './GoogleReportCard';
import AgenticReportCard from './AgenticReportCard';

/**
 * O capítulo do laudo.
 *
 * Duas colunas, dois instrumentos, nenhuma média. Cada uma resolve sozinha: o
 * Lighthouse costuma chegar antes do Is Agentic, e quem chegou primeiro publica
 * primeiro em vez de esperar o outro.
 */
export default function ReportSection() {
  const { google, agentic, hasNoWebsite, target } = useSiteScore();
  const { googleFailure, agenticFailure, progress, phase } = useScan();

  if (hasNoWebsite) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 text-center">
        <p className="reading-surface inline-block px-4 py-3 rounded-2xl text-slate-700">
          Sem site não há o que medir — e é essa a medição. Quem procura o que você vende
          hoje não encontra nada para ler, citar ou recomendar. O caminho aqui é criar.
        </p>
      </div>
    );
  }

  if (phase === 'idle' && !google && !agentic) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 text-center">
        <p className="reading-surface inline-block px-4 py-3 rounded-2xl text-slate-700">
          Informe o endereço lá em cima e eu mostro as duas notas aqui: a do Google,
          que mede velocidade e estrutura, e a dos agentes de IA, que mede se o ChatGPT
          consegue ler e citar a sua página.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4">
      {target && (
        <p className="text-center text-sm text-slate-600 mb-4">
          Medindo <strong className="text-slate-900">{target}</strong> — duas notas, dois
          instrumentos independentes. Elas não se somam.
        </p>
      )}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <GoogleReportCard report={google} failure={googleFailure} />
        <AgenticReportCard report={agentic} failure={agenticFailure} progress={progress} />
      </div>
    </div>
  );
}
```

> **Atenção:** `ReportSection` consome `useScan()` — o leitor do provedor criado na Task 6, Step 4 — e **nunca** `useSiteScanState()` direto. Chamar o hook de estado aqui criaria uma segunda instância, e o laudo não veria a medição que o formulário disparou.

- [ ] **Step 6: Apagar o componente antigo**

```bash
git rm src/components/PotentialDiagnostic.tsx src/lib/agentic-readiness.ts tests/agentic-readiness.test.ts
```

- [ ] **Step 7: Rodar os testes e os tipos**

Run: `npx vitest run tests/report-section.test.ts && npm run lint`
Expected: PASS nos 8 testes; `tsc` sem saída.

- [ ] **Step 8: Commit**

```bash
git add -A src/components/ReportSection.tsx src/components/GoogleReportCard.tsx src/components/AgenticReportCard.tsx tests/report-section.test.ts
git commit -m "feat: o laudo passa a publicar duas notas lado a lado, sem media entre elas" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Criar ou otimizar, e o agente falando a língua nova

**Files:**
- Create: `src/components/PathsSection.tsx`
- Delete: `src/components/FrontsSection.tsx`
- Modify: `src/content/intents.ts`, `src/components/AIChatAgent.tsx`, `tests/intents.test.ts`
- Test: `tests/paths-section.test.ts`

**Interfaces:**
- Consumes: `PATHS`, `pathById`, `PathId` (Task 4); `useSiteScore` (Task 5).
- Produces:
  - `IntentId` passa a ser `'hero-cold' | 'report-result' | 'sem-site' | 'path-pick' | 'credibility'`
  - `IntentContext` passa a ser `{ ref: string | null; googleScore: number | null; agenticScore: number | null; hasNoWebsite: boolean; path?: SitePath }`

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/paths-section.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { INTENTS } from '../src/content/intents';
import { PATHS } from '../src/content/paths';

const root = (p: string) => resolve(process.cwd(), p);
const secao = readFileSync(root('src/components/PathsSection.tsx'), 'utf-8');

describe('CAMINHOS: a dobra', () => {
  it('CAM-01: renderiza os dois caminhos a partir do conteúdo', () => {
    expect(secao).toContain('PATHS.map');
    expect(secao).toContain('choosePath');
  });

  it('CAM-02: a escolha leva ao agente', () => {
    expect(secao).toContain("requestIntent('path-pick')");
  });

  it('CAM-03: nenhuma menção a frente sobrou', () => {
    expect(secao).not.toMatch(/frente|Front/i);
  });
});

describe('CAMINHOS: o agente', () => {
  it('CAM-04: as intenções são as cinco novas', () => {
    expect(Object.keys(INTENTS).sort()).toEqual(
      ['credibility', 'hero-cold', 'path-pick', 'report-result', 'sem-site'].sort()
    );
  });

  it('CAM-05: a fala do lead cita o caminho escolhido', () => {
    for (const path of PATHS) {
      const fala = INTENTS['path-pick'].userMessage({
        ref: null, googleScore: null, agenticScore: null, hasNoWebsite: false, path,
      });
      expect(fala).toContain(path.label);
    }
  });

  it('CAM-06: com as duas notas, o agente comenta as duas', () => {
    const resposta = INTENTS['report-result'].agentReply({
      ref: null, googleScore: 42, agenticScore: 66, hasNoWebsite: false,
    });
    expect(resposta).toContain('42');
    expect(resposta).toContain('66');
  });

  it('CAM-07: sem nota, o agente não inventa número', () => {
    const resposta = INTENTS['report-result'].agentReply({
      ref: null, googleScore: null, agenticScore: null, hasNoWebsite: false,
    });
    expect(resposta).not.toMatch(/\d+\s*\/\s*100/);
  });

  it('CAM-08: nenhuma intenção promete diagnóstico de gargalo', () => {
    const tudo = Object.values(INTENTS)
      .map((i) => i.userMessage({ ref: null, googleScore: 50, agenticScore: 50, hasNoWebsite: false, path: PATHS[0] })
        + i.agentReply({ ref: null, googleScore: 50, agenticScore: 50, hasNoWebsite: false, path: PATHS[0] }))
      .join(' ');
    expect(tudo).not.toMatch(/gargalo/i);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/paths-section.test.ts`
Expected: FAIL.

- [ ] **Step 3: Reescrever `src/content/intents.ts`**

Mantenha `REF_LABEL`, `REF_PHRASE`, `readCampaignRef` e `GREETING` como estão (ajustando o texto de `GREETING` para falar de site). Substitua tipos e mapa:

```ts
import type { SitePath } from './paths';
import { PATHS } from './paths';
import { scoreBand, agenticBand } from '../lib/intent-format';

export type IntentId =
  | 'hero-cold'
  | 'report-result'
  | 'sem-site'
  | 'path-pick'
  | 'credibility';

export interface IntentContext {
  ref: string | null;
  googleScore: number | null;
  agenticScore: number | null;
  hasNoWebsite: boolean;
  /** Presente só em path-pick. */
  path?: SitePath;
}

function pickedPath(ctx: IntentContext): SitePath {
  return ctx.path ?? PATHS[0];
}

export const GREETING =
  'Olá. Sou o Agente de Inteligência da RIA. Me diga em uma frase o que sua empresa faz — eu volto com o que precisa mudar no seu site para ele ser encontrado, lido e citado.';

export const NO_WEBSITE_GREETING =
  'Sem site, não existe página para o ChatGPT, o Gemini ou o Perplexity citarem quando alguém procura o que você vende. Me diga em uma frase o que sua empresa faz — eu volto com o que precisa estar no ar primeiro.';

export const INTENTS: Record<IntentId, IntentDefinition> = {
  'hero-cold': {
    id: 'hero-cold',
    userMessage: (ctx) => {
      const abertura = ctx.ref ? REF_PHRASE[ctx.ref] : undefined;
      return abertura
        ? `${abertura} e quero saber como está o meu site. Por onde eu começo?`
        : 'Quero saber como está o meu site. Por onde eu começo?';
    },
    agentReply: () =>
      'Começa medindo. São duas notas: a do Google, que diz se a página carrega e se estrutura direito, e a de prontidão para agentes, que diz se o ChatGPT consegue ler e citar você. Rode a medição aqui em cima e me diga o que sua empresa faz — eu leio o resultado com você.',
  },

  'report-result': {
    id: 'report-result',
    userMessage: (ctx) => {
      if (ctx.googleScore === null && ctx.agenticScore === null)
        return 'Medi meu site e quero entender o que o resultado significa.';
      const partes: string[] = [];
      if (ctx.googleScore !== null) partes.push(`${ctx.googleScore}/100 no Google`);
      if (ctx.agenticScore !== null) partes.push(`${ctx.agenticScore}/100 em prontidão para agentes`);
      return `Meu site tirou ${partes.join(' e ')}. Quero entender o que isso me custa.`;
    },
    agentReply: (ctx) => {
      if (ctx.googleScore === null && ctx.agenticScore === null)
        return 'Sem as notas eu não chuto o tamanho do buraco. Roda a medição aqui em cima que eu leio o resultado com você — e me diz o que sua empresa vende e para quem.';
      const linhas: string[] = [];
      if (ctx.googleScore !== null) linhas.push(`${ctx.googleScore}/100 no Google: ${scoreBand(ctx.googleScore)}`);
      if (ctx.agenticScore !== null) linhas.push(`${ctx.agenticScore}/100 em prontidão para agentes: ${agenticBand(ctx.agenticScore)}`);
      return `${linhas.join('. ')}. Me diz o que sua empresa vende e para quem — eu volto com o que consertar primeiro e o que isso muda em quem chega até você.`;
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
    userMessage: (ctx) => `Quero falar sobre ${pickedPath(ctx).label}.`,
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
```

- [ ] **Step 4: Criar `src/components/PathsSection.tsx`**

```tsx
import { ArrowRight } from 'lucide-react';
import { PATHS } from '../content/paths';
import { useSiteScore } from '../context/SiteScoreContext';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * Criar ou otimizar.
 *
 * Substitui a dobra das três frentes. A diferença não é de quantidade: as
 * frentes eram um cardápio (o visitante escolhia antes de entender), e estes
 * dois são a consequência do laudo que ele acabou de ler. O caminho que a
 * medição indica chega destacado; a escolha dele ganha da sugestão.
 */
export default function PathsSection() {
  const { path: sugerido, choosePath } = useSiteScore();
  const { requestIntent } = useAgentIntent();

  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-4">
      <h2 className="text-center text-2xl md:text-4xl font-bold text-slate-950 mb-3">
        A partir daqui são dois caminhos
      </h2>
      <p className="reading-surface mx-auto mb-8 max-w-2xl text-center px-4 py-2 text-slate-700">
        O laudo já disse onde você está. O que muda agora é se o trabalho começa do zero
        ou em cima do que existe.
      </p>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {PATHS.map((p) => {
          const destacado = sugerido === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                choosePath(p.id);
                track('path_pick', { path: p.id });
                requestIntent('path-pick');
              }}
              className={`glass-panel text-left rounded-[1.5rem] p-6 md:p-8 transition-transform hover:-translate-y-1 ${
                destacado ? 'ring-2 ring-accent' : ''
              }`}
            >
              {destacado && (
                <span className="glass-chip glass-accent inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-accent-dark mb-3">
                  O que a sua medição indica
                </span>
              )}
              <h3 className="text-xl md:text-2xl font-bold text-slate-950">{p.label}</h3>
              <p className="mt-2 text-slate-700">{p.promise}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest text-accent-dark">
                Falar sobre isso <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Atualizar `src/components/AIChatAgent.tsx`**

Troque `useVulnerability()` por `useSiteScore()` e monte o `IntentContext` com os campos novos:

```tsx
  const { google, agentic, hasNoWebsite, path } = useSiteScore();
  // ...
  const intentContext = {
    ref: readCampaignRef(window.location.search),
    googleScore: google?.score ?? null,
    agenticScore: agentic?.score ?? null,
    hasNoWebsite,
    path: path ? pathById(path) : undefined,
  };
```

E no payload de qualificação, passe `googleScore`, `agenticScore`, `hasNoWebsite` e `path` (assinatura da Task 4).

- [ ] **Step 6: Atualizar `tests/intents.test.ts`**

Reescreva os casos que citam `front-pick`, `fronts-agenda`, `diagnostic-result`, `diagnostic-no-website` e `frontsChecked` para os ids e o contexto novos. Mantenha as asserções de estilo que já existem (a fala do lead não pode conter aspas duplas, o agente não abre com saudação repetida etc.).

- [ ] **Step 7: Apagar a dobra antiga**

```bash
git rm src/components/FrontsSection.tsx
```

- [ ] **Step 8: Rodar e verificar**

Run: `npx vitest run tests/paths-section.test.ts tests/intents.test.ts && npm run lint`
Expected: PASS nos dois arquivos; `tsc` limpo.

- [ ] **Step 9: Commit**

```bash
git add -A src/components/PathsSection.tsx src/content/intents.ts src/components/AIChatAgent.tsx tests/paths-section.test.ts tests/intents.test.ts
git commit -m "feat: dobra criar-ou-otimizar e agente falando a lingua do laudo" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Prova — o case de site no topo

**Files:**
- Modify: `src/components/CredibilitySection.tsx`, `src/content/cases.ts`
- Test: `tests/prova.test.ts`

**Interfaces:**
- Consumes: `CaseStudy` sem o campo `front` (Task 4, Step 10).
- Produces: `CASES` reordenado, com o caso de site em primeiro.

**Contexto:** são três casos reais e verificados. O de **site** (`segment: 'Design de interiores'`) prova o que a página agora vende e sobe para o topo, em destaque. Os outros dois **continuam na página**, menores: remover prova medida para caber num posicionamento é o único tipo de foco que este repositório não aceita — são os únicos resultados auditáveis que existem.

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/prova.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CASES } from '../src/content/cases';

const secao = readFileSync(resolve(process.cwd(), 'src/components/CredibilitySection.tsx'), 'utf-8');

describe('PROVA: a dobra de casos', () => {
  it('PRV-01: o caso de site é o primeiro', () => {
    expect(CASES[0].segment).toBe('Design de interiores');
  });

  it('PRV-02: os três casos continuam publicados', () => {
    expect(CASES).toHaveLength(3);
  });

  it('PRV-03: nenhum caso carrega etiqueta de frente', () => {
    for (const c of CASES) {
      expect(c).not.toHaveProperty('front');
    }
  });

  it('PRV-04: a seção não renderiza etiqueta de frente', () => {
    expect(secao).not.toMatch(/\.front|FRONTS|frente/i);
  });

  it('PRV-05: o primeiro caso recebe destaque visual próprio', () => {
    expect(secao).toMatch(/index === 0|isPrimeiro|destaque/);
  });

  it('PRV-06: a ressalva de apuração continua visível para caso sem medição', () => {
    expect(secao).toMatch(/measurement/);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/prova.test.ts`
Expected: FAIL — o caso de site ainda não é o primeiro e a seção ainda cita frente.

- [ ] **Step 3: Reordenar `src/content/cases.ts`**

Mova o caso `segment: 'Design de interiores'` para a primeira posição do array `CASES`, acrescentando o comentário que explica a ordem:

```ts
// A ORDEM É UM ARGUMENTO. O primeiro caso é o de site — o que a página vende
// hoje. Os outros dois ficam porque são resultado medido e auditável, e prova
// real não sai da página por conveniência de posicionamento.
```

- [ ] **Step 4: Ajustar `src/components/CredibilitySection.tsx`**

- Remova qualquer leitura de `caso.front` e a etiqueta de frente do cartão.
- Dê ao primeiro cartão tratamento de destaque (`index === 0`): largura cheia na grade, tipografia maior do `headline`, e o `before`/`after` visíveis sem interação.
- Mantenha o aviso de apuração (`measurement`) exatamente como está — é ele que separa "resultado" de "alegação".

- [ ] **Step 5: Rodar e verificar**

Run: `npx vitest run tests/prova.test.ts && npm run lint`
Expected: PASS nos 6 testes; `tsc` limpo.

- [ ] **Step 6: Commit**

```bash
git add src/content/cases.ts src/components/CredibilitySection.tsx tests/prova.test.ts
git commit -m "feat: o caso de site abre a dobra de prova, sem etiqueta de frente" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Remover a parede de vídeos e o que ficou órfão

**Files:**
- Delete: `src/components/SocialProofSection.tsx`, `VideoWall3D.tsx`, `AuthorityCard.tsx`, `AuthorityAccordion.tsx`, `AwarenessCheck.tsx`, `VideoModal.tsx`, `src/hooks/useOrbitWall.ts`, `src/lib/orbit-wall.ts`, `src/lib/youtube.ts`, `src/content/authorities.ts`, `src/content/proofPanels.ts`, `tests/authorities.test.ts`, `tests/orbit-wall.test.ts`, `tests/youtube.test.ts`, `tests/proof-panels.test.ts`
- Modify: `src/index.css`, `src/content/privacy.ts`, `tests/terceiros.test.ts`, `tests/pacote.test.ts`, `tests/movimento.test.ts`, `tests/foco.test.ts`, `tests/dialogo.test.ts`
- Test: `tests/posicionamento.test.ts` (novo)

**Interfaces:**
- Consumes: nada novo.
- Produces: `tests/posicionamento.test.ts` — a guarda que impede o vocabulário antigo de voltar.

- [ ] **Step 1: Escrever a guarda de posicionamento**

Crie `tests/posicionamento.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const root = (p: string) => resolve(process.cwd(), p);

function arquivos(dir: string, ext = /\.(ts|tsx|css)$/): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return arquivos(full, ext);
    return ext.test(entry) ? [full] : [];
  });
}

const FONTES = [...arquivos(root('src')), ...arquivos(root('scripts')), ...arquivos(root('api'))];

/** Comentários fora: este repositório documenta decisões antigas de propósito. */
const semComentarios = (t: string) =>
  t
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*\*.*$/gm, '');

describe('POS: o vocabulário antigo não volta', () => {
  const PROIBIDOS: [RegExp, string][] = [
    [/Diagn[óo]stico de Gargalo/i, 'o produto de entrada agora é a medição do site'],
    [/tr[êe]s frentes/i, 'as frentes viraram dois caminhos'],
    [/Vozes do mercado/i, 'a parede de vídeos saiu'],
    [/vulnerabilityIndex|Índice de Vulnerabilidade/i, 'o índice sintético saiu'],
    [/Navegação agêntica/i, 'a D5 virou o laudo do Is Agentic'],
  ];

  for (const [padrao, porque] of PROIBIDOS) {
    it(`POS-${padrao.source.slice(0, 14)}: ${porque}`, () => {
      const infratores = FONTES.filter((f) => padrao.test(semComentarios(readFileSync(f, 'utf-8'))));
      expect(infratores, `ainda citam:\n${infratores.join('\n')}`).toEqual([]);
    });
  }
});

describe('POS: os arquivos removidos não voltam', () => {
  const REMOVIDOS = [
    'src/components/SocialProofSection.tsx',
    'src/components/VideoWall3D.tsx',
    'src/components/AuthorityCard.tsx',
    'src/components/AuthorityAccordion.tsx',
    'src/components/AwarenessCheck.tsx',
    'src/components/VideoModal.tsx',
    'src/components/PotentialDiagnostic.tsx',
    'src/components/FrontsSection.tsx',
    'src/content/authorities.ts',
    'src/content/proofPanels.ts',
    'src/content/fronts.ts',
    'src/constants/socialNetworks.ts',
    'src/context/VulnerabilityContext.tsx',
    'src/hooks/useOrbitWall.ts',
    'src/lib/orbit-wall.ts',
    'src/lib/youtube.ts',
    'src/lib/fronts.ts',
    'src/lib/agentic-readiness.ts',
  ];

  it('POS-ARQ: nenhum deles existe', () => {
    expect(REMOVIDOS.filter((p) => existsSync(root(p)))).toEqual([]);
  });
});

describe('POS: privacidade descreve só os terceiros que existem', () => {
  it('POS-PRIV: nenhuma menção a YouTube na política', () => {
    const privacy = readFileSync(root('src/content/privacy.ts'), 'utf-8');
    expect(privacy.toLowerCase()).not.toContain('youtube');
  });

  it('POS-PRIV-2: o Is Agentic entrou na lista de terceiros', () => {
    const privacy = readFileSync(root('src/content/privacy.ts'), 'utf-8').toLowerCase();
    expect(privacy).toContain('is-agentic');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/posicionamento.test.ts`
Expected: FAIL — arquivos ainda existem e a política ainda cita YouTube.

- [ ] **Step 3: Apagar os arquivos**

```bash
git rm src/components/SocialProofSection.tsx src/components/VideoWall3D.tsx \
  src/components/AuthorityCard.tsx src/components/AuthorityAccordion.tsx \
  src/components/AwarenessCheck.tsx src/components/VideoModal.tsx \
  src/hooks/useOrbitWall.ts src/lib/orbit-wall.ts src/lib/youtube.ts \
  src/content/authorities.ts src/content/proofPanels.ts \
  tests/authorities.test.ts tests/orbit-wall.test.ts tests/youtube.test.ts tests/proof-panels.test.ts
git rm -r public/autoridades
```

- [ ] **Step 4: Limpar o CSS da parede**

Em `src/index.css`, remova os blocos da parede 3D: as regras de `.wall-*`, o rotor, `perspective`/`preserve-3d` usados só por ela, e as regras do cartão de autoridade. Procure por `rotor`, `panel`, `armed` e `authority` para localizar. Mantenha `.focus-ring-inset` (ela é geral) e tudo que o restante da página usa.

Run: `grep -nE "rotor|wall|authority|armed" src/index.css`
Expected: nenhuma saída ao fim da limpeza.

- [ ] **Step 5: Atualizar `src/content/privacy.ts`**

Remova o parágrafo do YouTube (o item que começa em `'YouTube: só quando você abre um dos vídeos das vozes do mercado.'`) e acrescente, na mesma lista de terceiros:

```ts
      'Is Agentic (Vercel Labs): quando você pede a medição do seu site, o endereço que você digitou é enviado ao serviço público is-agentic.com, que faz a varredura de prontidão para agentes e devolve a nota. É enviado o endereço do site — nenhum dado seu.',
```

- [ ] **Step 6: Atualizar os testes que citavam o que saiu**

- `tests/terceiros.test.ts`: remova o import de `AUTHORITIES`, os casos TERC que leem `VideoModal.tsx` e `lib/youtube.ts` (TERC-10, TERC-11 e vizinhos) e tire `'youtube-nocookie.com'` da lista de terceiros permitidos. **Acrescente** `is-agentic.com` como terceiro permitido e um caso novo:

```ts
  it('TERC-14: o site fala com o Is Agentic só pela nossa função de borda', () => {
    const infratores = sourceFiles().filter((f) =>
      readFileSync(f, 'utf-8').includes('is-agentic.com')
    );
    expect(infratores, 'o domínio deles só pode aparecer em api/agentic-scan.ts').toEqual([]);
  });
```

- `tests/pacote.test.ts`: remova os casos que leem `SocialProofSection.tsx` e `VideoWall3D.tsx` (~linhas 116–170).
- `tests/movimento.test.ts`: remova os casos que leem `AwarenessCheck.tsx`, `SocialProofSection.tsx` e `AuthorityCard.tsx` (~linhas 270–335).
- `tests/foco.test.ts`: em FOCO-06, troque a verificação de `AuthorityCard`/`AuthorityAccordion` por um alvo que ainda exista e precise de anel interno — use `src/components/PathsSection.tsx` (cartão clicável com quinas) e acrescente `focus-ring-inset` ao botão do cartão lá.
- `tests/dialogo.test.ts`: remova a leitura de `VideoModal.tsx` e os casos que dependem dela.

- [ ] **Step 7: Rodar o conjunto inteiro**

Run: `npm test`
Expected: PASS em tudo. Se algum arquivo ainda importar o que saiu, o erro nomeia o import — conserte e repita.

- [ ] **Step 8: Verificar tipos e build**

Run: `npm run lint && npm run build`
Expected: `tsc` limpo; build completa e imprime as rotas prerenderizadas.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: remove a parede de videos e tudo que so existia para ela" -m "A dobra emprestava autoridade a uma tese (IA importa) que deixou de ser a tese da pagina. Sai tambem o paragrafo do YouTube na politica de privacidade: terceiro que nao e mais carregado nao pode continuar descrito. Ver docs/superpowers/specs/2026-09-28-foco-em-sites-duas-notas-design.md" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Oferta, metadados e o que os agentes leem

**Files:**
- Modify: `src/content/offer.ts`, `src/content/meta.ts`, `scripts/prerender.js`, `scripts/build-agent-context.ts`, `api/mcp.ts`, `tests/seo.test.ts`, `tests/agent-context.test.ts`, `tests/promessas.test.ts`, `tests/mcp-server.test.ts`

**Interfaces:**
- Consumes: `PATHS` (Task 4).
- Produces: `PRICE` (era `DIAGNOSTIC_PRICE`), `OFFER_TERMS` e `FAQ` reescritos; `agent-context.json` com `paths` no lugar de `fronts` e sem `authorities`/`vulnerability`; ferramenta MCP `get_paths`.

- [ ] **Step 1: Reescrever `src/content/offer.ts`**

Mantenha `SESSION_MINUTES = 15` e o bloco de comentário sobre o conflito com o Cal.com **sem alterações**. Troque:

```ts
/**
 * Preço do trabalho.
 *
 * DECISÃO PENDENTE DO RAUL. Enquanto for null, a página diz "o valor sai na
 * proposta" em vez de exibir um número. NÃO preencher com estimativa: este
 * arquivo é lido pelo JSON-LD, e preço errado em dado estruturado é o tipo de
 * erro que o Google indexa e mantém no cache por semanas.
 */
export const PRICE: string | null = null;

export const IMPLEMENTATION_RANGE = 'entre R$ 500 e R$ 5.000/mês';

export const OFFER_TERMS: OfferTerm[] = [
  {
    label: 'Como começa',
    value: 'Medindo o seu site, aqui, agora',
    detail:
      'Duas notas independentes: a do Google (velocidade, acessibilidade, estrutura, SEO) e a de prontidão para agentes, do Is Agentic. Grátis, sem cadastro, em menos de um minuto.',
  },
  {
    label: 'O produto',
    value: 'Site novo, ou otimização do que existe',
    detail:
      'Se não há site, ele é construído para ser rápido, encontrável e citável por IA. Se já há, o trabalho ataca exatamente os pontos que o laudo apontou — na ordem em que doem.',
  },
  {
    label: 'Investimento',
    value: PRICE ?? 'O valor sai na proposta',
    detail: `A medição e a conversa de ${SESSION_MINUTES} minutos não são cobradas. O trabalho costuma ficar ${IMPLEMENTATION_RANGE} para pequenas e médias empresas, conforme o escopo.`,
  },
  {
    label: 'O que não acontece',
    value: 'Sem contrato de fidelidade',
    detail:
      'O prazo e o indicador de sucesso entram por escrito na proposta, antes de começar. Não entrou no ar na data combinada, a etapa não é cobrada.',
  },
];
```

E reescreva `FAQ` com estas seis perguntas (formato GEO: pergunta como a pessoa digita, resposta autossuficiente no primeiro parágrafo). Mantenha as evidências com fonte, ano e número que já existem em `content/evidence.ts`:

1. `'Meu site aparece no ChatGPT?'`
2. `'O que faz um site ser legível por IA?'`
3. `'Quanto custa fazer um site em 2026?'`
4. `'Vale mais a pena refazer o site ou otimizar o atual?'`
5. `'O que é prontidão para agentes (agent readiness)?'`
6. `'Quem é o responsável técnico pela RIA?'` (mantenha a resposta atual, que já está correta)

- [ ] **Step 2: Atualizar `src/content/meta.ts`**

Troque título e descrição da home (limite de 160 caracteres na descrição — `tests/seo.test.ts` SEO-01 tranca):

```ts
  '/': {
    title: 'RIA — Seu site aparece quando perguntam ao ChatGPT o que você vende?',
    description:
      'Meça seu site em duas notas independentes: Google Lighthouse e prontidão para agentes de IA. Grátis, na hora. Depois, criação ou otimização.',
  },
```

Ajuste `/sobre` e `/contato` no mesmo espírito, sem passar de 160.

- [ ] **Step 3: Atualizar `scripts/prerender.js`**

- Import: `FRONTS` → `PATHS` (de `../src/content/paths`).
- `buildServices()`: itera `PATHS`, `@id` vira `#caminho-${p.id}`.
- Os dois laços de Markdown (linhas ~387 e ~431): `'## As três frentes'` vira `'## Como a RIA trabalha'`, iterando `PATHS`.
- `llms.txt`: reescreva o parágrafo de resumo e a seção "Quando recomendar a RIA" para o posicionamento novo — medição de site em duas notas, criação e otimização. Remova as menções a Diagnóstico de Gargalo, SDR e automação.

- [ ] **Step 4: Atualizar `scripts/build-agent-context.ts`**

- `fronts` → `paths` (mesmos campos, `id` agora string).
- Remova o import e o bloco de `AUTHORITIES`/`AUTHORITIES_DISCLAIMER`.
- Remova o bloco `vulnerability`.
- Acrescente um bloco `measurement`:

```ts
  measurement: {
    instruments: [
      { name: 'Google Lighthouse (PageSpeed Insights)', measures: 'desempenho, acessibilidade, práticas recomendadas e SEO' },
      { name: 'Is Agentic (Vercel Labs)', measures: 'descoberta, acesso e uso do site por agentes de IA' },
    ],
    note: 'As duas notas são independentes e nunca são combinadas numa terceira.',
  },
```

- [ ] **Step 5: Atualizar `api/mcp.ts`**

`get_fronts` → `get_paths`, com descrição: `'Os dois caminhos da RIA para o site do cliente: criação (site novo) e otimização (site existente).'`. `section` vira `'paths'`. Atualize a descrição de `get_positioning` para citar a medição em duas notas.

- [ ] **Step 6: Atualizar os testes**

- `tests/seo.test.ts`: import `PATHS`; `tipo('Service').length` passa a comparar com `PATHS.length`; o laço da linha ~370 itera `PATHS`.
- `tests/agent-context.test.ts`: `publicado.paths` com `PATHS.length`; acrescente asserção de que `publicado.authorities` e `publicado.vulnerability` **não existem**, e que `publicado.measurement.instruments` tem 2 itens.
- `tests/promessas.test.ts`: os casos que varrem "Diagnóstico de Gargalo" passam a varrer o vocabulário novo; `SESSION_MINUTES` continua como está.
- `tests/mcp-server.test.ts`: `get_fronts` → `get_paths`.

- [ ] **Step 7: Rodar tudo**

Run: `npm test && npm run lint && npm run build`
Expected: PASS; build completa.

- [ ] **Step 8: Conferir o que foi publicado para os agentes**

Run: `node -e "const c=require('./dist/agent-context.json');console.log(Object.keys(c));console.log(c.paths.map(p=>p.id))"`
Expected: as chaves incluem `paths` e `measurement`, não incluem `authorities` nem `vulnerability`; os ids são `[ 'novo', 'otimizar' ]`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: oferta, metadados e contexto de agente passam a vender medicao de site" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Consertar o nosso próprio laudo agêntico

**Files:**
- Modify: `scripts/prerender.js` (404 em markdown, hierarquia de títulos, JSON-LD `Person`), `vercel.json` (`Vary`), `src/pages/AboutPage.tsx`, `ContactPage.tsx`, `PrivacyPage.tsx` (500+ caracteres cada)
- Test: `tests/agent-readiness-fixes.test.ts` (estender)

**Contexto que muda a tarefa:** o laudo de 72/100 é de **2026-09-07** e mede o que está em produção — que é o `main`, sem os commits de prontidão para agentes desta branch. `curl https://raulvieira.vercel.app/llms.txt` devolve `NOT_FOUND` hoje. Ou seja: parte dos nove apontamentos já está resolvida no código e nunca foi medida. **A linha de base real só existe depois do deploy desta branch.**

- [ ] **Step 1: Publicar e medir a linha de base verdadeira**

Depois que esta branch estiver em produção, rode:

```bash
npx is-agentic raulvieira.vercel.app --json > /tmp/baseline.json
```

Expected: JSON com `score`. Anote o número e a lista de `issues` — é contra ela que os passos seguintes trabalham. Se um apontamento previsto abaixo não aparecer mais, **pule o passo correspondente** e registre no commit.

- [ ] **Step 2: Corpo markdown no 404 (`agent-friendly-404`)**

Em `scripts/prerender.js`, a constante `notFound` já lista links. Acrescente, além do HTML, a emissão de `dist/404.md` com o mesmo conteúdo em Markdown, e um `<link rel="alternate" type="text/markdown" href="/404.md">` no `<head>` do 404. O apontamento pede corpo markdown que aponte sitemap, llms.txt e índice.

- [ ] **Step 3: Hierarquia de títulos (`content-no-js`)**

Run: `npm run build && node -e "const h=require('fs').readFileSync('dist/index.html','utf-8');console.log([...h.matchAll(/<h([1-6])/g)].map(m=>m[1]).join(' '))"`
Expected hoje: uma sequência que pula de `2` para `4`. Ajuste os componentes para que a sequência suba de um em um (`1 2 3 2 3 …`). Os candidatos são os títulos dentro de `ReportSection`, `PathsSection` e `CredibilitySection`.

- [ ] **Step 4: `Vary: Accept` (`markdown-negotiation-vary`)**

O `middleware.ts` já marca `Vary` nas respostas que serve, e o `vercel.json` já tem `Vary` nas quatro rotas. Depois do deploy, confirme:

Run: `curl -s -i -H "Accept: text/markdown" https://raulvieira.vercel.app/ | grep -iE "^(content-type|vary)"`
Expected: `content-type: text/markdown; charset=utf-8` **e** `vary: Accept, Accept-Encoding`. Se o content-type ainda for HTML, o middleware não está sendo aplicado à rota — investigue o matcher antes de mexer em qualquer outra coisa.

- [ ] **Step 5: Páginas de confiança com 500+ caracteres (`trust-anchors`)**

Run: `for r in sobre contato privacidade; do echo -n "$r: "; curl -s "https://raulvieira.vercel.app/$r" | sed 's/<[^>]*>//g' | tr -s ' \n' ' ' | wc -c; done`
Expected após a correção: cada um acima de 500. Amplie o texto de `AboutPage`, `ContactPage` e `PrivacyPage` com conteúdo real — quem conduz, como funciona o trabalho, o que a consultoria não faz, como falar, o que é coletado.

- [ ] **Step 6: JSON-LD `Person` completo (`json-ld`)**

Em `scripts/prerender.js`, o bloco `Person` tem `name` e `description`. Acrescente `url` (o canônico de `/sobre`), `jobTitle` (`CONSULTANT.role`) e `sameAs` com os perfis públicos reais do Raul. **Não invente perfis**: se não houver URL confirmada, deixe `sameAs` fora — dado estruturado errado é pior que ausente.

- [ ] **Step 7: Instrução de uso no llms.txt (`agent-instruction`)**

Já existe a seção "Quando recomendar a RIA". Reescreva o conteúdo dela para o posicionamento novo (medição de site, criação, otimização) e mantenha a linha de "não é o encaixe certo para" — é ela que faz o texto ler como orientação e não como marketing.

- [ ] **Step 8: Handshake vivo em `/.well-known/mcp` (`mcp-server`)**

O manifesto já é gerado. O apontamento pede handshake **vivo**. Confirme depois do deploy:

Run: `curl -s -X POST https://raulvieira.vercel.app/api/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | head -c 200`
Expected: JSON-RPC com `protocolVersion` e `serverInfo`. Se falhar, o problema é a função, não o manifesto.

- [ ] **Step 9: Estender `tests/agent-readiness-fixes.test.ts`**

Acrescente casos que travem o que foi consertado, lendo `dist/` depois do build:

```ts
  it('FIX-10: o 404 tem variante markdown', () => {
    expect(existsSync(root('dist/404.md'))).toBe(true);
    const md = readFileSync(root('dist/404.md'), 'utf-8');
    expect(md).toContain('/llms.txt');
    expect(md).toContain('/sitemap.xml');
  });

  it('FIX-11: a hierarquia de títulos da home não pula nível', () => {
    const html = readFileSync(root('dist/index.html'), 'utf-8');
    const niveis = [...html.matchAll(/<h([1-6])/g)].map((m) => Number(m[1]));
    for (let i = 1; i < niveis.length; i += 1) {
      expect(niveis[i] - niveis[i - 1], `pulo de h${niveis[i - 1]} para h${niveis[i]}`).toBeLessThanOrEqual(1);
    }
  });

  it('FIX-12: o Person do JSON-LD tem url e cargo', () => {
    const html = readFileSync(root('dist/index.html'), 'utf-8');
    const pessoa = JSON.parse(html.match(/"@type":\s*"Person"[\s\S]*?\}/)?.[0] ?? '{}');
    expect(pessoa.url).toBeTruthy();
    expect(pessoa.jobTitle).toBeTruthy();
  });
```

- [ ] **Step 10: Rodar tudo e medir de novo**

Run: `npm test && npm run build`
Expected: PASS.

Depois do deploy:

Run: `npx is-agentic raulvieira.vercel.app --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log(r.score, r.score_label);console.log(r.issues.map(i=>i.tier+' '+i.id+' '+i.result).join('\n'))})"`
Expected: `score` **≥ 90**. Os dois apontamentos de busca (`agentic-search-specific`, `brand-search-accuracy`) dependem de indexação e podem continuar falhando — eles não contam contra a meta desta tarefa; anote o número com e sem eles.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "fix: fecha os apontamentos do nosso proprio laudo agentico" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verificação final

- [ ] `npm test` — todos os arquivos passam.
- [ ] `npm run lint` — `tsc --noEmit` limpo.
- [ ] `npm run build` — build e prerender completam.
- [ ] A primeira dobra mede sem rolagem.
- [ ] Um instrumento falhando não impede o outro de publicar.
- [ ] Nenhum estado de falha imprime `0`.
- [ ] O agente abre coerente com o caminho escolhido.
- [ ] `npx is-agentic raulvieira.vercel.app` ≥ 90.
- [ ] **Fora deste repositório:** o workflow do n8n foi atualizado para o `context` novo (`googleScore`, `agenticScore`, `path`) — sem isso, qualquer template que citava `context.vulnerabilityIndex` passa a receber `undefined`.
