import { Check } from 'lucide-react';

interface AwarenessCheckProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Marcacao de conscientizacao do capitulo 1 — a caixa que reduz o Indice de
 * Vulnerabilidade. Compartilhada pelo cartao (desktop) e pelo acordeon (mobile)
 * para que as duas versoes nunca divirjam em texto ou estado.
 *
 * E um <button role="checkbox">, nao uma <div> com onClick: precisa alcancar
 * teclado e leitor de tela, ja que marcar aqui muda o diagnostico exibido
 * adiante na pagina.
 */
export default function AwarenessCheck({ label, checked, onToggle, className = '' }: AwarenessCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`glass-inset w-full p-3 rounded-xl cursor-pointer select-none flex items-start gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
        checked
          ? 'glass-emerald text-emerald-950'
          : 'glass-interactive text-slate-700'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400/70 bg-white/70'
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="flex-1">
        <span className="text-[11px] md:text-xs font-semibold block leading-tight">{label}</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
          {checked ? '✓ Marcado' : 'Marcar se você concorda'}
        </span>
      </span>
    </button>
  );
}
