# A Travessia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a landing RIA de 7 para 6 dobras, fazendo o agente de chat conduzir a qualificação em cinco campos e abrir a agenda da sessão de 30 minutos.

**Architecture:** Toda lógica nova nasce em módulos puros sob `src/lib/` e `src/content/`, cobertos por vitest; os componentes React apenas consomem essa lógica. O `VulnerabilityContext` continua sendo a fonte única do que o visitante revelou, e ganha o objeto de qualificação. O agente vira uma máquina de três estágios (conversa → qualificação → agenda) que orquestra dois componentes que não se conhecem.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Tailwind 4, motion/react, lucide-react, vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-18-storytelling-travessia-design.md`

## Global Constraints

- **Testes rodam em `environment: 'node'`** e só coletam `tests/**/*.test.ts`. Não existe jsdom nem React Testing Library no projeto e **este plano não adiciona nenhum dos dois**. Componentes `.tsx` não são testados por unidade; são verificados por `npm run lint` (tsc) e pelo preview no navegador. Toda regra de negócio testável precisa morar num `.ts` puro.
- **`tests/config.test.ts` é um contrato ativo:** o telefone `5516997879837` só pode aparecer em `src/constants/links.ts`; nenhuma URL contendo `webhook` ou `easypanel` pode aparecer fora de `src/config.ts`. A URL da agenda segue a mesma regra por decisão do spec.
- **Comentários no código são em português sem acentuação**, seguindo o padrão já estabelecido no repositório (`Indice`, `capitulo`, `pagina`). Texto visível ao usuário é acentuado normalmente.
- **Nada de número fabricado.** Regra registrada em `src/content/cases.ts`: o que o cliente informou entra como informado, o que falta fica vazio.
- **Nome do consultor:** `Raul Vieira`, papel `Consultor de Inteligência Artificial`, credencial de topo `Engenheiro de Produção — Universidade Federal de São Carlos (UFSCar)`. Suposição registrada na seção 9 do spec, pendente de confirmação do Raul.
- **Provedor da agenda:** Cal.com por iframe, sem dependência nova. `VITE_BOOKING_URL` no ambiente.
- **Ordem final das dobras (6):** 0 A onda · 1 Vozes do mercado · 2 Diagnóstico de presença digital · 3 As 5 frentes · 4 Prova + quem executa · 5 O agente e a agenda. `CTA_CHAPTER = 5`.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/content/fronts.ts` | Dados das cinco frentes e o vínculo caso → frente. Sem lógica. |
| `src/lib/fronts.ts` | Regra de pré-resolução da frente 1 a partir do diagnóstico, e contagem. |
| `src/lib/qualification.ts` | Definição dos cinco passos, validadores e montagem do payload. |
| `src/lib/booking.ts` | Monta a URL da agenda com pré-preenchimento. Agnóstico de provedor. |
| `src/components/FiveFronts.tsx` | Dobra 3. Substitui `OperationalAIChecklist.tsx`. |
| `src/components/CredibilitySection.tsx` | Dobra 4. Absorve `ProofSection` e `ConsultantSection`. |
| `src/components/QualificationFlow.tsx` | Os cinco passos inline, dentro da bolha do chat. |
| `src/components/BookingEmbed.tsx` | Iframe da agenda + fallback WhatsApp. |
| `src/components/AIChatAgent.tsx` | Orquestra os três estágios. |
| `src/components/OfferSection.tsx` | Faixa horizontal de quatro termos. |
| `src/pages/LandingPage.tsx` | Seis dobras. |
| `src/context/VulnerabilityContext.tsx` | `frontsChecked` + `qualification`. |

---

### Task 1: As cinco frentes como conteúdo e regra

**Files:**
- Create: `src/content/fronts.ts`
- Create: `src/lib/fronts.ts`
- Modify: `src/content/cases.ts`
- Test: `tests/fronts.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `FRONTS: Front[]` com `Front = { id: FrontId; label: string; promise: string; tag: string }`, `FrontId = 1|2|3|4|5`; `resolveFirstFront(input: { hasNoWebsite: boolean; websiteScore: number | null }): boolean | null`; `countChecked(checks: boolean[]): number`; `CaseStudy` ganha `front?: FrontId`.

- [ ] **Step 1: Write the failing test**

Create `tests/fronts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FRONTS } from '../src/content/fronts';
import { resolveFirstFront, countChecked } from '../src/lib/fronts';
import { CASES } from '../src/content/cases';

describe('FRONTS: o catalogo real da RIA', () => {
  it('FRONT-01: sao exatamente cinco frentes, com ids de 1 a 5', () => {
    expect(FRONTS).toHaveLength(5);
    expect(FRONTS.map((f) => f.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('FRONT-02: a primeira frente e a presenca digital, que amarra com a dobra 2', () => {
    expect(FRONTS[0].label).toContain('Presença digital');
  });

  it('FRONT-03: nenhuma frente tem label ou promessa vazia', () => {
    for (const f of FRONTS) {
      expect(f.label.trim().length).toBeGreaterThan(0);
      expect(f.promise.trim().length).toBeGreaterThan(0);
      expect(f.tag.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('resolveFirstFront: a dobra 2 pre-resolve a frente 1', () => {
  it('FRONT-04: quem declarou nao ter site chega com a frente 1 vazia', () => {
    expect(resolveFirstFront({ hasNoWebsite: true, websiteScore: null })).toBe(false);
  });

  it('FRONT-05: nota abaixo de 70 chega com a frente 1 vazia', () => {
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: 69 })).toBe(false);
  });

  it('FRONT-06: nota de 70 para cima chega com a frente 1 marcada', () => {
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: 70 })).toBe(true);
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: 95 })).toBe(true);
  });

  it('FRONT-07: quem nao fez o diagnostico chega neutro, como as outras quatro', () => {
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: null })).toBeNull();
  });
});

describe('countChecked', () => {
  it('FRONT-08: conta apenas as marcadas', () => {
    expect(countChecked([true, false, true, false, false])).toBe(2);
    expect(countChecked([false, false, false, false, false])).toBe(0);
  });
});

