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
