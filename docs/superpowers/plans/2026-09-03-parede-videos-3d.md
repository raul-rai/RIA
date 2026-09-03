# Parede de vídeos 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a grade/acordeão da dobra "Vozes do mercado" por uma parede de vídeos em 3D (CSS puro) com arrasto livre, auto-giro e play inline.

**Architecture:** CSS 3D via `perspective` + `transform-style: preserve-3d` num container "rotor". Um módulo puro (`orbit-wall.ts`) faz a matemática do layout/arrasto/inércia; um hook (`useOrbitWall`) liga eventos de ponteiro/toque + `requestAnimationFrame` a CSS custom properties; o componente `VideoWall3D` renderiza os painéis como DOM real (SSR intacto) e só é "armado" em 3D no cliente. Enhancement progressivo: sem JS ou com `prefers-reduced-motion`, os painéis caem numa grade plana legível.

**Tech Stack:** React 19, Vite, Tailwind v4, `motion`, Vitest. **Sem three.js — nenhuma dependência nova.**

## Global Constraints

- **Sem dependências novas.** Nenhum `npm install`. Efeito 3D 100% CSS + hook próprio.
- **SSR/prerender intactos.** Os painéis são DOM real renderizado por `renderToString`; nenhuma leitura de `window` fora de `useEffect`. O conteúdo textual de cada painel existe no HTML mesmo sem JavaScript.
- **Privacidade.** Zero requisição ao YouTube antes do clique. Posters são as imagens locais em `authority.thumbnail` (`/autoridades/*.webp`) — nunca `i.ytimg.com`. No clique, iframe `youtube-nocookie` inline.
- **Módulos puros testados isoladamente** (padrão de `src/lib/pointer-tilt.ts` + `tests/pointer-tilt.test.ts`): sem DOM, importados nos testes por caminho relativo `../src/lib/...`.
- **CSS vars, nunca `style.transform` string a string** no JS (padrão do `usePointerTilt`).
- **Comandos de gate:** `npm run test` (vitest), `npm run lint` (`tsc --noEmit`).
- **Escopo:** só a dobra 1 (`SocialProofSection`). Não tocar hero, onda, outras dobras.

---

### Task 1: Módulo puro `orbit-wall.ts`

**Files:**
- Create: `src/lib/orbit-wall.ts`
- Test: `tests/orbit-wall.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface PanelPlacement { rotateYDeg: number; radiusPx: number; }`
  - `interface WallLayoutOpts { arcDeg: number; radiusPx: number; }`
  - `layoutPanels(count: number, opts: WallLayoutOpts): PanelPlacement[]`
  - `dragToAngle(startDeg: number, dxPx: number, sensitivity: number): number`
  - `stepAutoRotate(angleDeg: number, dtMs: number, degPerSec: number): number`
  - `applyInertia(velDegPerSec: number, damping: number): number`
  - `clampTilt(angleXDeg: number, maxDeg: number): number`

- [ ] **Step 1: Write the failing test**

Create `tests/orbit-wall.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  layoutPanels, dragToAngle, stepAutoRotate, applyInertia, clampTilt,
} from '../src/lib/orbit-wall';

describe('layoutPanels: distribui os painéis num arco centrado', () => {
  it('WALL-01: três painéis num arco de 60° ficam em -30, 0, +30', () => {
    const p = layoutPanels(3, { arcDeg: 60, radiusPx: 520 });
    expect(p.map((x) => x.rotateYDeg)).toEqual([-30, 0, 30]);
    expect(p.every((x) => x.radiusPx === 520)).toBe(true);
  });

  it('WALL-02: um único painel fica de frente (0°)', () => {
    expect(layoutPanels(1, { arcDeg: 60, radiusPx: 400 })).toEqual([
      { rotateYDeg: 0, radiusPx: 400 },
    ]);
  });

  it('WALL-03: zero painéis devolve lista vazia', () => {
    expect(layoutPanels(0, { arcDeg: 60, radiusPx: 400 })).toEqual([]);
  });
});

describe('dragToAngle: deslocamento horizontal vira ângulo', () => {
  it('WALL-04: soma linear e simétrica', () => {
    expect(dragToAngle(10, 100, 0.3)).toBeCloseTo(40);
    expect(dragToAngle(10, -100, 0.3)).toBeCloseTo(-20);
  });
});

describe('stepAutoRotate: integra o giro no tempo', () => {
  it('WALL-05: 6°/s por 1000ms avança 6°', () => {
    expect(stepAutoRotate(0, 1000, 6)).toBeCloseTo(6);
  });
});

describe('applyInertia: decai e zera no limiar', () => {
  it('WALL-06: decai multiplicando pelo amortecimento', () => {
    expect(applyInertia(10, 0.9)).toBeCloseTo(9);
  });
  it('WALL-07: abaixo do limiar vira exatamente 0', () => {
    expect(applyInertia(0.04, 0.9)).toBe(0);
  });
});

describe('clampTilt: trava a inclinação vertical', () => {
  it('WALL-08: nunca passa do máximo em módulo', () => {
    expect(clampTilt(20, 12)).toBe(12);
    expect(clampTilt(-20, 12)).toBe(-12);
    expect(clampTilt(5, 12)).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- orbit-wall`
