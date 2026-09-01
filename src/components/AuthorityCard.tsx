import { m } from 'motion/react';
import { Play } from 'lucide-react';
import type { Authority } from '../content/authorities';
import AwarenessCheck from './AwarenessCheck';

interface AuthorityCardProps {
  authority: Authority;
  index: number;
  checked: boolean;
  onToggle: () => void;
  onPlay: () => void;
}

/** Cartao do desktop (>= md). No mobile quem manda e o AuthorityAccordion. */
export default function AuthorityCard({ authority, index, checked, onToggle, onPlay }: AuthorityCardProps) {
  const Icon = authority.icon;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass-card glass-hover group flex flex-col justify-between rounded-2xl overflow-hidden ${
        checked ? 'glass-emerald glass-selected' : ''
      }`}
    >
      {/* O nome fica fora do botao para continuar sendo um <h3> de verdade:
          e ele que da estrutura ao capitulo para leitor de tela e crawler. */}
      <div className="relative h-48 md:h-52 overflow-hidden bg-slate-950">
        <img
          src={authority.thumbnail}
          loading="lazy"
          decoding="async"
          width={640}
          height={416}
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          style={{ objectPosition: 'center 22%' }}
          alt={authority.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white">
          <Icon size={14} />
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-left z-10 pointer-events-none">
          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest font-bold block mb-0.5">
            {authority.title}
          </span>
          <h3 className="text-white text-sm md:text-base font-bold">{authority.name}</h3>
        </div>

        <button
          type="button"
          onClick={onPlay}
          aria-label={`Assistir o trecho de ${authority.name}`}
          // O botao cobre a imagem inteira dentro de um cartao overflow:hidden:
          // o anel precisa crescer para DENTRO ou a quina do cartao o recorta.
          className="focus-ring-inset absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
        >
          <span className="w-11 h-11 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </span>
        </button>
      </div>

      <div className="p-4 md:p-5 flex flex-col justify-between flex-1">
        <blockquote className="glass-inset text-slate-600 text-xs italic mb-4 leading-relaxed p-3 rounded-xl">
          "{authority.quote}"
        </blockquote>
        <AwarenessCheck label={authority.checkboxLabel} checked={checked} onToggle={onToggle} />
      </div>
    </m.div>
  );
}
