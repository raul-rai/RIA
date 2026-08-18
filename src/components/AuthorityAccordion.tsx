import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Play } from 'lucide-react';
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
 * A marcacao fica FORA do painel colapsavel, sempre visivel abaixo do
 * palestrante, e carrega a frase inteira. O que se pede aqui nao e um clique em
 * "marcar" — e a confirmacao de que a pessoa concorda com aquela afirmacao
 * especifica, e isso so tem sentido se a afirmacao estiver na tela junto do
 * controle. Um chip compacto escrito "Marcar" nao diz com o que se concorda.
 *
 * Expandir revela a evidencia (citacao + video), que aparece acima da marcacao:
 * le-se a prova e so entao se confirma.
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
            <h3 id={headerId} className="m-0">
              <button
                type="button"
                onClick={() => onToggleOpen(i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full flex items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
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

                <span className="shrink-0 flex items-center gap-1.5 text-slate-400">
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {isOpen ? 'Fechar' : 'Ver mais'}
                  </span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
            </h3>

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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fora do AnimatePresence de proposito: a marcacao nunca some. */}
            <div className="px-3 pb-3">
              <AwarenessCheck
                label={authority.checkboxLabel}
                checked={isChecked}
                onToggle={() => onToggleCheck(i)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
