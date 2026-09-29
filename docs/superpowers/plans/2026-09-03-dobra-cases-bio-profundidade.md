# Profundidade e ênfase na imagem — dobra cases + bio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar profundidade 3D e movimento fluido à dobra "Parcerias frutíferas + Quem executa", com a foto do Raul como protagonista, usando só CSS 3D transforms.

**Architecture:** A matemática do tilt vive num módulo puro (`src/lib/pointer-tilt.ts`), testável no ambiente `node` do vitest. Um hook (`src/hooks/usePointerTilt.ts`) faz o wiring de `pointermove`/`pointerleave` para CSS custom properties dentro de `requestAnimationFrame`. O CSS (`src/index.css`) consome as vars. A entrada por rolagem dos cards (motion `whileInView`) fica num wrapper externo e o tilt num elemento interno — transforms em elementos diferentes, sem conflito.

**Tech Stack:** React 19, motion (`m`), Tailwind v4, vitest (env `node`), CSS 3D transforms. Zero dependência nova.

## Global Constraints

- **Sem novas dependências** — nada de three.js/WebGL; só CSS transforms + um hook.
- **MOV-17:** nenhum `initial={{...}}` em `src/components/CredibilitySection.tsx` pode conter `opacity: 0`; ao menos um `initial` deve existir no arquivo.
- **MOV-20 / MOV-21:** no HTML publicado (`dist/index.html`), nada de conteúdo (`glass-card`, `Raul Vieira`, `Parcerias frutíferas`) pode sair com `style="opacity:0"`; no máximo 1 elemento invisível no site inteiro (o do chat).
- **MOV-19:** proibido `animation-timeline` no CSS.
- **MOV-04 / MOV-06:** nenhuma animação CSS `infinite` nova (o glow é estático). Se alguma surgir, precisa de guarda `prefers-reduced-motion` depois da definição no cascade.
- **SSR / no-JS:** o tilt roda só no cliente (dentro de `useEffect`); o markup do servidor é o repouso, plano e visível. Nada de acessar `window`/`matchMedia` fora de `useEffect`.
- **Desarme:** tilt só arma com `(hover: hover) and (pointer: fine)` e sem `prefers-reduced-motion: reduce`.
- **Ambiente de teste:** vitest `environment: 'node'`, sem DOM. Testes cobrem funções puras; o hook e o CSS são verificados por build + preview no navegador.
- **Foto:** imponente, ~340px no desktop; segue `/raul.pedro.webp`.

---

### Task 1: Módulo puro `pointer-tilt`

**Files:**
- Create: `src/lib/pointer-tilt.ts`
- Test: `tests/pointer-tilt.test.ts`

**Interfaces:**
- Produces:
  - `interface TiltInput { px: number; py: number; width: number; height: number; maxDeg: number }`
  - `interface Tilt { rotateX: number; rotateY: number }`
  - `function computeTilt(input: TiltInput): Tilt`
  - `function shouldArmTilt(input: { finePointer: boolean; reducedMotion: boolean }): boolean`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/pointer-tilt.test.ts
import { describe, it, expect } from 'vitest';
import { computeTilt, shouldArmTilt } from '../src/lib/pointer-tilt';

describe('computeTilt: posição do ponteiro vira rotação', () => {
  const base = { width: 200, height: 100, maxDeg: 8 };

  it('TILT-01: no centro, não inclina', () => {
    expect(computeTilt({ ...base, px: 100, py: 50 })).toEqual({ rotateX: 0, rotateY: 0 });
  });

  it('TILT-02: borda direita gira em Y positivo, sem X', () => {
    expect(computeTilt({ ...base, px: 200, py: 50 })).toEqual({ rotateX: 0, rotateY: 8 });
  });

  it('TILT-03: borda esquerda gira em Y negativo', () => {
    expect(computeTilt({ ...base, px: 0, py: 50 })).toEqual({ rotateX: 0, rotateY: -8 });
  });

  it('TILT-04: ponteiro embaixo inclina o topo para trás (rotateX negativo)', () => {
    expect(computeTilt({ ...base, px: 100, py: 100 })).toEqual({ rotateX: -8, rotateY: 0 });
  });

  it('TILT-05: ponteiro acima → rotateX positivo', () => {
    expect(computeTilt({ ...base, px: 100, py: 0 })).toEqual({ rotateX: 8, rotateY: 0 });
  });

  it('TILT-06: fora dos limites é travado ao máximo, nunca além', () => {
    const t = computeTilt({ ...base, px: 400, py: -50 });
    expect(t.rotateY).toBe(8);
    expect(t.rotateX).toBe(8);
  });

  it('TILT-07: elemento sem área devolve zero — evita divisão por zero', () => {
    expect(computeTilt({ px: 10, py: 10, width: 0, height: 0, maxDeg: 8 })).toEqual({
      rotateX: 0,
      rotateY: 0,
    });
  });
});