describe('CASES: cada caso prova uma frente', () => {
  it('FRONT-09: todo caso aponta para uma frente existente', () => {
    const ids = FRONTS.map((f) => f.id);
    for (const c of CASES) {
      expect(c.front).toBeDefined();
      expect(ids).toContain(c.front);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/fronts.test.ts
```

Expected: FAIL — `Failed to resolve import "../src/content/fronts"`.

- [ ] **Step 3: Create the fronts content**

Create `src/content/fronts.ts`:

```ts
// As cinco frentes.
//
// Este arquivo e o catalogo do que a RIA vende. Ele existia so implicito, como
// checklist de "pilares de IA operacional" — o visitante marcava caixas sem
// nunca ler o que se compra. Aqui a lista passa a declarar a oferta.
//
// A frente 1 nao e uma escolha de ordem: ela e a mesma coisa que a dobra 2
// diagnostica. Ver resolveFirstFront em src/lib/fronts.ts.

export type FrontId = 1 | 2 | 3 | 4 | 5;

export interface Front {
  id: FrontId;
  /** Nome da frente, como o visitante le no cartao. */
  label: string;
  /** O que ela entrega, numa linha. */
  promise: string;
  /** Etiqueta curta usada quando um caso aponta para esta frente. */
  tag: string;
}

export const FRONTS: Front[] = [
  {
    id: 1,
    label: 'Presença digital pronta para IA',
    promise: 'Site que o ChatGPT, o Gemini e o Perplexity conseguem citar quando alguém procura o que você vende.',
    tag: 'Presença digital',
  },
  {
    id: 2,
    label: 'Agente SDR 24/7',
    promise: 'Responde, qualifica e agenda sozinho — inclusive às duas da manhã de domingo.',
    tag: 'Agente SDR',
  },
  {
    id: 3,
    label: 'Automação de processos',
    promise: 'As rotinas repetitivas saem da mão da equipe e passam a rodar sem ninguém olhando.',
    tag: 'Automação',
  },
  {
    id: 4,
    label: 'Sistema sob medida',
    promise: 'O software que a sua operação precisa e que não existe pronto para comprar.',
    tag: 'Sistema sob medida',
  },
  {
    id: 5,
    label: 'Dados e decisão',
    promise: 'Números que dizem o que fazer na segunda-feira, não o que aconteceu no mês passado.',
    tag: 'Dados e decisão',
  },
];
```

- [ ] **Step 4: Create the fronts logic**

Create `src/lib/fronts.ts`:

```ts
import type { FrontId } from '../content/fronts';

/**
 * Corte da saude do site.
 *
 * Abaixo disso a presenca digital nao conta como coberta: o site existe, mas
 * nao sustenta ser citado por motor generativo. O numero acompanha a faixa alta
 * do diagnostico da dobra 2.
 */
export const HEALTHY_SITE_SCORE = 70;

export interface FirstFrontInput {
  hasNoWebsite: boolean;
  websiteScore: number | null;
}

/**
 * A frente 1 chega pre-resolvida pelo diagnostico da dobra 2 — e essa e a
 * costura que faltava entre as duas dobras.
 *
 * `null` significa "o visitante nao se diagnosticou": a frente entra neutra,
 * igual as outras quatro. Nao confundir com `false`, que e uma afirmacao — o
 * diagnostico rodou e a presenca digital nao esta coberta.
 */
export function resolveFirstFront(input: FirstFrontInput): boolean | null {
  if (input.hasNoWebsite) return false;
  if (input.websiteScore === null) return null;
  return input.websiteScore >= HEALTHY_SITE_SCORE;
}

export function countChecked(checks: boolean[]): number {
  return checks.filter(Boolean).length;
}

/** Ids das frentes ainda descobertas — a pauta da sessao. */
export function missingFronts(checks: boolean[], ids: FrontId[]): FrontId[] {
  return ids.filter((_, i) => !checks[i]);
}
```

- [ ] **Step 5: Link each case to the front it proves**

In `src/content/cases.ts`, add the import and the field to the interface:

```ts
import type { FrontId } from './fronts';
```

Add to `interface CaseStudy`, right after `kind`:

```ts
  /**
   * Qual das cinco frentes este caso prova. E o que costura a dobra 4 com a
   * dobra 3: o visitante acabou de ver o catalogo e aqui ve cada item provado.
   */
  front: FrontId;
```

Then add `front` to each of the three entries in `CASES`:

```ts
  {
    kind: 'resultado',
    front: 1,
    segment: 'Nexa Interiores',
```

```ts
  {
    kind: 'resultado',
    front: 2,
    segment: 'Libra Crédito',
```

```ts
  {
    kind: 'entrega',
    front: 4,
    segment: 'DecorColorir',
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run tests/fronts.test.ts
```

Expected: PASS, 9 testes.

- [ ] **Step 7: Run lint and full suite**

```bash
npm run lint && npm test
```

Expected: tsc sem erro; toda a suíte passa.

- [ ] **Step 8: Commit**

```bash
git add src/content/fronts.ts src/lib/fronts.ts src/content/cases.ts tests/fronts.test.ts
git commit -m "feat: catalogo das cinco frentes e vinculo caso-frente"
```

---

### Task 2: Renomear os pilares para frentes no contexto

Renomeação mecânica que precede a dobra 3. `operationalAIChecks` descrevia um checklist de pilares; o campo agora guarda as frentes marcadas e o nome precisa dizer isso. Sem essa etapa, a dobra 3 fica lendo um campo com nome de outra coisa.

**Files:**
- Modify: `src/context/VulnerabilityContext.tsx`
- Modify: `src/components/AIChatAgent.tsx:68`, `src/components/AIChatAgent.tsx:101-118`, `src/components/AIChatAgent.tsx:144-152`
- Modify: `src/components/OperationalAIChecklist.tsx`
- Test: `tests/vulnerability.test.ts`

**Interfaces:**
- Consumes: nada da Task 1.
- Produces: `VulnerabilityState.frontsChecked: boolean[]`, `VulnerabilityState.toggleFront(index: number): void`, `VulnerabilityInput.frontsChecked: boolean[]`. O nome antigo deixa de existir.

- [ ] **Step 1: Update the test first**

In `tests/vulnerability.test.ts`, replace every occurrence of `operationalAIChecks:` with `frontsChecked:`.

```bash
sed -i 's/operationalAIChecks:/frontsChecked:/g' tests/vulnerability.test.ts
grep -c "frontsChecked:" tests/vulnerability.test.ts
```

Expected: contagem maior que zero, e nenhum `operationalAIChecks` restante.

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/vulnerability.test.ts
```

Expected: FAIL — o objeto passado para `calculateVulnerabilityIndex` não tem mais a propriedade que a função lê, então o índice não desconta os pilares e as asserções de valor quebram.

- [ ] **Step 3: Rename in the context**

In `src/context/VulnerabilityContext.tsx`, apply exactly these renames:

- `VulnerabilityState`: `operationalAIChecks: boolean[]` → `frontsChecked: boolean[]`
- `VulnerabilityState`: `toggleOperationalAICheck: (index: number) => void` → `toggleFront: (index: number) => void`
- `VulnerabilityInput`: `operationalAIChecks: boolean[]` → `frontsChecked: boolean[]`
- In `calculateVulnerabilityIndex`: `input.operationalAIChecks.filter(Boolean).length` → `input.frontsChecked.filter(Boolean).length`
- State hook: `const [operationalAIChecks, setOperationalAIChecks] = useState<boolean[]>(...)` → `const [frontsChecked, setFrontsChecked] = useState<boolean[]>(...)`
- Handler `toggleOperationalAICheck` → `toggleFront`, with `setOperationalAIChecks` → `setFrontsChecked` inside it
- `resetDiagnostic`: `setOperationalAIChecks([...])` → `setFrontsChecked([...])`
- `useMemo` dependency array and the object passed to `calculateVulnerabilityIndex`
- The provider `value={{ ... }}` object

Also update the comment block at the top of the file:

```ts
 *   frentes cobertas       5 x 12 = 60
```

- [ ] **Step 4: Update the two consumers**

In `src/components/AIChatAgent.tsx`:

```ts
  const { vulnerabilityIndex, hasNoWebsite, frontsChecked, websiteScore } = useVulnerability();
```

In `handoffUrl`:

```ts
    const marcados = frontsChecked.filter(Boolean).length;
```

```ts
      `Frentes cobertas: ${marcados} de 5`,
```

and its dependency array:

```ts
  }, [vulnerabilityIndex, hasNoWebsite, websiteScore, frontsChecked]);
```

In the `body: JSON.stringify({...})` of `send`:

```ts
            operationalPillars: frontsChecked.filter(Boolean).length,
```

becomes:

```ts
            frontsCovered: frontsChecked.filter(Boolean).length,
```

In `src/components/OperationalAIChecklist.tsx`, replace the destructuring of `operationalAIChecks` / `toggleOperationalAICheck` with `frontsChecked` / `toggleFront`, and every use of those two names in the component body.

```bash
grep -rn "operationalAIChecks\|toggleOperationalAICheck\|operationalPillars" src/ tests/
```

Expected: nenhuma linha.

- [ ] **Step 5: Run tests and lint**

```bash
npm run lint && npm test
```

Expected: tsc sem erro; toda a suíte passa, incluindo `vulnerability.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/context/VulnerabilityContext.tsx src/components/AIChatAgent.tsx src/components/OperationalAIChecklist.tsx tests/vulnerability.test.ts
git commit -m "refactor: pilares operacionais viram frentes no contexto"
```

---

### Task 3: A dobra 3 — FiveFronts

**Files:**
- Create: `src/components/FiveFronts.tsx`
- Delete: `src/components/OperationalAIChecklist.tsx`
- Modify: `src/pages/LandingPage.tsx` (import e uso)

**Interfaces:**
- Consumes: `FRONTS` (Task 1), `resolveFirstFront`, `countChecked` (Task 1), `frontsChecked`, `toggleFront` (Task 2).
- Produces: `default function FiveFronts({ onWantStrategy }: { onWantStrategy?: () => void })`.

- [ ] **Step 1: Create the component**

Create `src/components/FiveFronts.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Layers, ArrowRight } from 'lucide-react';
import { FRONTS } from '../content/fronts';
import { resolveFirstFront, countChecked } from '../lib/fronts';
import { useVulnerability } from '../context/VulnerabilityContext';
import { track } from '../lib/analytics';

/**
 * Dobra 3 — o catalogo.
 *
 * Substitui o antigo checklist de pilares. A mecanica de marcar continua, o
 * conteudo passa a declarar o que a RIA vende. A frente 1 chega pre-resolvida
 * pelo diagnostico da dobra 2: e a mesma coisa que aquela dobra mediu, e deixar
 * o visitante remarcar do zero era perder a costura entre as duas.
 */
export default function FiveFronts({ onWantStrategy }: { onWantStrategy?: () => void }) {
  const { frontsChecked, toggleFront, hasNoWebsite, websiteScore } = useVulnerability();

  /**
   * A pre-resolucao roda uma vez por veredito do diagnostico. Sem a trava, todo
   * render reescreveria a marcacao e o visitante nao conseguiria discordar do
   * proprio diagnostico — clicar na frente 1 nao teria efeito.
   */
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const verdict = resolveFirstFront({ hasNoWebsite, websiteScore });
    if (verdict === null) return;
    const key = String(verdict);
    if (applied.current === key) return;
    applied.current = key;
    if (frontsChecked[0] !== verdict) toggleFront(0);
  }, [hasNoWebsite, websiteScore, frontsChecked, toggleFront]);

  const marcadas = countChecked(frontsChecked);
  const faltam = FRONTS.length - marcadas;
  const primeiraVazia = resolveFirstFront({ hasNoWebsite, websiteScore }) === false;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col justify-center pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Layers size={14} className="text-cyan-700" />
          <span className="text-cyan-800 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
            As cinco frentes
          </span>
        </div>
        <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-3">
          É aqui que a IA entra <span className="italic font-normal text-slate-500">na sua operação.</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Cinco frentes, e é isso que eu faço. Marque as que a sua empresa já cobre — as que sobrarem
          são a pauta da sua sessão.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-4xl mx-auto w-full">
        {FRONTS.map((front, i) => {
          const isChecked = frontsChecked[i];
          const destacada = i === 0 && primeiraVazia && !isChecked;
          return (
            <motion.button
              key={front.id}
              type="button"
              onClick={() => {
                toggleFront(i);
                track('front_toggle', { id: front.id, checked: !isChecked });
              }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={isChecked}
              className={`text-left flex gap-3.5 p-4 rounded-2xl border transition-colors ${
                isChecked
                  ? 'bg-emerald-50/90 border-emerald-300'
                  : destacada
                    ? 'bg-red-50/90 border-red-300'
                    : 'bg-white/90 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                  isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}
              >
                {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Frente {front.id}
                </span>
                <span
                  className={`block text-xs md:text-sm font-bold leading-snug mb-1 ${
                    isChecked ? 'text-emerald-950' : 'text-slate-900'
                  }`}
                >
                  {front.label}
                </span>
                <span className="block text-[11px] md:text-xs text-slate-600 leading-snug">
                  {front.promise}
                </span>
                {destacada && (
                  <span className="block mt-2 text-[11px] font-bold text-red-800 leading-snug">
                    {hasNoWebsite
                      ? 'Você acabou de dizer que ainda não tem site. Esta é a primeira.'
                      : `Seu site tirou ${websiteScore}/100 no diagnóstico. Esta é a primeira.`}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center mt-6 md:mt-8">
        <p className="text-sm md:text-base text-slate-800 font-semibold mb-4">
          Você cobre <span className="font-serif text-lg md:text-2xl">{marcadas}</span> de 5.
          {faltam > 0 && (
            <>
              {' '}As {faltam} que faltam são a pauta da sua sessão.
            </>
          )}
        </p>
        <button
          onClick={() => { track('cta_click', { location: 'five_fronts' }); onWantStrategy?.(); }}
          className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg"
        >
          Montar minha pauta <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Swap it into the page and delete the old file**

In `src/pages/LandingPage.tsx`, replace the import:

```tsx
import OperationalAIChecklist from '../components/OperationalAIChecklist';
```

with:

```tsx
import FiveFronts from '../components/FiveFronts';
```

and in `chapterContent`:

```tsx
    <OperationalAIChecklist onWantStrategy={goToCta} />,
```

with:

```tsx
    <FiveFronts onWantStrategy={goToCta} />,
```

Then:

```bash
git rm src/components/OperationalAIChecklist.tsx
```

- [ ] **Step 3: Verify nothing still references the old component**

```bash
grep -rn "OperationalAIChecklist" src/ tests/ index.html
```

Expected: nenhuma linha.

- [ ] **Step 4: Run lint and tests**

```bash
npm run lint && npm test
```

Expected: tsc sem erro; suíte passa.

- [ ] **Step 5: Commit**

```bash
git add -A src/components src/pages/LandingPage.tsx
git commit -m "feat: dobra 3 vira o catalogo das cinco frentes"
```

---

### Task 4: Lógica da qualificação

**Files:**
- Create: `src/lib/qualification.ts`
- Test: `tests/qualification.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `QUALIFICATION_STEPS: QualificationStep[]` (cinco, na ordem)
  - `type QualificationField = 'company' | 'email' | 'phone' | 'revenue' | 'aiBudget'`
  - `interface Qualification { company: string; email: string; phone: string; revenue: string; aiBudget: string }`
  - `validateField(field: QualificationField, value: string): string | null` — devolve mensagem de erro ou `null`
  - `isComplete(partial: Partial<Qualification>): partial is Qualification`
  - `buildQualificationPayload(input): QualificationPayload`

- [ ] **Step 1: Write the failing test**

Create `tests/qualification.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  QUALIFICATION_STEPS,
  validateField,
  isComplete,
  buildQualificationPayload,
} from '../src/lib/qualification';

describe('QUALIFICATION_STEPS: cinco passos, na ordem do spec', () => {
  it('QUAL-01: sao cinco passos na ordem empresa, email, telefone, faturamento, budget', () => {
    expect(QUALIFICATION_STEPS.map((s) => s.field)).toEqual([
      'company',
      'email',
      'phone',
      'revenue',
      'aiBudget',
    ]);
  });

  it('QUAL-02: faturamento e budget sao faixas, os outros sao texto livre', () => {
    const byField = Object.fromEntries(QUALIFICATION_STEPS.map((s) => [s.field, s]));
    expect(byField.revenue.options).toBeDefined();
    expect(byField.aiBudget.options).toBeDefined();
    expect(byField.company.options).toBeUndefined();
    expect(byField.email.options).toBeUndefined();
    expect(byField.phone.options).toBeUndefined();
  });

  it('QUAL-03: todo passo tem a pergunta que o agente faz', () => {
    for (const s of QUALIFICATION_STEPS) {
      expect(s.prompt.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('validateField', () => {
  it('QUAL-04: empresa vazia ou de uma letra nao passa', () => {
    expect(validateField('company', '')).not.toBeNull();
    expect(validateField('company', ' ')).not.toBeNull();
    expect(validateField('company', 'A')).not.toBeNull();
    expect(validateField('company', 'Nexa Interiores')).toBeNull();
  });

  it('QUAL-05: email sem arroba ou sem dominio nao passa', () => {
    expect(validateField('email', 'raul')).not.toBeNull();
    expect(validateField('email', 'raul@')).not.toBeNull();
    expect(validateField('email', 'raul@gmail')).not.toBeNull();
    expect(validateField('email', 'raul@gmail.com')).toBeNull();
  });

  it('QUAL-06: telefone aceita 10 ou 11 digitos e ignora mascara', () => {
    expect(validateField('phone', '(16) 99787-9837')).toBeNull();
    expect(validateField('phone', '1699787983')).toBeNull();
    expect(validateField('phone', '169978')).not.toBeNull();
    expect(validateField('phone', '169978798370000')).not.toBeNull();
  });

  it('QUAL-07: faixas so aceitam valor da lista', () => {
    expect(validateField('revenue', 'inventado')).not.toBeNull();
    expect(validateField('revenue', 'ate-100k')).toBeNull();
    expect(validateField('aiBudget', 'inventado')).not.toBeNull();
    expect(validateField('aiBudget', 'nao-defini')).toBeNull();
  });
});

describe('isComplete', () => {
  it('QUAL-08: so e completo com os cinco campos validos', () => {
    expect(isComplete({ company: 'Nexa', email: 'a@b.com' })).toBe(false);
    expect(
      isComplete({
        company: 'Nexa',
        email: 'a@b.com',
        phone: '16997879837',
        revenue: 'ate-100k',
        aiBudget: 'nao-defini',
      })
    ).toBe(true);
  });
});

describe('buildQualificationPayload', () => {
  const qualification = {
    company: 'Nexa Interiores',
    email: 'contato@nexa.com.br',
    phone: '(16) 99787-9837',
    revenue: '100k-500k',
    aiBudget: '1k-5k',
  };

  it('QUAL-09: leva os cinco campos mais o contexto acumulado na pagina', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      vulnerabilityIndex: 72,
      hasNoWebsite: false,
      websiteScore: 41,
      frontsChecked: [false, true, false, false, false],
    });

    expect(payload.action).toBe('qualification');
    expect(payload.sessionId).toBe('sess-1');
    expect(payload.qualification.company).toBe('Nexa Interiores');
    expect(payload.context.vulnerabilityIndex).toBe(72);
    expect(payload.context.websiteScore).toBe(41);
    expect(payload.context.frontsCovered).toBe(1);
    expect(payload.context.frontsMissing).toEqual([1, 3, 4, 5]);
  });

  it('QUAL-10: o telefone sai so com digitos, pronto para discar', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      vulnerabilityIndex: 72,
      hasNoWebsite: false,
      websiteScore: null,
      frontsChecked: [false, false, false, false, false],
    });
    expect(payload.qualification.phone).toBe('16997879837');
  });

  it('QUAL-11: sem site, o contexto diz isso em vez de mandar uma nota nula', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      vulnerabilityIndex: 101,
      hasNoWebsite: true,
      websiteScore: null,
      frontsChecked: [false, false, false, false, false],
    });
    expect(payload.context.hasNoWebsite).toBe(true);
    expect(payload.context.websiteScore).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/qualification.test.ts
```

Expected: FAIL — `Failed to resolve import "../src/lib/qualification"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/qualification.ts`:

```ts
import type { FrontId } from '../content/fronts';

/**
 * Qualificacao previa da sessao estrategica.
 *
 * Os cinco campos sao capturados por input controlado, nunca extraidos do texto
 * livre pelo LLM. O agente conversa; o dado estruturado entra por aqui. Modelo
 * errando telefone ou faturamento e exatamente o dado que nao pode chegar sujo
 * — e quem paga a conta e o Raul, ligando para um numero que nao existe.
 */

export type QualificationField = 'company' | 'email' | 'phone' | 'revenue' | 'aiBudget';

export interface Qualification {
  company: string;
  email: string;
  phone: string;
  revenue: string;
  aiBudget: string;
}

export interface QualificationOption {
  value: string;
  label: string;
}

export interface QualificationStep {
  field: QualificationField;
  /** A pergunta como o agente faz. */
  prompt: string;
  /** Placeholder do campo livre. Ausente quando o passo e de faixa. */
  placeholder?: string;
  /** Presente so nos passos de faixa. */
  options?: QualificationOption[];
}

export const REVENUE_OPTIONS: QualificationOption[] = [
  { value: 'ate-100k', label: 'Até R$ 100 mil/mês' },
  { value: '100k-500k', label: 'R$ 100 mil a R$ 500 mil/mês' },
  { value: '500k-1m', label: 'R$ 500 mil a R$ 1 milhão/mês' },
  { value: 'acima-1m', label: 'Acima de R$ 1 milhão/mês' },
];

export const AI_BUDGET_OPTIONS: QualificationOption[] = [
  { value: 'nao-defini', label: 'Ainda não defini' },
  { value: 'ate-1k', label: 'Até R$ 1.000/mês' },
  { value: '1k-5k', label: 'R$ 1.000 a R$ 5.000/mês' },
  { value: 'acima-5k', label: 'Acima de R$ 5.000/mês' },
];

export const QUALIFICATION_STEPS: QualificationStep[] = [
  {
    field: 'company',
    prompt: 'Perfeito. Para eu preparar a sessão: qual o nome da sua empresa?',
    placeholder: 'Nome da empresa',
  },
  {
    field: 'email',
    prompt: 'Para onde eu mando a confirmação e o mapa dos gargalos?',
    placeholder: 'seu@email.com.br',
  },
  {
    field: 'phone',
    prompt: 'E um telefone, caso a chamada caia.',
    placeholder: '(00) 00000-0000',
  },
  {
    field: 'revenue',
    prompt: 'Qual a faixa de faturamento mensal da empresa hoje?',
    options: REVENUE_OPTIONS,
  },
  {
    field: 'aiBudget',
    prompt: 'E quanto vocês já reservam por mês para inteligência artificial?',
    options: AI_BUDGET_OPTIONS,
  },
];

/** Digitos puros. Mascara e coisa de tela, nao de dado. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateField(field: QualificationField, value: string): string | null {
  const trimmed = value.trim();

  switch (field) {
    case 'company':
      return trimmed.length >= 2 ? null : 'Escreva o nome da empresa.';

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) ? null : 'Confira o e-mail.';

    case 'phone': {
      const digits = onlyDigits(trimmed);
      return digits.length === 10 || digits.length === 11
        ? null
        : 'Telefone com DDD, 10 ou 11 dígitos.';
    }

    case 'revenue':
      return REVENUE_OPTIONS.some((o) => o.value === trimmed) ? null : 'Escolha uma faixa.';

    case 'aiBudget':
      return AI_BUDGET_OPTIONS.some((o) => o.value === trimmed) ? null : 'Escolha uma faixa.';
  }
}

export function isComplete(partial: Partial<Qualification>): partial is Qualification {
  return QUALIFICATION_STEPS.every((step) => {
    const value = partial[step.field];
    return typeof value === 'string' && validateField(step.field, value) === null;
  });
}

export interface QualificationPayloadInput {
  sessionId: string;
  qualification: Qualification;
  vulnerabilityIndex: number | null;
  hasNoWebsite: boolean;
  websiteScore: number | null;
  frontsChecked: boolean[];
}

export interface QualificationPayload {
  action: 'qualification';
  sessionId: string;
  qualification: Qualification;
  context: {
    vulnerabilityIndex: number | null;
    hasNoWebsite: boolean;
    websiteScore: number | null;
    frontsCovered: number;
    frontsMissing: FrontId[];
  };
}

export function buildQualificationPayload(
  input: QualificationPayloadInput
): QualificationPayload {
  const missing = input.frontsChecked
    .map((checked, i) => (checked ? null : ((i + 1) as FrontId)))
    .filter((id): id is FrontId => id !== null);

  return {
    action: 'qualification',
    sessionId: input.sessionId,
    qualification: {
      ...input.qualification,
      phone: onlyDigits(input.qualification.phone),
    },
    context: {
      vulnerabilityIndex: input.vulnerabilityIndex,
      hasNoWebsite: input.hasNoWebsite,
      websiteScore: input.websiteScore,
      frontsCovered: input.frontsChecked.filter(Boolean).length,
      frontsMissing: missing,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/qualification.test.ts
```

Expected: PASS, 11 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/qualification.ts tests/qualification.test.ts
git commit -m "feat: logica da qualificacao em cinco campos"
```

---

### Task 5: Lógica e configuração da agenda

**Files:**
- Create: `src/lib/booking.ts`
- Modify: `src/config.ts`
- Modify: `.env.example`
- Test: `tests/booking.test.ts`
- Test: `tests/config.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `buildBookingUrl(base: string, prefill: BookingPrefill): string` com `BookingPrefill = { name: string; email: string; notes?: string }`; `config.bookingUrl: string`.

- [ ] **Step 1: Write the failing tests**

Create `tests/booking.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildBookingUrl } from '../src/lib/booking';

const BASE = 'https://cal.com/raul-vieira/30min';

describe('buildBookingUrl', () => {
  it('BOOK-01: pre-preenche nome e email na agenda', () => {
    const url = new URL(buildBookingUrl(BASE, { name: 'Nexa Interiores', email: 'a@b.com' }));
    expect(url.searchParams.get('name')).toBe('Nexa Interiores');
    expect(url.searchParams.get('email')).toBe('a@b.com');
  });

  it('BOOK-02: marca o modo embed, para a agenda nao renderizar a pagina inteira', () => {
    const url = new URL(buildBookingUrl(BASE, { name: 'Nexa', email: 'a@b.com' }));
    expect(url.searchParams.get('embed')).toBe('true');
  });

  it('BOOK-03: leva as notas quando existem, e omite quando nao', () => {
    const comNotas = new URL(
      buildBookingUrl(BASE, { name: 'Nexa', email: 'a@b.com', notes: 'Frentes 1, 3 e 5' })
    );
    expect(comNotas.searchParams.get('notes')).toBe('Frentes 1, 3 e 5');

    const semNotas = new URL(buildBookingUrl(BASE, { name: 'Nexa', email: 'a@b.com' }));
    expect(semNotas.searchParams.has('notes')).toBe(false);
  });

  it('BOOK-04: preserva query que ja exista na base', () => {
    const url = new URL(
      buildBookingUrl(`${BASE}?theme=light`, { name: 'Nexa', email: 'a@b.com' })
    );
    expect(url.searchParams.get('theme')).toBe('light');
    expect(url.searchParams.get('name')).toBe('Nexa');
  });

  it('BOOK-05: base vazia devolve string vazia, sem estourar', () => {
    expect(buildBookingUrl('', { name: 'Nexa', email: 'a@b.com' })).toBe('');
  });
});
```

Then add this block to the end of `tests/config.test.ts`, inside the existing `describe`:

```ts
  it('CONFIG-03: a URL da agenda so aparece em config.ts', () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => f !== ALLOWED_WEBHOOK)
      .filter((f) => /https?:\/\/[^\s'"]*cal\.com/i.test(readFileSync(f, 'utf-8')));
    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/booking.test.ts tests/config.test.ts
```

Expected: `booking.test.ts` FAIL com `Failed to resolve import "../src/lib/booking"`; `config.test.ts` PASS (nenhuma URL cal.com existe ainda — o teste é uma trava para o futuro).

- [ ] **Step 3: Write the implementation**

Create `src/lib/booking.ts`:

```ts
/**
 * Agenda da sessao estrategica.
 *
 * O provedor vive atras desta funcao e da URL em config.ts. Trocar Cal.com por
 * Google Appointment Schedule toca este arquivo e o .env — nada mais. O embed e
 * um iframe puro de proposito: uma dependencia de npm para montar um iframe
 * seria peso sem retorno.
 */

export interface BookingPrefill {
  name: string;
  email: string;
  /** Contexto que o Raul le antes da chamada — ex.: as frentes descobertas. */
  notes?: string;
}

export function buildBookingUrl(base: string, prefill: BookingPrefill): string {
  if (!base) return '';

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return '';
  }

  url.searchParams.set('embed', 'true');
  url.searchParams.set('name', prefill.name);
  url.searchParams.set('email', prefill.email);
  if (prefill.notes) url.searchParams.set('notes', prefill.notes);

  return url.toString();
}
```

- [ ] **Step 4: Add the config entry**

In `src/config.ts`, add inside the `config` object, after `diagnosticWebhook`:

```ts
  bookingUrl: readEnv(import.meta.env.VITE_BOOKING_URL, 'VITE_BOOKING_URL'),
```

- [ ] **Step 5: Document the variable**

In `.env.example`, add under the `Obrigatorias` block:

```
# Agenda da sessao estrategica de 30 minutos (Cal.com).
# Ex.: https://cal.com/raul-vieira/30min
# Vazio = o agente cai no fallback de WhatsApp em vez de abrir a agenda.
VITE_BOOKING_URL="https://cal.com/exemplo/30min"
```

- [ ] **Step 6: Run tests and lint**

```bash
npm run lint && npm test
```

Expected: `booking.test.ts` PASS com 5 testes; suíte inteira passa.

- [ ] **Step 7: Commit**

```bash
git add src/lib/booking.ts src/config.ts .env.example tests/booking.test.ts tests/config.test.ts
git commit -m "feat: url da agenda com pre-preenchimento e trava de config"
```

---

### Task 6: QualificationFlow

**Files:**
- Create: `src/components/QualificationFlow.tsx`

**Interfaces:**
- Consumes: `QUALIFICATION_STEPS`, `validateField`, `Qualification` (Task 4).
- Produces: `default function QualificationFlow({ onComplete }: { onComplete: (q: Qualification) => void })`.

- [ ] **Step 1: Create the component**

Create `src/components/QualificationFlow.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  QUALIFICATION_STEPS,
  validateField,
  type Qualification,
} from '../lib/qualification';
import { track } from '../lib/analytics';

/**
 * Os cinco passos, dentro da bolha do chat.
 *
 * Este componente nao conhece o agente: recebe um callback e devolve os cinco
 * campos. Um passo por vez porque cinco campos de uma vez dentro de um chat
 * viram formulario — e formulario dentro de conversa quebra as duas coisas.
 */
export default function QualificationFlow({
  onComplete,
}: {
  onComplete: (q: Qualification) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Qualification>>({});
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const step = QUALIFICATION_STEPS[index];
  const isLast = index === QUALIFICATION_STEPS.length - 1;

  const commit = (value: string) => {
    const problem = validateField(step.field, value);
    if (problem) {
      setError(problem);
      return;
    }

    const updated = { ...answers, [step.field]: value.trim() };
    setAnswers(updated);
    setError(null);
    setDraft('');
    track('qualification_step', { field: step.field, index });

    if (isLast) {
      track('qualification_completed', {});
      onComplete(updated as Qualification);
      return;
    }
    setIndex(index + 1);
  };

  const back = () => {
    if (index === 0) return;
    const previous = QUALIFICATION_STEPS[index - 1];
    setDraft(answers[previous.field] ?? '');
    setError(null);
    setIndex(index - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-4 bg-white rounded-xl border border-accent/30 shadow-md text-left"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
          {index + 1} de {QUALIFICATION_STEPS.length}
        </span>
        {index > 0 && (
          <button
            type="button"
            onClick={back}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft size={11} /> Voltar
          </button>
        )}
      </div>

      <p className="text-sm text-slate-900 font-semibold leading-snug mb-3">{step.prompt}</p>

      {step.options ? (
        <div className="flex flex-col gap-2">
          {step.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => commit(option.value)}
              className="text-left px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-accent hover:bg-accent/5 active:scale-[0.99] transition-all text-xs font-semibold text-slate-800"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit(draft);
          }}
          className="flex gap-2"
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(null); }}
            placeholder={step.placeholder}
            inputMode={step.field === 'phone' ? 'tel' : step.field === 'email' ? 'email' : 'text'}
            aria-label={step.prompt}
            aria-invalid={error !== null}
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            aria-label="Continuar"
            className="px-4 rounded-xl bg-slate-900 text-white hover:bg-accent active:scale-95 transition-all shrink-0"
          >
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] font-semibold text-red-700">
          {error}
        </p>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run lint
```

Expected: nenhum erro de tipo. O componente ainda não é usado por ninguém — isso é esperado; a Task 8 o monta.

- [ ] **Step 3: Commit**

```bash
git add src/components/QualificationFlow.tsx
git commit -m "feat: fluxo de qualificacao inline, um passo por vez"
```

---

### Task 7: BookingEmbed

**Files:**
- Create: `src/components/BookingEmbed.tsx`

**Interfaces:**
- Consumes: `buildBookingUrl` (Task 5), `config.bookingUrl` (Task 5), `whatsappWithMessage` (`src/constants/links.ts`).
- Produces: `default function BookingEmbed({ name, email, notes, fallbackMessage }: BookingEmbedProps)`.

- [ ] **Step 1: Create the component**

Create `src/components/BookingEmbed.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { config } from '../config';
import { buildBookingUrl } from '../lib/booking';
import { whatsappWithMessage } from '../constants/links';
import { track } from '../lib/analytics';

interface BookingEmbedProps {
  name: string;
  email: string;
  /** Contexto que o Raul le antes da chamada. */
  notes?: string;
  /** Mensagem do WhatsApp se a agenda nao abrir. Carrega os cinco campos. */
  fallbackMessage: string;
}

/**
 * A agenda, embutida.
 *
 * Este componente nao conhece a qualificacao: recebe nome, email e um texto de
 * contexto. Se a URL nao estiver configurada ou o iframe falhar, o visitante
 * nao pode ficar sem destino — cai no WhatsApp levando tudo que respondeu.
 */
export default function BookingEmbed({ name, email, notes, fallbackMessage }: BookingEmbedProps) {
  const [failed, setFailed] = useState(false);
  const url = buildBookingUrl(config.bookingUrl, { name, email, notes });

  if (!url || failed) {
    return (
      <div className="mt-3 p-4 bg-white rounded-xl border border-accent/30 shadow-md text-left">
        <p className="text-sm text-slate-900 font-semibold leading-snug mb-3">
          Tenho tudo que preciso. Vamos fechar o horário direto comigo.
        </p>
        <a
          href={whatsappWithMessage(fallbackMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click', { location: 'booking_fallback' })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-colors"
        >
          <MessageCircle size={14} /> Marcar pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-white rounded-xl border border-accent/30 shadow-md overflow-hidden text-left"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <CalendarCheck size={14} className="text-accent" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">
          Escolha o horário — 30 minutos
        </span>
      </div>
      <iframe
        src={url}
        title="Agenda da sessão estratégica de 30 minutos"
        onError={() => setFailed(true)}
        className="w-full h-[420px] border-0"
      />
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify it compiles and respects the config contract**

```bash
npm run lint && npx vitest run tests/config.test.ts
```

Expected: tsc sem erro; CONFIG-03 passa (a URL da agenda está em `config.ts`, não aqui).

- [ ] **Step 3: Commit**

```bash
git add src/components/BookingEmbed.tsx
git commit -m "feat: agenda embutida com fallback de whatsapp"
```

---

### Task 8: O agente em três estágios

**Files:**
- Modify: `src/components/AIChatAgent.tsx`

**Interfaces:**
- Consumes: `QualificationFlow` (Task 6), `BookingEmbed` (Task 7), `buildQualificationPayload`, `Qualification` (Task 4), `FRONTS` (Task 1).
- Produces: `AIChatAgentProps` passa a ser `{ webhookUrl?: string }` — o antigo `onComplete` sai, porque o agente deixa de terminar em WhatsApp e passa a terminar em agenda.

- [ ] **Step 1: Add the stage state and the imports**

In `src/components/AIChatAgent.tsx`, add to the imports:

```tsx
import QualificationFlow from './QualificationFlow';
import BookingEmbed from './BookingEmbed';
import { buildQualificationPayload, type Qualification } from '../lib/qualification';
import { FRONTS } from '../content/fronts';
import { CalendarCheck } from 'lucide-react';
```

Replace the props interface:

```tsx
interface AIChatAgentProps {
  webhookUrl?: string;
}
```

and the signature:

```tsx
export default function AIChatAgent({ webhookUrl = config.chatWebhook }: AIChatAgentProps) {
```

Add the stage state next to the existing `useState` calls:

```tsx
  /**
   * Tres estagios. A transicao para 'qualifying' e sempre por clique do
   * visitante — deixar o modelo decidir quando pedir telefone e faturamento
   * transformaria o gatilho da conversao em algo que muda de humor a cada
   * resposta do LLM.
   */
  const [stage, setStage] = useState<'chat' | 'qualifying' | 'booking'>('chat');
  const [qualification, setQualification] = useState<Qualification | null>(null);
```

- [ ] **Step 2: Send the qualification payload and open the agenda**

Add this handler inside the component, after `send`:

```tsx
  const handleQualified = async (data: Qualification) => {
    setQualification(data);
    setStage('booking');

    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildQualificationPayload({
            sessionId,
            qualification: data,
            vulnerabilityIndex,
            hasNoWebsite,
            websiteScore,
            frontsChecked,
          })
        ),
      });
    } catch {
      // A agenda ja esta na tela. Falhar o registro nao pode custar o
      // agendamento — o lead chega pelo proprio Cal.com de qualquer forma.
    }
  };
```

- [ ] **Step 3: Build the fallback message and the agenda notes**

Add these two `useMemo` blocks after `handoffUrl`:

```tsx
  /** As frentes que sobraram: a pauta que o Raul le antes da chamada. */
  const pauta = useMemo(
    () => FRONTS.filter((_, i) => !frontsChecked[i]).map((f) => f.tag).join(', '),
    [frontsChecked]
  );

  const bookingFallbackMessage = useMemo(() => {
    if (!qualification) return '';
    return [
      'Olá Raul, completei a qualificação no site e quero marcar a sessão de 30 minutos.',
      '',
      `Empresa: ${qualification.company}`,
      `E-mail: ${qualification.email}`,
      `Telefone: ${qualification.phone}`,
      `Faturamento: ${qualification.revenue}`,
      `Budget de IA: ${qualification.aiBudget}`,
      '',
      pauta ? `Frentes descobertas: ${pauta}` : 'Frentes descobertas: nenhuma',
    ].join('\n');
  }, [qualification, pauta]);
```

- [ ] **Step 4: Render the stage below the message list**

Immediately after the `</AnimatePresence>` that closes the message list, and before the typing indicator, add:

```tsx
        {stage === 'chat' && messages.length > 1 && !isTyping && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setStage('qualifying');
                track('qualification_started', { vulnerability_index: vulnerabilityIndex });
              }}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-accent active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
            >
              <CalendarCheck size={14} /> Agendar minha sessão de 30 min
            </button>
          </div>
        )}

        {stage === 'qualifying' && <QualificationFlow onComplete={handleQualified} />}

        {stage === 'booking' && qualification && (
          <BookingEmbed
            name={qualification.company}
            email={qualification.email}
            notes={pauta ? `Frentes descobertas: ${pauta}` : undefined}
            fallbackMessage={bookingFallbackMessage}
          />
        )}
```

- [ ] **Step 5: Rewire the ROI card button**

The ROI card inside the message list calls the prop that Task 8 removes. Find this block near the end of the message rendering:

```tsx
                      <button
                        onClick={() => {
                          track('cta_click', { location: 'agent_roi_card' });
                          onComplete(msg.data!);
                        }}
```

and replace the handler so the card feeds the same funnel as the persistent button:

```tsx
                      <button
                        onClick={() => {
                          track('cta_click', { location: 'agent_roi_card' });
                          setStage('qualifying');
                          track('qualification_started', { source: 'roi_card' });
                        }}
```

Also change its label from `Ver detalhes` to:

```tsx
                        Agendar minha sessão <ArrowRight size={12} />
```

Without this step the build fails: `onComplete` no longer exists.

- [ ] **Step 6: Hide the composer once qualification starts**

The composer is not a form — it is the `<div className="p-4 bg-slate-50 border-t border-slate-200">` block that closes the component, holding the input, the send button and the WhatsApp footer line. Wrap that entire block so it only renders during the chat stage:

```tsx
      {stage === 'chat' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
```

and close it with `)}` immediately after that block's closing `</div>`. Two competing inputs on screen — the composer and the qualification field — is the bug this prevents.

- [ ] **Step 7: Remove the dead ROI handoff from the page**

In `src/pages/LandingPage.tsx`, delete the `handleFinalContact` callback entirely and drop `onFinalContact` from `SceneCTA`. Task 10 rewrites `SceneCTA`; this step only removes the prop so the build stays green.

```bash
grep -rn "onComplete\|handleFinalContact\|onFinalContact" src/pages/LandingPage.tsx src/components/AIChatAgent.tsx
```

Expected: nenhuma linha (o `onComplete` de `QualificationFlow` é interno ao agente e não aparece aqui).

- [ ] **Step 8: Run lint and tests**

```bash
npm run lint && npm test
```

Expected: tsc sem erro; suíte passa.

- [ ] **Step 9: Commit**

```bash
git add src/components/AIChatAgent.tsx src/pages/LandingPage.tsx
git commit -m "feat: agente conduz qualificacao e abre a agenda"
```

---

### Task 9: A dobra 4 — CredibilitySection

**Files:**
- Create: `src/components/CredibilitySection.tsx`
- Delete: `src/components/ProofSection.tsx`, `src/components/ConsultantSection.tsx`
- Modify: `src/content/consultant.ts`
- Modify: `index.html:63`
- Modify: `src/pages/LandingPage.tsx`

**Interfaces:**
- Consumes: `CASES` com `front` (Task 1), `FRONTS` (Task 1), `CONSULTANT`, `PHOTO_SRC`, `PHOTO_ALT`.
- Produces: `default function CredibilitySection({ onWantStrategy }: { onWantStrategy?: () => void })`.

- [ ] **Step 1: Update the consultant data**

Replace the `CONSULTANT` export in `src/content/consultant.ts`:

```ts
export const CONSULTANT = {
  name: 'Raul Vieira',
  role: 'Consultor de Inteligência Artificial',
  tagline: 'Engenharia de produção aplicada a IA.',
  bio: 'Engenheiro de produção formado pela UFSCar. A formação importa aqui por um motivo prático: antes de escolher modelo, alguém precisa saber onde está o gargalo. É o mesmo ofício de sempre — medir o processo, achar o ponto que trava, atacar o de maior custo por hora. A IA só mudou a ferramenta.',
  credentials: [
    'Engenheiro de Produção — Universidade Federal de São Carlos (UFSCar)',
    'Agentes de IA em produção qualificando leads em escala',
    'Automação de processos ponta a ponta com n8n',
    'Diagnóstico e otimização para busca generativa (GEO)',
  ],
};
```

Also update `PHOTO_ALT` to match the new name:

```ts
export const PHOTO_ALT = 'Ilustracao de marca da RIA: retrato estilizado de Raul Vieira';
```

- [ ] **Step 2: Update the structured data**

In `index.html`, inside the `LocalBusiness` JSON-LD, change:

```json
        "name": "Raul Pedro",
```

to:

```json
        "name": "Raul Vieira",
```

and add `"alumniOf"` right after `"jobTitle"`:

```json
        "alumniOf": {
          "@type": "CollegeOrUniversity",
          "name": "Universidade Federal de São Carlos"
        },
```

- [ ] **Step 3: Create the merged section**

Create `src/components/CredibilitySection.tsx`:

```tsx
import { motion } from 'motion/react';
import { LineChart, Ruler, Target, Timer, Hammer, Check, ArrowUpRight, Award } from 'lucide-react';
import { CASES } from '../content/cases';
import { FRONTS } from '../content/fronts';
import { CONSULTANT, PHOTO_SRC, PHOTO_ALT } from '../content/consultant';
import { track } from '../lib/analytics';

/**
 * Dobra 4 — a prova e quem executa, na mesma dobra.
 *
 * Estavam separadas em ProofSection e ConsultantSection. Para consultor solo
 * sao a mesma prova: nao adianta o caso funcionar se o visitante nao sabe quem
 * fez, nem adianta a credencial sem caso. Cada caso entra etiquetado com a
 * frente que prova — e essa etiqueta que costura esta dobra com a dobra 3.
 */

const METHOD = [
  { icon: Ruler, title: 'Medimos antes', body: 'Horas e volume da rotina, por 30 dias, no seu sistema.' },
  { icon: Target, title: 'Um gargalo por vez', body: 'A primeira entrega ataca o de maior custo por hora.' },
  { icon: Timer, title: 'Prazo na proposta', body: 'Não entrou em produção na data? A etapa não é cobrada.' },
  { icon: LineChart, title: 'Medimos depois', body: 'Mesmo indicador, mesma fonte. O número é seu.' },
];

const frontTag = (id: number) => FRONTS.find((f) => f.id === id)?.tag ?? '';

export default function CredibilitySection({ onWantStrategy }: { onWantStrategy?: () => void }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 flex flex-col justify-center pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-3">
          <LineChart size={14} className="text-accent" />
          <span className="text-accent-dark text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Já atravessei isso com outros
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 leading-tight reading-surface md:bg-transparent md:backdrop-blur-none inline-block px-4 py-2">
          Cada frente, <span className="italic font-normal text-slate-500">com um caso atrás.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8">
        {CASES.map((c, i) => (
          <motion.article
            key={c.segment}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/95 premium-glass rounded-2xl border border-slate-200 shadow-lg p-5 flex flex-col gap-2 text-left"
          >
            <div className="flex items-center gap-1.5">
              {c.kind === 'entrega' ? (
                <Hammer size={12} className="text-slate-400 shrink-0" />
              ) : (
                <LineChart size={12} className="text-accent shrink-0" />
              )}
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold">
                {c.segment}
              </span>
            </div>

            <span className="self-start px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-black uppercase tracking-widest text-accent-dark">
              Prova a frente {c.front} · {frontTag(c.front)}
            </span>

            <p className="text-lg md:text-xl font-serif text-slate-900 leading-tight">{c.headline}</p>

            <dl className="text-xs text-slate-600 leading-relaxed flex flex-col gap-1.5 mt-1">
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Antes</dt>
                <dd>{c.before}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">O que entrou</dt>
                <dd>{c.intervention}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Prazo</dt>
                <dd>{c.timeframe}</dd>
              </div>
            </dl>

            {c.measurement && (
              <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 mt-auto">
                {c.measurement}
              </p>
            )}
          </motion.article>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-center text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-slate-700 mb-5">
          E o número dá para auditar
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METHOD.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="bg-white/90 rounded-2xl border border-slate-200 p-4 flex flex-col gap-1.5 text-left"
              >
                <Icon size={14} className="text-accent" />
                <h4 className="text-xs md:text-sm font-bold text-slate-900 font-serif">{m.title}</h4>
                <p className="text-[11px] md:text-xs text-slate-600 leading-snug">{m.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/95 premium-glass rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
          <div className="mx-auto md:mx-0">
            {PHOTO_SRC ? (
              <img
                src={PHOTO_SRC}
                alt={PHOTO_ALT}
                loading="lazy"
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border border-slate-200 shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <span className="font-serif text-3xl text-slate-400">RV</span>
              </div>
            )}
          </div>

          <div className="flex flex-col text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mb-3 w-fit mx-auto md:mx-0">
              <Award size={12} className="text-accent" />
              <span className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                Quem executa
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-serif text-slate-900 mb-1 leading-tight">
              {CONSULTANT.name}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm italic mb-3">{CONSULTANT.role}</p>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4 max-w-xl mx-auto md:mx-0">
              {CONSULTANT.bio}
            </p>

            <ul className="flex flex-col gap-2 mb-5 text-left max-w-xl mx-auto md:mx-0">
              {CONSULTANT.credentials.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check size={14} className="text-accent shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="leading-snug">{c}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => { track('cta_click', { location: 'credibility' }); onWantStrategy?.(); }}
                className="px-6 py-3.5 w-full md:w-auto bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
              >
                Falar com o agente <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the tree still builds**

`ProofSection.tsx` and `ConsultantSection.tsx` stay on disk for now. They are removed in Task 10, after `LandingPage` stops importing them — deleting them here would break the build for no gain.

```bash
npm run lint && npm test
```

Expected: tsc sem erro; suíte passa. `CredibilitySection` ainda não é usado por ninguém; isso é esperado.

- [ ] **Step 5: Commit**

```bash
git add src/components/CredibilitySection.tsx src/content/consultant.ts index.html
git commit -m "feat: dobra 4 funde prova e consultor, com casos etiquetados por frente"
```

---

### Task 10: Seis dobras e o fechamento

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/components/OfferSection.tsx`
- Modify: `src/components/PotentialDiagnostic.tsx`

**Interfaces:**
- Consumes: `FiveFronts` (Task 3), `CredibilitySection` (Task 9), `AIChatAgent` sem props de callback (Task 8).
- Produces: página final com `CHAPTERS.length === 6` e `CTA_CHAPTER === 5`.

- [ ] **Step 1: Turn the offer card into a band**

Replace the JSX returned by `OfferSection` in `src/components/OfferSection.tsx` (keep the `TERMS` array and the imports exactly as they are):

```tsx
export default function OfferSection() {
  return (
    <div className="w-full bg-white/95 premium-glass rounded-2xl border border-slate-200 shadow-lg px-5 py-4 text-left">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TERMS.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="flex gap-2.5">
              <div className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg h-fit shrink-0">
                <Icon size={12} className="text-accent" />
              </div>
              <div className="min-w-0">
                <dt className="text-[9px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold mb-0.5">
                  {t.label}
                </dt>
                <dd>
                  <span className="block text-xs font-bold text-slate-900 leading-snug mb-0.5">
                    {t.value}
                  </span>
                  <span className="block text-[11px] text-slate-600 leading-snug">{t.detail}</span>
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
```

Also delete the now-unused `Check` from the lucide import on line 1, leaving:

```tsx
import { Clock, Wallet, CalendarCheck, ShieldCheck } from 'lucide-react';
```

and update the header comment's last paragraph to say the band is the visible offer above the agent.

- [ ] **Step 2: Point the diagnostic's exit at the fronts**

In `src/components/PotentialDiagnostic.tsx`, the component receives `onWantStrategy` and `onNoWebsite`. Both currently jump to the CTA chapter. Change the button label that today reads `Resolver com a RIA` to:

```tsx
              <span>Ver as cinco frentes</span>
```

`LandingPage` rewires where those callbacks point in Step 3 — the component itself stays agnostic.

- [ ] **Step 3: Rewrite the page to six chapters**

In `src/pages/LandingPage.tsx`:

Replace the imports of the removed components:

```tsx
import FiveFronts from '../components/FiveFronts';
import CredibilitySection from '../components/CredibilitySection';
```

removing the `ProofSection`, `ConsultantSection` and `OperationalAIChecklist` imports. Also remove the now-unused `whatsappWithMessage` import if nothing else in the file uses it.

Change the CTA constant:

```tsx
/** Capitulo que concentra a oferta e o agente. Todo CTA aponta para ca. */
const CTA_CHAPTER = 5;

/** Dobra do catalogo. O diagnostico entrega o visitante aqui, nao no fim. */
const FRONTS_CHAPTER = 3;
```

Replace `CHAPTERS`:

```tsx
// Seis dobras. A ordem e a espinha narrativa: ameaca -> validacao externa ->
// tensao pessoal (a nota do site) -> o caminho (o catalogo) -> confianca ->
// acao. O que quebrava antes era o degrau entre tensao e caminho: a pagina
// subia a tensao e respondia com metodologia de ROI.
const CHAPTERS = [
  { label: 'A ameaça silenciosa', title: 'RIA — A Ameaça Silenciosa' },
  { label: 'Vozes do mercado', title: 'RIA — Vozes do Mercado' },
  { label: 'Diagnóstico de saúde digital', title: 'RIA — Diagnóstico de Saúde Digital' },
  { label: 'As cinco frentes', title: 'RIA — As Cinco Frentes' },
  { label: 'Prova e quem executa', title: 'RIA — Prova e Quem Executa' },
  { label: 'O agente e a agenda', title: 'RIA — Agende sua Sessão' },
];
```

Add the navigation callback next to `goToCta`:

```tsx
  const goToFronts = useCallback(() => goToChapter(FRONTS_CHAPTER), [goToChapter]);
```

Replace `chapterContent`:

```tsx
  const chapterContent = useMemo(() => [
    <SceneHero onStartDiagnostic={goToCta} />,
    <SocialProofSection />,
    <PotentialDiagnostic onWantStrategy={goToFronts} onNoWebsite={goToFronts} />,
    <FiveFronts onWantStrategy={goToCta} />,
    <CredibilitySection onWantStrategy={goToCta} />,
    <SceneCTA />,
  ], [goToCta, goToFronts]);
```

Replace `SceneCTA` entirely:

```tsx
// ─── Capitulo 5: O AGENTE E A AGENDA ─────────────────────────────────────────
// Um caminho so. Antes eram tres saidas competindo — cartao de oferta, chat e
// FAB — e a conversao real era um link de WhatsApp com dados parciais. A oferta
// vira faixa de contexto acima do agente: informacao disponivel, sem disputar
// o clique.
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto">
      <div className="w-full mb-4 md:mb-5">
        <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-2 bg-white/80 rounded-2xl px-4 py-2 inline-block">
          Trinta minutos, <span className="italic font-normal text-slate-500">e você sai com um mapa.</span>
        </h2>
        <p className="text-slate-700 text-[13px] md:text-base max-w-xl mx-auto font-sans leading-relaxed">
          Conte ao agente o que sua empresa faz. Ele já sabe o que você respondeu até aqui, e marca
          a sessão comigo.
        </p>
      </div>

      <div className="w-full mb-4">
        <OfferSection />
      </div>

      <div className="w-full h-[78svh] lg:h-auto lg:min-h-[560px]">
        <AIChatAgent />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the whole thing builds and the suite is green**

```bash
npm run lint && npm test && npm run build
```

Expected: tsc sem erro; toda a suíte passa; build conclui.

- [ ] **Step 5: Remove the two absorbed components and verify no stale references remain**

Now that `LandingPage` no longer imports them:

```bash
git rm src/components/ProofSection.tsx src/components/ConsultantSection.tsx
grep -rn "ProofSection\|ConsultantSection\|OperationalAIChecklist\|operationalAIChecks" src/ tests/
```

Expected: nenhuma linha. Then re-run `npm run lint && npm test` to confirm the removal broke nothing.

- [ ] **Step 6: Verify in the browser**

Start the dev server and walk the page: six chapters scroll in order; the diagnostic's exit lands on the fronts; front 1 arrives empty and highlighted after a bad score; the agent shows the scheduling button after the first reply; the five steps advance one at a time; the agenda opens.

- [ ] **Step 7: Commit**

```bash
git add -u src/components src/pages/LandingPage.tsx src/components/OfferSection.tsx src/components/PotentialDiagnostic.tsx
git commit -m "feat: pagina passa a seis dobras com fechamento unico no agente"
```

---

## Self-Review

**Cobertura do spec:**

| Seção do spec | Task |
|---|---|
| 4.0 / 4.1 — dobras intactas | nenhuma (por desenho) |
| 4.2 — saída do diagnóstico aponta para as frentes | 10 |
| 4.3 — as cinco frentes, com pré-resolução da frente 1 | 1, 2, 3 |
| 4.4 — casos etiquetados, faixa "como medimos", consultor | 9 |
| 4.5 — agente em três estágios, faixa de oferta, payload | 4, 5, 6, 7, 8, 10 |
| 5 — tabela de componentes | 1–10 |
| 6 — `frontsChecked` e `qualification` no contexto | 2, 8 |
| 7 — degradação (webhook, agenda, abandono) | 7, 8 |
| 8 — testes | 1, 2, 4, 5 |
| 9 — suposições (nome, Cal.com, casos) | 5, 9 e Global Constraints |

**Desvio consciente do spec, seção 6:** o spec previa `qualification` guardado no `VulnerabilityContext`. O plano guarda o objeto no estado do `AIChatAgent` (Task 8). Motivo: nenhuma outra dobra lê a qualificação — ela nasce e morre na dobra 5 — e promover ao contexto global seria acoplamento sem consumidor. O efeito prático que o spec pedia (não perder o preenchimento) continua: o estado sobrevive enquanto o agente estiver montado, que é a vida inteira da página. Se uma dobra futura precisar do dado, a promoção é mecânica.

**Lacuna herdada do spec:** os cinco campos não incluem o nome da pessoa — só o da empresa. A agenda recebe o nome da empresa no campo de convidado (Task 7, `name={qualification.company}`), o que é a leitura honesta do que foi coletado. Se o Raul quiser o nome de quem fala, é um sexto passo em `QUALIFICATION_STEPS` e o resto acompanha sozinho.

**Toda tarefa termina com a árvore verde.** A remoção de `ProofSection` e `ConsultantSection` acontece na Task 10, depois que a `LandingPage` para de importá-los — não na Task 9, que apenas cria o substituto. `npm run lint && npm test` deve passar ao fim de cada uma das dez tarefas.
