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
