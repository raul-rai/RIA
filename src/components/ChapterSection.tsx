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
      // pt reserva a faixa do indice fixo, para o conteudo nunca comecar por
      // baixo dele. pb no mobile reserva a faixa do FAB do WhatsApp: sem isso o
      // botao flutuante pousa exatamente sobre o CTA que fecha o capitulo.
      // scroll-mt garante que o mesmo respiro exista ao chegar por ancora.
      className={`relative w-full min-h-[100svh] flex items-center justify-center snap-start scroll-mt-4 px-4 pt-20 pb-24 md:pt-28 md:pb-20 [@media(max-height:600px)]:pt-16 [@media(max-height:600px)]:pb-16 ${className}`}
    >
      {children}
    </section>
  );
}
