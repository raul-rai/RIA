import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Observa os capitulos e devolve o indice do que ocupa a tela.
 * Dispara setState apenas em fronteira de capitulo — nunca durante o scroll.
 */
export function useActiveChapter(count: number) {
  const [active, setActive] = useState(0);
  const elements = useRef<(HTMLElement | null)[]>([]);

  const setRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      elements.current[index] = el;
    },
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = elements.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        });
      },
      { threshold: 0.5 }
    );

    const observed = elements.current.filter((el): el is HTMLElement => el !== null);
    observed.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [count]);

  return { active, setRef };
}