Expected: FAIL — não encontra o módulo `../src/lib/orbit-wall`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/orbit-wall.ts`:

```ts
// Funcoes puras da parede de videos 3D. Sem DOM, testadas isoladas — mesmo
// padrao de lib/pointer-tilt.ts e lib/wave-scene.ts. O hook useOrbitWall e o
// CSS consomem estes numeros; aqui nao se toca em elemento nenhum.

export interface PanelPlacement {
  /** Rotacao do painel em torno do eixo Y, em graus. */
  rotateYDeg: number;
  /** Distancia do painel ao centro do rotor, em px (translateZ). */
  radiusPx: number;
}

export interface WallLayoutOpts {
  /** Abertura total do arco, em graus (ex.: 60 = de -30 a +30). */
  arcDeg: number;
  /** Raio do arco, em px. */
  radiusPx: number;
}

/** Limiar abaixo do qual a inercia e considerada parada. */
const INERTIA_STOP = 0.05;

/**
 * Distribui `count` paineis num arco de abertura `arcDeg` centrado em 0.
 * Um painel fica de frente; N paineis se espalham de -arcDeg/2 a +arcDeg/2.
 */
export function layoutPanels(count: number, opts: WallLayoutOpts): PanelPlacement[] {
  if (count <= 0) return [];
  if (count === 1) return [{ rotateYDeg: 0, radiusPx: opts.radiusPx }];
  const step = opts.arcDeg / (count - 1);
  const start = -opts.arcDeg / 2;
  return Array.from({ length: count }, (_, i) => ({
    rotateYDeg: start + i * step,
    radiusPx: opts.radiusPx,
  }));
}

/** Converte deslocamento horizontal do ponteiro (px) em delta de angulo. */
export function dragToAngle(startDeg: number, dxPx: number, sensitivity: number): number {
  return startDeg + dxPx * sensitivity;
}

/** Integra o auto-giro: quantos graus avancar em `dtMs` a `degPerSec`. */
export function stepAutoRotate(angleDeg: number, dtMs: number, degPerSec: number): number {
  return angleDeg + (degPerSec * dtMs) / 1000;
}

/** Decai a velocidade da inercia; zera abaixo do limiar para o loop poder parar. */
export function applyInertia(velDegPerSec: number, damping: number): number {
  const next = velDegPerSec * damping;
  return Math.abs(next) < INERTIA_STOP ? 0 : next;
}

