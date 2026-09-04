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
 * NAO usa o gate de ponteiro fino do usePointerTilt: aqui o toque e bem-vindo.
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

    // Deslocamento minimo, em px, para um gesto virar arrasto em vez de toque.
    const DRAG_THRESHOLD_PX = 6;

    let rotY = 0;
    let rotX = 0;
    let velY = 0;
    let dragging = false; // arrasto horizontal armado (orbita)
    let pointerDown = false; // pressionado sobre um painel, ainda sem decidir toque x arrasto
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastMoveTs = 0;
    let activeId = -1;
    let intersecting = true; // dobra visivel no viewport
    let hidden = false; // aba oculta
    let paused = false; // = !intersecting || hidden
    let didDrag = false; // houve arrasto neste gesto (engole o click seguinte)
    let last = performance.now();
    let frame = 0;

    const syncPaused = () => {
      const next = !intersecting || hidden;
      // Ao despausar, zera o dt acumulado: sem isso o primeiro tick apos voltar
      // aplicaria um salto de rotacao proporcional ao tempo parado.
      if (paused && !next) last = performance.now();
      paused = next;
    };

    const write = () => {
      rotor.style.setProperty('--wall-rot-y', `${rotY.toFixed(2)}deg`);
      rotor.style.setProperty('--wall-rot-x', `${rotX.toFixed(2)}deg`);
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) {
        if (pointerDown || dragging) {
          // Pressionado (decidindo toque x arrasto) ou orbitando: o frame nao
          // move sozinho. Congelar sob o dedo da um alvo estavel para o toque
          // (senao o poster desliza e o clique de play erra), e enquanto orbita
          // e o onMove que escreve.
        } else if (velY !== 0) {
          rotY = dragToAngle(rotY, velY * (dt / 1000), 1);
          velY = applyInertia(velY, damping);
          write();
        } else {
          rotY = stepAutoRotate(rotY, dt, degPerSec);
          write();
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const onDown = (e: PointerEvent) => {
      const onPanel = (e.target as HTMLElement | null)?.closest('.wall-panel');
      if (!onPanel) return; // fundo/laterais: deixa a pagina rolar
      // NAO captura o ponteiro agora: capturar no pointerdown engoliria o
      // `click` do poster e o play nunca dispararia. A decisao entre toque e
      // arrasto vem no primeiro movimento (onMove).
      pointerDown = true;
      dragging = false;
      didDrag = false;
      velY = 0;
      downX = e.clientX;
      downY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTs = performance.now();
      activeId = e.pointerId;
    };

    const onMove = (e: PointerEvent) => {
      if (!pointerDown || e.pointerId !== activeId) return;

      if (!dragging) {
        const adx = Math.abs(e.clientX - downX);
        const ady = Math.abs(e.clientY - downY);
        if (adx < DRAG_THRESHOLD_PX && ady < DRAG_THRESHOLD_PX) return; // ainda pode ser toque
        if (adx <= ady) {
          // Predominantemente vertical: nao e orbita. Solta o gesto para o
          // `touch-action: pan-y` rolar a pagina — nada de capturar.
          pointerDown = false;
          return;
        }
        // Horizontal: arma a orbita e captura para receber os proximos eventos.
        dragging = true;
        didDrag = true;
        stage.setPointerCapture?.(e.pointerId);
      }

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
      if (e.pointerId !== activeId) return;
      // Se nunca armou o arrasto, foi um toque: nao faz nada e deixa o `click`
      // seguir para o poster (o play). Se armou, solta a captura; a inercia (em
      // velY) assume no proximo frame.
      if (dragging) {
        stage.releasePointerCapture?.(e.pointerId);
        // Se o dedo ja tinha parado antes de soltar, nao ha fling: zera para
        // nao arremessar com a velocidade obsoleta do ultimo movimento.
        if (performance.now() - lastMoveTs > 100) velY = 0;
      }
      pointerDown = false;
      dragging = false;
      activeId = -1;
    };

    // Um arrasto que termina sobre um poster dispara um `click` logo apos o
    // pointerup. Se houve arrasto, engole esse unico click (fase de captura)
    // para o play nao iniciar sem querer. Um toque puro nunca seta didDrag,
    // entao o clique de play passa normalmente.
    const onClickCapture = (e: MouseEvent) => {
      if (!didDrag) return;
      e.stopPropagation();
      e.preventDefault();
      didDrag = false;
    };

    const io = new IntersectionObserver(
      ([entry]) => { intersecting = entry.isIntersecting; syncPaused(); },
      { threshold: 0.05 },
    );
    io.observe(stage);

    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
      syncPaused();
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('click', onClickCapture, true);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('visibilitychange', onVisibility);
      delete stage.dataset.armed;
    };
  }, [degPerSec, sensitivity, damping, maxTiltDeg]);

  return ref;
}
