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
      // pt maior que pb: reserva a faixa onde vivem o indice e a marca fixos,
      // para o conteudo nunca comecar por baixo deles.
      // scroll-mt garante que o mesmo respiro exista ao chegar por ancora.
      className={`relative w-full min-h-[100svh] flex items-center justify-center snap-start scroll-mt-4 px-4 pt-24 pb-14 md:pt-28 md:pb-20 ${className}`}
    >
      {children}
    </section>
  );
}
