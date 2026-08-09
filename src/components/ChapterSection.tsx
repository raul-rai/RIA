import type { ReactNode } from 'react';

interface ChapterSectionProps {
  index: number;
  /** Rotulo acessivel do capitulo, lido por leitores de tela. */
  label: string;
  setRef: (el: HTMLElement | null) => void;
  children: ReactNode;
  className?: string;
}

export default function ChapterSection({
  index, label, setRef, children, className = '',
}: ChapterSectionProps) {
  return (
    <section
      id={`capitulo-${index}`}
      ref={setRef}
      aria-label={label}
      className={`relative w-full min-h-[100svh] flex items-center justify-center snap-start px-4 py-20 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}