/** Trava a inclinacao vertical para a parede nao virar de cabeca pra baixo. */
export function clampTilt(angleXDeg: number, maxDeg: number): number {
  return Math.min(maxDeg, Math.max(-maxDeg, angleXDeg));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- orbit-wall`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/orbit-wall.ts tests/orbit-wall.test.ts
git commit -m "feat: modulo puro da parede de videos 3d (layout/arrasto/inercia)"
```

---

### Task 2: Extrair `playerSrc` para `src/lib/youtube.ts`

**Files:**
- Create: `src/lib/youtube.ts`
- Test: `tests/youtube.test.ts`
- Modify: `src/components/VideoModal.tsx` (remove a função local, importa do lib)

**Interfaces:**
- Consumes: nada.
- Produces: `playerSrc(videoUrl: string, startTime?: number, endTime?: number): string`

- [ ] **Step 1: Write the failing test**

Create `tests/youtube.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { playerSrc } from '../src/lib/youtube';

describe('playerSrc: monta o embed nocookie', () => {
  it('YT-01: usa o dominio sem cookie e o id extraido do embed', () => {
    const src = playerSrc('https://www.youtube-nocookie.com/embed/abc123?autoplay=1');
    expect(src.startsWith('https://www.youtube-nocookie.com/embed/abc123?')).toBe(true);
  });

  it('YT-02: aplica start e end quando informados', () => {
    const src = playerSrc('https://www.youtube-nocookie.com/embed/abc123', 30, 90);
    const u = new URL(src);
    expect(u.searchParams.get('start')).toBe('30');
    expect(u.searchParams.get('end')).toBe('90');
  });

  it('YT-03: sem end, nao inclui o parametro end', () => {
    const src = playerSrc('https://www.youtube-nocookie.com/embed/abc123', 30);
    expect(new URL(src).searchParams.has('end')).toBe(false);
  });

  it('YT-04: extrai id da forma v=', () => {
    const src = playerSrc('https://www.youtube.com/watch?v=xyz789');
    expect(src).toContain('/embed/xyz789?');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- youtube`
Expected: FAIL — módulo `../src/lib/youtube` não existe.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/youtube.ts` (mover, verbatim, a lógica de `VideoModal.tsx:38-49` — sem mudança de comportamento):

```ts
// Endereco do player YouTube, montado a partir do videoUrl da autoridade.
//
// IFRAME PURO, SEM A IFRAME API. Dominio -nocookie e nenhum script de terceiro:
// nada do YouTube e pedido antes de o iframe existir. `start`/`end` sao nativos
// do embed, entao o recorte e exato sem JavaScript de terceiro. Ver a nota longa
// no historico de VideoModal.tsx, de onde isto foi extraido para ser reusado
// tambem pela parede de videos 3d.
export function playerSrc(videoUrl: string, startTime?: number, endTime?: number): string {
  const videoId = videoUrl.match(/(?:embed\/|v=)([^?&]+)/)?.[1] ?? '';
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    start: String(startTime ?? 0),
  });
  if (endTime) params.set('end', String(endTime));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
```

- [ ] **Step 4: Refactor `VideoModal.tsx` to import it**

Em `src/components/VideoModal.tsx`: apagar a função `playerSrc` local (linhas ~16-49, incluindo o bloco de comentário acima dela) e adicionar o import no topo, junto aos outros:

```ts
import { playerSrc } from '../lib/youtube';
```

O restante do componente não muda — ele já chama `playerSrc(videoUrl, startTime, endTime)`.

- [ ] **Step 5: Run tests + lint to verify nothing broke**

Run: `npm run test -- youtube` → PASS (4 testes)
Run: `npm run lint`
Expected: sem erros de tipo.

- [ ] **Step 6: Commit**

```bash
git add src/lib/youtube.ts tests/youtube.test.ts src/components/VideoModal.tsx
git commit -m "refactor: playerSrc vira lib compartilhado (VideoModal + parede 3d)"
```

---

### Task 3: Conteúdo dos painéis de apoio `proofPanels.ts`

**Files:**
- Create: `src/content/proofPanels.ts`
- Test: `tests/proof-panels.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type ProofPanel = { kind: 'metric'; value: string; label: string } | { kind: 'outlet'; name: string; note: string }`
  - `const PROOF_PANELS: ProofPanel[]`

- [ ] **Step 1: Write the failing test**

Create `tests/proof-panels.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PROOF_PANELS } from '../src/content/proofPanels';

