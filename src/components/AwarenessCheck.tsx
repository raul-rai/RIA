import { Check } from 'lucide-react';

interface AwarenessCheckProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Marcacao de conscientizacao do capitulo 1. Compartilhada pelo cartao
 * (desktop) e pelo acordeon (mobile) para que as duas versoes nunca divirjam em
 * texto ou estado.
 *
 * NAO mexe no Indice de Vulnerabilidade, e nao muda nenhuma nota exibida
 * adiante. Este comentario afirmava as duas coisas — era verdade ate ago/2026,
 * quando marcar aqui pagava 5 pontos de protecao. O eixo de conscientizacao foi
 * removido inteiro (ver o cabecalho de context/VulnerabilityContext) porque o
 * indice mede o que a empresa FAZ, nunca o que ela concorda: reduzir a propria
 * vulnerabilidade concordando com o vendedor e um quiz de vendas com estetica
 * de instrumento. O estado sobrevive apenas local, dentro do SocialProofSection.
 *
 * Continua sendo <button role="checkbox"> e nao uma <div> com onClick — mas
 * agora pelo motivo certo: ele TEM estado marcado/desmarcado, e leitor de tela
 * e teclado precisam alcancar e anunciar esse estado. O criterio e a semantica
 * do controle, nao a consequencia dele.
 */
export default function AwarenessCheck({ label, checked, onToggle, className = '' }: AwarenessCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`glass-inset w-full p-3 rounded-xl cursor-pointer select-none flex items-start gap-2.5 text-left ${
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
        {/* slate-600, nao slate-500: a 10px sobre a superficie rebaixada
            (gray-100) o slate-500 media 4.34:1 e reprovava no AA. slate-600
            devolve 6.9:1 sem mudar a hierarquia — continua sendo a linha
            auxiliar, so que legivel. */}
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mt-1">
          {checked ? '✓ Marcado' : 'Marcar se você concorda'}
        </span>
      </span>
    </button>
  );
}
