import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Play, Check } from 'lucide-react';
import type { Authority } from '../content/authorities';
import AwarenessCheck from './AwarenessCheck';
import { prefersReducedMotion } from '../lib/canvas-quality';

interface AuthorityAccordionProps {
  authorities: Authority[];
  /** Indice aberto, ou null com todos fechados. Um por vez. */
  openIndex: number | null;
  onToggleOpen: (index: number) => void;
  checks: boolean[];
  onToggleCheck: (index: number) => void;
  onPlay: (authority: Authority) => void;
}

/**
 * Versao mobile do capitulo 1.
 *
 * A lista vertical mostra os tres nomes e os checkboxes interativos de cara,
 * mesmo com o acordeon encolhido. O visitante pode marcar/desmarcar diretamente
 * no cabeçalho ou expandir para ler a citação e assistir o vídeo.
 */
export default function AuthorityAccordion({
  authorities, openIndex, onToggleOpen, checks, onToggleCheck, onPlay,
}: AuthorityAccordionProps) {
  const reduced = prefersReducedMotion();

  return (
    <div className="flex flex-col gap-3 w-full">
      {authorities.map((authority, i) => {
        const Icon = authority.icon;
        const isOpen = openIndex === i;
        const isChecked = checks[i];
        const panelId = `autoridade-painel-${i}`;
        const headerId = `autoridade-cabecalho-${i}`;

        return (
          <div
            key={authority.name}
            className={`rounded-2xl border bg-white overflow-hidden transition-colors duration-300 ${
              isChecked
                ? 'border-emerald-400 ring-1 ring-emerald-400/20'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between p-3 gap-2">
              <button
                type="button"
                onClick={() => onToggleOpen(i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                id={headerId}
                className="flex-1 flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg min-w-0"
              >
                {/* objectPosition 22%: "center top" cortava no cabelo — num
                    circulo de 44px sobrava testa e nenhum rosto. */}
                <span className="relative shrink-0">
                  <img
                    src={authority.thumbnail}
                    loading="lazy"
                    decoding="async"
                    width={640}
                    height={416}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover bg-slate-950"
                    style={{ objectPosition: 'center 22%' }}
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon size={9} className="text-white" />
                  </span>
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-slate-900 leading-tight truncate">
                    {authority.name}
                  </span>
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 truncate">
                    {authority.title}
                  </span>
                </span>
              </button>

              {/* Checkbox interativo no cabeçalho (visível encolhido ou expandido) */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCheck(i);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isChecked
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="text-[11px] font-medium">
                  {isChecked ? 'Ciente' : 'Marcar'}
                </span>
              </button>

              {/* Botão de expandir/recolher */}
              <button
                type="button"
                onClick={() => onToggleOpen(i)}
                aria-label={isOpen ? `Recolher ${authority.name}` : `Expandir ${authority.name}`}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none"
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 flex flex-col gap-3">
                    <blockquote className="text-slate-600 text-xs italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{authority.quote}"
                    </blockquote>

                    <button
                      type="button"
                      onClick={() => onPlay(authority)}
                      className="self-start inline-flex items-center gap-2 px-4 py-3 min-h-11 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold uppercase tracking-wider hover:border-accent hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Play size={12} fill="currentColor" />
                      Assistir o trecho
                    </button>

                    <AwarenessCheck
                      label={authority.checkboxLabel}
                      checked={isChecked}
                      onToggle={() => onToggleCheck(i)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