describe('PROOF_PANELS: paineis de apoio da parede', () => {
  it('PANEL-01: existe pelo menos um painel de apoio', () => {
    expect(PROOF_PANELS.length).toBeGreaterThan(0);
  });

  it('PANEL-02: todo painel tem conteudo textual nao vazio', () => {
    for (const p of PROOF_PANELS) {
      const text = p.kind === 'metric' ? `${p.value}${p.label}` : `${p.name}${p.note}`;
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- proof-panels`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Write minimal implementation**

Create `src/content/proofPanels.ts`. **Conteúdo PLACEHOLDER** derivado das bios/veículos já citados em `authorities.ts` — o usuário revisa e substitui depois:

```ts
// Paineis de apoio que enchem a parede de videos 3d, junto dos 3 videos de
// autoridade. NAO sao vozes novas: sao ancoras de contexto (veiculos onde essas
// vozes aparecem e metricas de mercado). Mantenha curto — cada painel e um card
// pequeno na parede.
//
// PLACEHOLDER: os textos abaixo saem das bios ja citadas em content/authorities.ts.
// Revise antes de publicar; se um dado nao puder ser sustentado, troque ou remova.
export type ProofPanel =
  | { kind: 'metric'; value: string; label: string }
  | { kind: 'outlet'; name: string; note: string };

export const PROOF_PANELS: ProofPanel[] = [
  { kind: 'outlet', name: 'Forbes', note: 'Economista mais influente do Brasil' },
  { kind: 'outlet', name: 'LinkedIn', note: 'Top Voice em negócios e tecnologia' },
  { kind: 'metric', value: '+20 anos', label: 'no mercado financeiro global' },
  { kind: 'metric', value: 'CESAR', label: 'referência em engenharia de software' },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- proof-panels`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/content/proofPanels.ts tests/proof-panels.test.ts
git commit -m "feat: conteudo (placeholder) dos paineis de apoio da parede 3d"
```

---

### Task 4: Hook `useOrbitWall`

**Files:**
- Create: `src/hooks/useOrbitWall.ts`

**Interfaces:**
- Consumes: `layoutPanels` não é usado aqui (é no componente); este hook usa `dragToAngle`, `stepAutoRotate`, `applyInertia`, `clampTilt` de `../lib/orbit-wall`.
- Produces: `useOrbitWall<T extends HTMLElement>(opts?: OrbitWallOpts): RefObject<T>` onde
  `interface OrbitWallOpts { degPerSec?: number; sensitivity?: number; damping?: number; maxTiltDeg?: number }`.
  O ref é para o elemento **`.wall-stage`**. O hook escreve `--wall-rot-y` e `--wall-rot-x` no filho `.wall-rotor` e marca o stage com `data-armed="true"` quando arma.

Nota: hooks/componentes não têm teste unitário neste repo (só libs puras e conteúdo). O gate desta task é `npm run lint` + `npm run test` (suíte inteira verde) + a verificação de navegador na Task 8.

- [ ] **Step 1: Write the implementation**

Create `src/hooks/useOrbitWall.ts`:

```ts
import { useEffect, useRef } from 'react';
import { dragToAngle, stepAutoRotate, applyInertia, clampTilt } from '../lib/orbit-wall';

export interface OrbitWallOpts {
  /** Velocidade do auto-giro, em graus por segundo. */
  degPerSec?: number;
  /** Sensibilidade do arrasto (graus por pixel). */
  sensitivity?: number;
  /** Amortecimento da inercia por frame (0..1). */
  damping?: number;
  /** Inclinacao vertical maxima do arrasto, em graus. */
  maxTiltDeg?: number;
}

/**
 * Gira a parede de videos: auto-giro lento, arrasto para orbitar e inercia ao
 * soltar. Escreve o angulo em CSS custom properties no `.wall-rotor`; o CSS e
 * quem aplica o transform. Enhancement puro — se nao armar (reduced-motion), o
 * stage nunca ganha `data-armed` e o CSS mantem os paineis numa grade plana.
 *
 * NAO usa o gate de ponteiro fino do usePointerTilt: aqui o toque É bem-vindo.
 * O gate do mobile e outro — so captura para orbitar quando o gesto comeca sobre
 * um `.wall-panel`; caso contrario o `touch-action: pan-y` do stage deixa a
 * pagina rolar. Toda leitura de `window` acontece dentro do effect (SSR seguro).
 */
export function useOrbitWall<T extends HTMLElement>(opts: OrbitWallOpts = {}) {
  const { degPerSec = 5, sensitivity = 0.3, damping = 0.92, maxTiltDeg = 10 } = opts;
  const ref = useRef<T>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rotor = stage.querySelector<HTMLElement>('.wall-rotor');
    if (!rotor) return;

    stage.dataset.armed = 'true';

    let rotY = 0;
    let rotX = 0;
    let velY = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastMoveTs = 0;
    let paused = false; // dobra fora de vista ou aba oculta
    let last = performance.now();
    let frame = 0;

    const write = () => {
      rotor.style.setProperty('--wall-rot-y', `${rotY.toFixed(2)}deg`);
      rotor.style.setProperty('--wall-rot-x', `${rotX.toFixed(2)}deg`);
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) {
        if (dragging) {
          // segurando: o arrasto ja escreve rotY em onMove; nada a integrar.
        } else if (velY !== 0) {
          rotY = dragToAngle(rotY, velY * (dt / 1000), 1);
          velY = applyInertia(velY, damping);
        } else {
          rotY = stepAutoRotate(rotY, dt, degPerSec);
        }
        write();
      }
      frame = requestAnimationFrame(tick);
    };

    const onDown = (e: PointerEvent) => {
      const onPanel = (e.target as HTMLElement | null)?.closest('.wall-panel');
      if (!onPanel) return; // fundo/laterais: deixa a pagina rolar
      dragging = true;
      velY = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTs = performance.now();
      stage.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY = dragToAngle(rotY, dx, sensitivity);
      rotX = clampTilt(rotX - dy * sensitivity * 0.5, maxTiltDeg);
      const dtMove = Math.max(1, now - lastMoveTs);
      velY = (dx * sensitivity) / (dtMove / 1000); // graus por segundo
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTs = now;
      write();
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      stage.releasePointerCapture?.(e.pointerId);
    };

    const io = new IntersectionObserver(
      ([entry]) => { paused = !entry.isIntersecting || document.visibilityState === 'hidden'; },
      { threshold: 0.05 },
    );
    io.observe(stage);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') paused = true;
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      document.removeEventListener('visibilitychange', onVisibility);
      delete stage.dataset.armed;
    };
  }, [degPerSec, sensitivity, damping, maxTiltDeg]);

  return ref;
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOrbitWall.ts
git commit -m "feat: hook useOrbitWall (auto-giro, arrasto, inercia, gate de toque)"
```

---

### Task 5: Componente `VideoWall3D`

**Files:**
- Create: `src/components/VideoWall3D.tsx`

**Interfaces:**
- Consumes: `AUTHORITIES`, `type Authority` de `../content/authorities`; `PROOF_PANELS`, `type ProofPanel` de `../content/proofPanels`; `layoutPanels` de `../lib/orbit-wall`; `useOrbitWall` de `../hooks/useOrbitWall`; `playerSrc` de `../lib/youtube`.
- Produces: `export default function VideoWall3D(): JSX.Element`

- [ ] **Step 1: Write the implementation**

Create `src/components/VideoWall3D.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { AUTHORITIES, type Authority } from '../content/authorities';
import { PROOF_PANELS, type ProofPanel } from '../content/proofPanels';
import { layoutPanels } from '../lib/orbit-wall';
import { useOrbitWall } from '../hooks/useOrbitWall';
import { playerSrc } from '../lib/youtube';

/** Cada slot da parede: um video de autoridade ou um painel de apoio. */
type Slot = { kind: 'video'; authority: Authority } | { kind: 'support'; panel: ProofPanel };

/**
 * Intercala os 3 videos com os paineis de apoio para a parede nao ficar com os
 * videos todos de um lado. Ordem estavel (nao aleatoria) — o SSR e o cliente
 * precisam gerar exatamente a mesma sequencia.
 */
function buildSlots(): Slot[] {
  const videos: Slot[] = AUTHORITIES.map((authority) => ({ kind: 'video', authority }));
  const supports: Slot[] = PROOF_PANELS.map((panel) => ({ kind: 'support', panel }));
  const out: Slot[] = [];
  const max = Math.max(videos.length, supports.length);
  for (let i = 0; i < max; i++) {
    if (videos[i]) out.push(videos[i]);
    if (supports[i]) out.push(supports[i]);
  }
  return out;
}

export default function VideoWall3D() {
  const stageRef = useOrbitWall<HTMLDivElement>();
  const [playing, setPlaying] = useState<string | null>(null);

  const slots = useMemo(buildSlots, []);
  const placements = useMemo(
    () => layoutPanels(slots.length, { arcDeg: 150, radiusPx: 560 }),
    [slots.length],
  );

  return (
    <div ref={stageRef} className="wall-stage" aria-label="Parede de vídeos e provas">
      <div className="wall-rotor">
        <ul className="wall-list">
          {slots.map((slot, i) => {
            const place = placements[i];
            const style = {
              '--panel-rot': `${place.rotateYDeg}deg`,
              '--panel-z': `${place.radiusPx}px`,
            } as React.CSSProperties;

            if (slot.kind === 'video') {
              const a = slot.authority;
              const isPlaying = playing === a.name;
              return (
                <li key={a.name} className="wall-panel wall-video" style={style}>
                  {isPlaying ? (
                    <iframe
                      className="wall-iframe"
                      src={playerSrc(a.videoUrl, a.startTime, a.endTime)}
                      title={`Trecho de ${a.name} no YouTube`}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      className="wall-poster focus-ring-inset"
                      aria-label={`Assistir o trecho de ${a.name}`}
                      onClick={() => setPlaying(a.name)}
                    >
                      <img
                        src={a.thumbnail}
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={416}
                        alt={a.name}
                        className="wall-poster-img"
                      />
                      <span className="wall-poster-grad" aria-hidden="true" />
                      <span className="wall-poster-meta">
                        <span className="wall-poster-title">{a.title}</span>
                        <span className="wall-poster-name">{a.name}</span>
                      </span>
                      <span className="wall-play" aria-hidden="true">
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </span>
                    </button>
                  )}
                </li>
              );
            }

            const p = slot.panel;
            return (
              <li key={`support-${i}`} className="wall-panel wall-support" style={style}>
                {p.kind === 'metric' ? (
                  <>
                    <span className="wall-support-value">{p.value}</span>
                    <span className="wall-support-label">{p.label}</span>
                  </>
                ) : (
                  <>
                    <span className="wall-support-value">{p.name}</span>
                    <span className="wall-support-label">{p.note}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sem erros de tipo. (`focus-ring-inset` já existe no projeto — usado em `AuthorityCard`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/VideoWall3D.tsx
git commit -m "feat: componente VideoWall3D (paineis DOM real, play inline, SSR-safe)"
```

---

### Task 6: CSS da parede

**Files:**
- Modify: `src/index.css` (adicionar o bloco no mesmo `@layer components`, logo após o bloco `.tilt-*` que termina por volta da linha 986)

**Interfaces:**
- Consumes: as classes emitidas pelo `VideoWall3D` e as CSS vars escritas por `useOrbitWall`.
- Produces: estilo base = grade plana legível; sob `[data-armed="true"]` = arco 3D orbitando.

- [ ] **Step 1: Add the CSS**

Em `src/index.css`, logo após o fechamento do bloco `@media (prefers-reduced-motion: reduce)` das `.tilt-*` (linha ~985), dentro do mesmo `@layer components`, inserir:

```css
  /*
   * Parede de videos 3D — dobra "Vozes do mercado".
   *
   * ENHANCEMENT PROGRESSIVO. O estado BASE (sem JS, ou reduced-motion) e uma
   * grade plana e legivel: e o que o crawler e o prerender veem, e o que sobra
   * se o hook nao armar. So quando useOrbitWall confirma que pode animar ele
   * marca o stage com [data-armed="true"], e AI os paineis viram um arco 3D.
   *
   * As vars --panel-rot/--panel-z sao escritas inline pelo React (layoutPanels,
   * puro, roda igual no servidor). --wall-rot-y/--wall-rot-x sao escritas pelo
   * hook no .wall-rotor a cada frame.
   */
  .wall-stage {
    position: relative;
    width: 100%;
  }

  /* BASE: grade plana. Nenhuma perspectiva, nenhum absolute. */
  .wall-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .wall-panel {
    border-radius: 1rem;
    overflow: hidden;
    min-height: 12rem;
  }

  /* ARMADO: perspectiva no stage, rotor gira, paineis viram um arco. */
  .wall-stage[data-armed='true'] {
    perspective: 1100px;
    touch-action: pan-y;
    height: min(70svh, 520px);
    overflow: visible;
  }

  .wall-stage[data-armed='true'] .wall-rotor {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transform: translateZ(-560px) rotateX(var(--wall-rot-x, 0deg)) rotateY(var(--wall-rot-y, 0deg));
    transition: transform 90ms linear;
    will-change: transform;
  }

  .wall-stage[data-armed='true'] .wall-list {
    display: block;
    transform-style: preserve-3d;
    height: 100%;
  }

  .wall-stage[data-armed='true'] .wall-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 260px;
    height: 168px;
    margin: -84px 0 0 -130px;
    transform: rotateY(var(--panel-rot, 0deg)) translateZ(var(--panel-z, 0px));
    backface-visibility: hidden;
    cursor: grab;
  }

  .wall-stage[data-armed='true'] .wall-panel:active {
    cursor: grabbing;
  }

  /* Poster do video (identico em espirito ao AuthorityCard). */
  .wall-poster {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    background: #020617;
    cursor: pointer;
  }

  .wall-poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    opacity: 0.6;
  }

  .wall-poster-grad {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, #020617, rgba(2, 6, 23, 0.35) 55%, transparent);
  }

  .wall-poster-meta {
    position: absolute;
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.75rem;
    text-align: left;
    display: block;
  }

  .wall-poster-title {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    font-weight: 700;
    color: #67e8f9;
    margin-bottom: 0.1rem;
  }

  .wall-poster-name {
    display: block;
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .wall-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.9);
    color: #020617;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  .wall-iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }

  /* Painel de apoio: card de vidro simples. */
  .wall-support {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.35rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
  }

  .wall-support-value {
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
  }

  .wall-support-label {
    font-size: 0.8rem;
    color: #475569;
    line-height: 1.35;
  }

  /* reduced-motion: garante o estado plano mesmo que o hook um dia arme sem checar. */
  @media (prefers-reduced-motion: reduce) {
    .wall-stage[data-armed='true'] {
      perspective: none;
      height: auto;
    }
    .wall-stage[data-armed='true'] .wall-rotor {
      position: static;
      transform: none;
    }
    .wall-stage[data-armed='true'] .wall-list {
      display: grid;
    }
    .wall-stage[data-armed='true'] .wall-panel {
      position: static;
      width: auto;
      height: auto;
      margin: 0;
      transform: none;
    }
  }
```

- [ ] **Step 2: Lint (garante que o CSS não quebrou o build de tipos)**

Run: `npm run lint`
Expected: sem erros (o lint é `tsc`, o CSS não afeta, mas confirma que nada quebrou).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: CSS da parede 3d (base plana -> arco armado por data-armed)"
```

---

### Task 7: Integrar em `SocialProofSection`

**Files:**
- Modify: `src/components/SocialProofSection.tsx`

**Interfaces:**
- Consumes: `VideoWall3D` de `./VideoWall3D`.
- Produces: a dobra passa a renderizar a parede no lugar da grade desktop + acordeão mobile. Cabeçalho e disclaimer permanecem.

- [ ] **Step 1: Substituir o miolo pela parede**

Em `src/components/SocialProofSection.tsx`:

1. Remover os imports agora não usados: `AuthorityAccordion`, `AuthorityCard`, e o `lazy`/`Suspense`/`VideoModal` **se** nenhum outro caminho os usar (confirmar com busca no passo 2). Adicionar `import VideoWall3D from './VideoWall3D';`.
2. Substituir todo o bloco `<div className="max-w-5xl mx-auto w-full"> ... </div>` (a grade `hidden md:grid` + o `<div className="md:hidden">` do acordeão) por:

```tsx
      <div className="max-w-5xl mx-auto w-full">
        <VideoWall3D />
      </div>
```

3. Remover o estado que ficou órfão: `selected`/`setSelected` e o bloco `{selected && (<Suspense>...</Suspense>)}` no fim (o play agora é inline dentro da parede). Manter `awarenessChecks`/`vistos` **apenas se** o contador "X de N marcados" no cabeçalho continuar fazendo sentido; como as caixas de marcação viviam nos cards/acordeão que saíram, remover `awarenessChecks`, `toggleAwarenessCheck` e o trecho `{vistos > 0 && ...}` do cabeçalho.

Resultado esperado do componente (referência do miolo final):

```tsx
export default function SocialProofSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16 pointer-events-auto flex flex-col justify-center">
      <div className="mb-6 md:mb-10 text-center">
        <div className="glass-chip glass-amber inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <ShieldAlert size={14} className="text-amber-600" />
          <span className="text-amber-800 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Vozes do mercado
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 mb-2 leading-tight">
          Porque utilizar IA no <span className="italic font-normal text-slate-500">meu negócio?</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Três das vozes mais ouvidas do mercado brasileiro, falando sobre a mesma coisa.
        </p>
      </div>

      <div className="max-w-5xl mx-auto w-full">
        <VideoWall3D />
      </div>

      <p className="mt-6 md:mt-8 mx-auto max-w-3xl text-center text-[10px] md:text-[11px] text-slate-500 leading-relaxed">
        {AUTHORITIES_DISCLAIMER}
      </p>
    </div>
  );
}
```

Manter os imports usados: `ShieldAlert` (lucide), `AUTHORITIES_DISCLAIMER` de `../content/authorities`, `VideoWall3D`. `AUTHORITIES` deixa de ser importado aqui (a parede o importa direto).

- [ ] **Step 2: Confirmar que `VideoModal` ainda é usado em outro lugar antes de deixá-lo órfão**

Run: `git grep -n "VideoModal" src`
Expected: se só aparecer em `VideoModal.tsx` (definição), o componente ficou órfão nesta dobra — **não** apagar o arquivo neste plano (fora de escopo), só garantir que `SocialProofSection` não o importa mais. Se aparecer em outro componente, deixá-lo intacto lá.

- [ ] **Step 3: Rodar toda a suíte + lint**

Run: `npm run test`
Expected: PASS. **Atenção:** `tests/terceiros.test.ts` e `tests/authorities.test.ts` podem testar a presença do disclaimer/ausência de terceiros — o disclaimer continua renderizado, então devem seguir verdes. Se algum teste referenciava o acordeão/cards removidos, ajustar o teste para refletir a nova estrutura (a parede renderiza os mesmos nomes/quotes via `AUTHORITIES`).
Run: `npm run lint`
Expected: sem erros; sem imports não usados.

- [ ] **Step 4: Commit**

```bash
git add src/components/SocialProofSection.tsx tests
git commit -m "feat: dobra Vozes do mercado passa a usar a parede de videos 3d"
```

---

### Task 8: Verificação no navegador (dev server + SSR + reduced-motion + mobile)

**Files:** nenhum (verificação). Correções, se necessárias, voltam à task correspondente.

- [ ] **Step 1: Subir o dev server e abrir a dobra**

Usar o preview do app (`.claude/launch.json` → dev server na porta 3000, `npm run dev`). Navegar até a home e rolar até a dobra "Vozes do mercado".

- [ ] **Step 2: Conferir o console e a montagem 3D**

- `read_console_messages` — sem erros.
- `read_page` — os 3 nomes de autoridade e os textos dos painéis de apoio aparecem no DOM.
- A parede deve auto-girar devagar; arrastar sobre um card deve orbitar; soltar deve desacelerar (inércia).

- [ ] **Step 3: Play inline + privacidade**

- Clicar num poster → iframe entra no lugar, só aquele toca.
- `read_network_requests` filtrando por `youtube` **antes** de qualquer clique: **nenhuma** requisição a `youtube`/`ytimg`. Só após o clique deve aparecer `youtube-nocookie.com`.

- [ ] **Step 4: Reduced-motion**

Emular `prefers-reduced-motion: reduce` e recarregar. A parede deve virar grade plana, sem giro; os posters continuam clicáveis.

- [ ] **Step 5: Mobile (gate de arrasto)**

`resize_window` preset `mobile` + recarregar. Verificar que:
- rolar a página com o gesto começando **fora** de um card funciona (scroll vertical);
- arrastar **sobre** um card orbita a parede.
Registrar como o principal ponto de risco; se o gesto disputar, ajustar o limiar/`touch-action` na Task 4.

- [ ] **Step 6: SSR/prerender**

Run: `npm run build`
Expected: build + prerender sem erro. Conferir no HTML gerado (`dist-ssr` / saída do prerender) que os nomes das autoridades e os textos dos painéis estão presentes no HTML estático (Frente 1 preservada).

- [ ] **Step 7: Screenshot de prova**

Tirar um screenshot da parede montada (desktop) e enviar ao usuário.

- [ ] **Step 8: Commit (se houve ajustes)**

```bash
git add -A
git commit -m "fix: ajustes da parede 3d apos verificacao no navegador"
```

---

## Self-Review

**Spec coverage:**
- Densidade (3 vídeos + apoio) → Tasks 3, 5 (`buildSlots` intercala). ✓
- Play inline → Task 5 (estado `playing`, iframe no lugar do poster). ✓
- Arrasto livre + auto-giro + inércia → Tasks 1, 4. ✓
- Mobile com gate de arrasto → Task 4 (`onDown` só captura sobre `.wall-panel`; `touch-action: pan-y`) + Task 8 Step 5. ✓
- CSS 3D puro, sem three.js → todo o plano; nenhuma dependência. ✓
- SSR/indexação → Task 5 (DOM real) + Task 6 (base plana) + Task 8 Step 6. ✓
- Privacidade (poster local, iframe só no clique) → Task 5 + Task 8 Step 3. ✓
- `playerSrc` compartilhado → Task 2. ✓
- Conteúdo de apoio → Task 3. ✓
- Integração + destino do VideoModal → Task 7. ✓
- Reduced-motion → Tasks 4, 6, 8. ✓
- Testes do módulo puro → Task 1. ✓

**Type consistency:** `layoutPanels(count, {arcDeg, radiusPx})` → `PanelPlacement{rotateYDeg, radiusPx}` usado igual no componente (`place.rotateYDeg`, `place.radiusPx`). `useOrbitWall` escreve `--wall-rot-y`/`--wall-rot-x` no `.wall-rotor`; o CSS lê exatamente esses nomes. `--panel-rot`/`--panel-z` escritos inline no componente e lidos no CSS batem. `playerSrc(videoUrl, startTime?, endTime?)` idêntico em `youtube.ts`, `VideoModal` e `VideoWall3D`. ✓

**Placeholder scan:** os únicos placeholders são de **conteúdo** (`PROOF_PANELS`), marcados explicitamente para o usuário revisar — não são lacunas de implementação. ✓