describe('shouldArmTilt: quando o tilt liga', () => {
  it('TILT-08: mouse fino e sem reduced-motion → arma', () => {
    expect(shouldArmTilt({ finePointer: true, reducedMotion: false })).toBe(true);
  });

  it('TILT-09: reduced-motion desarma', () => {
    expect(shouldArmTilt({ finePointer: true, reducedMotion: true })).toBe(false);
  });

  it('TILT-10: sem ponteiro fino (toque) desarma', () => {
    expect(shouldArmTilt({ finePointer: false, reducedMotion: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/pointer-tilt.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/pointer-tilt'`.

- [ ] **Step 3: Implementar o módulo**

```ts
// src/lib/pointer-tilt.ts
// Funcoes puras do tilt de ponteiro. Sem DOM, para serem testadas isoladas —
// mesmo padrao de lib/canvas-quality.ts e lib/wave-scene.ts.

export interface TiltInput {
  /** Posicao do ponteiro relativa ao canto superior esquerdo do elemento, em px. */
  px: number;
  py: number;
  /** Dimensoes do elemento, em px. */
  width: number;
  height: number;
  /** Inclinacao maxima, em graus, atingida nas bordas. */
  maxDeg: number;
}

export interface Tilt {
  rotateX: number;
  rotateY: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Converte a posicao do ponteiro dentro do elemento num par de rotacoes.
 * Centro = repouso (0,0). Direita gira em Y positivo; ponteiro embaixo inclina
 * o topo para tras (X negativo), que e o sentido natural de "olhar de cima".
 */
export function computeTilt(input: TiltInput): Tilt {
  const { px, py, width, height, maxDeg } = input;
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };
  const nx = clamp((px / width) * 2 - 1, -1, 1);
  const ny = clamp((py / height) * 2 - 1, -1, 1);
  return { rotateX: -ny * maxDeg, rotateY: nx * maxDeg };
}

/** So arma com mouse de verdade e sem pedido de movimento reduzido. */
export function shouldArmTilt(input: { finePointer: boolean; reducedMotion: boolean }): boolean {
  return input.finePointer && !input.reducedMotion;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/pointer-tilt.test.ts`
Expected: PASS (10 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pointer-tilt.ts tests/pointer-tilt.test.ts
git commit -m "feat: modulo puro do tilt de ponteiro (computeTilt/shouldArmTilt)"
```

---

### Task 2: Hook `usePointerTilt`

**Files:**
- Create: `src/hooks/usePointerTilt.ts`

**Interfaces:**
- Consumes: `computeTilt`, `shouldArmTilt` de `src/lib/pointer-tilt.ts`.
- Produces: `function usePointerTilt<T extends HTMLElement>(maxDeg?: number): React.RefObject<T | null>` — devolve um `ref` para pôr no elemento que inclina. Escreve `--tilt-x`, `--tilt-y`, `--tilt-active` nesse elemento.

Sem teste unitário: o ambiente do vitest é `node` (sem DOM) e o projeto não tem React Testing Library. O hook é wiring fino sobre o módulo puro já testado; a verificação é por build + preview (Task 5).

- [ ] **Step 1: Implementar o hook**

```ts
// src/hooks/usePointerTilt.ts
import { useEffect, useRef } from 'react';
import { computeTilt, shouldArmTilt } from '../lib/pointer-tilt';

/**
 * Inclina um elemento seguindo o ponteiro, escrevendo o resultado em CSS custom
 * properties (`--tilt-x`, `--tilt-y`, `--tilt-active`). O CSS consome; o JS nunca
 * monta a string de transform. Enhancement puro: se nao armar, o elemento fica
 * no repouso e o markup do servidor (plano) e o que vale.
 *
 * Nao arma em toque nem sob prefers-reduced-motion. Toda leitura de `window`
 * acontece dentro do effect — o SSR nunca chega aqui.
 */
export function usePointerTilt<T extends HTMLElement>(maxDeg = 8) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!shouldArmTilt({ finePointer, reducedMotion })) return;

    let frame = 0;
    let pending: { px: number; py: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      const rect = el.getBoundingClientRect();
      const { rotateX, rotateY } = computeTilt({
        px: pending.px,
        py: pending.py,
        width: rect.width,
        height: rect.height,
        maxDeg,
      });
      el.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
      el.style.setProperty('--tilt-active', '1');
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pending = { px: e.clientX - rect.left, py: e.clientY - rect.top };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      pending = null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--tilt-active', '0');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [maxDeg]);

  return ref;
}
```

- [ ] **Step 2: Conferir o typecheck**

Run: `npm run lint`
Expected: sem erros (tsc --noEmit passa).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePointerTilt.ts
git commit -m "feat: hook usePointerTilt liga o ponteiro ao tilt via CSS vars"
```

---

### Task 3: Classes CSS do tilt

**Files:**
- Modify: `src/index.css` (acrescentar um bloco novo ao final da camada de utilitários/componentes existente)

**Interfaces:**
- Consumes: as custom properties `--tilt-x`, `--tilt-y` escritas pelo hook.
- Produces: classes `.tilt-scene`, `.tilt-3d`, `.tilt-card`, `.tilt-depth`.

Sem teste unitário direto (CSS). Verificado por `movimento.test.ts` (que continua verde: nenhuma animação `infinite` nova, nenhum `animation-timeline`) e por preview.

- [ ] **Step 1: Acrescentar as classes**

Adicionar ao final de `src/index.css`:

```css
/*
 * Tilt 3D de ponteiro — profundidade na dobra de cases e bio.
 *
 * O elemento que inclina (.tilt-3d) recebe o ref do usePointerTilt e le as vars
 * que o hook escreve. A perspectiva mora no PAI (.tilt-scene): perspectiva no
 * proprio elemento transformado nao se aplica a ele mesmo. `preserve-3d` deixa
 * os filhos com .tilt-depth flutuarem num plano a frente, criando parallax.
 *
 * Nada aqui e `infinite` nem usa `animation-timeline` — e transicao de transform
 * dirigida por evento. Sob reduced-motion o hook nem arma (as vars ficam em 0),
 * mas o bloco de guarda abaixo zera qualquer transform e transicao de qualquer
 * jeito, para o caso continuar correto se um dia o tilt for aplicado sem passar
 * pelo hook.
 */
.tilt-scene {
  perspective: 900px;
}

.tilt-3d {
  transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))
    translateY(var(--tilt-lift, 0px));
  transform-style: preserve-3d;
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease;
  will-change: transform;
}

/* So os cartoes sobem no hover; o painel de bio nao. */
.tilt-card:hover {
  --tilt-lift: -8px;
}

/* A camada da frente no parallax — a foto do Raul. */
.tilt-depth {
  transform: translateZ(var(--tilt-depth, 40px));
}

@media (prefers-reduced-motion: reduce) {
  .tilt-3d,
  .tilt-depth {
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Conferir que os testes de movimento seguem verdes**

Run: `npx vitest run tests/movimento.test.ts`
Expected: PASS — sem `animation-timeline` (MOV-19), sem `infinite` nova (MOV-04/06).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: classes CSS do tilt 3d (tilt-scene/tilt-3d/tilt-card/tilt-depth)"
```

---

### Task 4: Aplicar na dobra — cards com tilt e foto protagonista

**Files:**
- Modify: `src/components/CredibilitySection.tsx`

**Interfaces:**
- Consumes: `usePointerTilt` de `src/hooks/usePointerTilt.ts`.
- Produces: componente local `CaseCard` (um card com tilt próprio); o painel de bio com a foto imponente e tilt.

Racional da estrutura: `usePointerTilt` é um hook — não pode ser chamado dentro de um `.map`. Por isso cada card vira um componente `CaseCard` que chama o hook uma vez. A entrada por rolagem (`m.div` com `initial={{ y: 16 }}`, sem opacidade) fica no wrapper EXTERNO; o tilt no `article` INTERNO — transforms em elementos diferentes, sem briga com o motion. Isso preserva MOV-17 (há `initial` sem opacidade) e MOV-21 (o `glass-card` continua no HTML, visível).

- [ ] **Step 1: Reescrever os imports e extrair `CaseCard`**

No topo de `src/components/CredibilitySection.tsx`, acrescentar o import do hook:

```tsx
import { usePointerTilt } from '../hooks/usePointerTilt';
```

Antes de `export default function CredibilitySection()`, adicionar o componente local `CaseCard` (move para dentro dele o markup de um card que hoje está no `.map`):

```tsx
/**
 * Um card de caso, com tilt proprio.
 *
 * Extraido do .map porque usePointerTilt e um hook — nao pode rodar em laco. A
 * entrada por rolagem fica no m.div externo (transform do motion); o tilt no
 * article interno (transform por CSS var). Elementos diferentes, sem conflito.
 */
function CaseCard({ c, index }: { c: (typeof CASES)[number]; index: number }) {
  const tiltRef = usePointerTilt<HTMLElement>(4);
  return (
    <m.div
      // Sem `opacity` na entrada: o motion serializa a variante inicial no SSR,
      // e com ela o card sairia publicado invisivel. So o deslocamento
      // sobrevive ao HTML — sem JavaScript o card esta la, 16px fora do lugar.
      initial={{ y: 16 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.08 }}
      className="tilt-scene h-full"
    >
      <article
        ref={tiltRef}
        className="tilt-3d tilt-card glass-card glass-hover h-full rounded-2xl p-5 flex flex-col gap-2 text-left"
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

        <p className="text-xl md:text-2xl font-serif text-slate-900 leading-tight">{c.headline}</p>

        <dl className="text-xs text-slate-600 leading-relaxed flex flex-col gap-2 mt-1">
          <div>
            <dt className="font-bold text-accent-dark uppercase text-[9px] tracking-wider">Antes</dt>
            <dd>{c.before}</dd>
          </div>
          <div>
            <dt className="font-bold text-accent-dark uppercase text-[9px] tracking-wider">O que entrou</dt>
            <dd>{c.intervention}</dd>
          </div>
          <div>
            <dt className="font-bold text-accent-dark uppercase text-[9px] tracking-wider">Prazo</dt>
            <dd>{c.timeframe}</dd>
          </div>
        </dl>

        {c.measurement ? (
          <p className="text-[11px] text-slate-500 border-t border-slate-900/10 pt-2.5 mt-auto">
            {c.measurement}
          </p>
        ) : c.kind === 'resultado' ? (
          <p className="text-[11px] text-amber-800/90 border-t border-slate-900/10 pt-2.5 mt-auto">
            Número informado pelo cliente, ainda sem apuração independente publicada.
          </p>
        ) : null}
      </article>
    </m.div>
  );
}
```

- [ ] **Step 2: Trocar o `.map` pelo `CaseCard` e ligar o tilt do painel**

Dentro de `CredibilitySection`, no início do corpo, adicionar o ref do painel:

```tsx
export default function CredibilitySection() {
  const { requestIntent } = useAgentIntent();
  const panelRef = usePointerTilt<HTMLDivElement>(7);
```

Substituir o grid de cartões (o `<div className="grid ...">{CASES.map(...)}</div>` inteiro) por:

```tsx
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8">
        {CASES.map((c, i) => (
          <CaseCard key={c.segment} c={c} index={i} />
        ))}
      </div>
```

- [ ] **Step 3: Foto protagonista + tilt no painel de bio**

Substituir o painel de bio (o bloco `<div className="glass-panel rounded-3xl p-6 md:p-8"> ... </div>` inteiro) por uma cena com tilt e foto imponente:

```tsx
      <div className="tilt-scene">
        <div
          ref={panelRef}
          className="tilt-3d glass-panel rounded-3xl p-6 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 md:gap-10 items-center">
            <div className="tilt-depth mx-auto md:mx-0" style={{ '--tilt-depth': '50px' } as CSSProperties}>
              {PHOTO_SRC ? (
                <div className="rounded-3xl p-[3px] bg-gradient-to-br from-cyan-400/70 via-sky-500/40 to-blue-700/60 shadow-[0_25px_70px_-20px_rgba(56,189,248,0.55)]">
                  <img
                    src={PHOTO_SRC}
                    alt={PHOTO_ALT}
                    loading="lazy"
                    className="w-72 h-72 md:w-[340px] md:h-[340px] rounded-[calc(1.5rem-3px)] object-cover"
                  />
                </div>
              ) : (
                <div className="glass-inset w-72 h-72 md:w-[340px] md:h-[340px] rounded-3xl flex items-center justify-center">
                  <span className="font-serif text-6xl text-slate-400">RV</span>
                </div>
              )}
            </div>

            <div className="flex flex-col text-center md:text-left">
              <div className="glass-inset inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 w-fit mx-auto md:mx-0">
                <Award size={12} className="text-accent" />
                <span className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                  Quem executa
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-serif text-slate-900 mb-1 leading-tight">
                {CONSULTANT.name}
              </h3>
              <p className="text-slate-500 text-xs md:text-sm italic mb-3">{CONSULTANT.role}</p>
              <div className="flex flex-col gap-3 mb-4 max-w-xl mx-auto md:mx-0">
                {CONSULTANT.bio.map((paragrafo) => (
                  <p key={paragrafo} className="text-slate-600 text-xs md:text-sm leading-relaxed">
                    {paragrafo}
                  </p>
                ))}
              </div>

              <ul className="flex flex-col gap-2 mb-5 text-left max-w-xl mx-auto md:mx-0">
                {CONSULTANT.credentials.map((cred) => (
                  <li key={cred} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Check size={14} className="text-accent shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-snug">{cred}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-center md:justify-start">
                <button
                  onClick={() => {
                    track('cta_click', { location: 'credibility' });
                    requestIntent('credibility');
                  }}
                  className="px-6 py-3.5 w-full md:w-auto bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  Fale com nosso agente <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
```

Nota: o `.map` do painel usa `cred` (não `c`) para não sombrear o `c` de nenhum card; o antigo usava `c`, aqui isolado.

- [ ] **Step 4: Ajustar o import de tipos**

`CSSProperties` é usado no `style` da foto. Garantir o import de tipo no topo do arquivo (se ainda não houver):

```tsx
import type { CSSProperties } from 'react';
```

- [ ] **Step 5: Typecheck**

Run: `npm run lint`
Expected: sem erros. Se acusar `c` não usado no escopo antigo ou `CASES[number]`, conferir que o tipo do prop de `CaseCard` está como `(typeof CASES)[number]`.

- [ ] **Step 6: Commit**

```bash
git add src/components/CredibilitySection.tsx
git commit -m "feat: profundidade 3d na dobra de cases e foto do Raul protagonista"
```

---

### Task 5: Build, regressão e verificação visual

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite completa (unidade + estática)**

Run: `npm test`
Expected: PASS em tudo, incluindo `tests/pointer-tilt.test.ts` e `tests/movimento.test.ts`.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build conclui; prerender gera `dist/index.html`.

- [ ] **Step 3: Rodar a suite de novo (agora com dist)**

Run: `npm test`
Expected: PASS — MOV-06b, MOV-20 e MOV-21 (que leem `dist/`) verdes: nenhum `glass-card` nem `Raul Vieira` publicado invisível.

- [ ] **Step 4: Verificação no navegador (preview_start)**

- Subir o dev server (`preview_start` com o nome do launch config, ou criar um apontando para `npm run dev` na porta 3000).
- Rolar até a dobra "Parcerias frutíferas".
- Desktop (mouse): passar o cursor sobre a foto e sobre os cards → devem inclinar suavemente e voltar ao repouso ao sair; a foto deve flutuar à frente do texto (parallax).
- `resize_window` para mobile → recarregar → sem tilt (só hover fino arma); foto grande centralizada no topo.
- `resize_window` colorScheme/emular reduced-motion se possível, ou conferir via `matchMedia` no `javascript_tool` → tilt desarmado, tudo plano.
- Conferir `read_console_messages` sem erros.
- Screenshot antes/depois para o usuário (`computer` screenshot + `SendUserFile`).

- [ ] **Step 5: Deploy (só após aprovação do usuário)**

```bash
vercel --prod --yes
```

---

## Self-Review

**Spec coverage:**
- Foto protagonista imponente (~340px) → Task 4, Step 3. ✔
- Moldura cinematográfica + glow ciano estático → Task 4, Step 3 (wrapper gradiente + shadow). ✔
- Tilt 3D + parallax (foto em translateZ) → Tasks 1–4 (`tilt-depth` `--tilt-depth: 50px`). ✔
- Cards com lift + tilt discreto + hierarquia com respiro → Task 4, Step 1 (`tilt-card`, `gap-2`, headline maior, dt em `text-accent-dark`). ✔
- Motor compartilhado `usePointerTilt` sem dependência → Tasks 1–2. ✔
- Coesão de cor com a onda (ciano/azul) → Task 4 (gradiente cyan/sky/blue). ✔
- Contratos MOV-17/19/20/21/04/06 e SSR/reduced-motion/toque → Global Constraints + Tasks 2, 3, 4. ✔

**Placeholder scan:** sem TBD/TODO; todo passo com código ou comando concreto. ✔

**Type consistency:** `computeTilt`/`shouldArmTilt` (Task 1) usados no hook (Task 2) com as mesmas assinaturas; `usePointerTilt<T>(maxDeg)` retorna `RefObject<T|null>` usado em `CaseCard` (`HTMLElement`) e no painel (`HTMLDivElement`); vars `--tilt-x/-y/-lift/-depth/-active` definidas no hook/CSS e consumidas no CSS. ✔
