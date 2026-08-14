import { motion } from 'motion/react';
import { Award, Check, ArrowUpRight } from 'lucide-react';
import { CONSULTANT, PHOTO_SRC, PHOTO_ALT } from '../content/consultant';
import { track } from '../lib/analytics';

interface ConsultantSectionProps {
  onStrategyClick?: () => void;
}

export default function ConsultantSection({ onStrategyClick }: ConsultantSectionProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-10 flex flex-col justify-center pointer-events-auto">
      {/* Superficie propria: este capitulo cai sobre a onda, e texto solto aqui
          media 2,4:1 de contraste. O cartao devolve o fundo de leitura. */}
      <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-xl p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6 md:gap-12 items-center">

          {/* Retrato ou cartao tipografico */}
          <div className="relative max-w-[200px] md:max-w-[300px] mx-auto w-full shrink-0">
            <div className="absolute -inset-1.5 md:-inset-3 border border-accent/30 rounded-[1.5rem] md:rounded-[2.2rem] -rotate-1 md:-rotate-2" aria-hidden="true" />

            {PHOTO_SRC ? (
              <div className="relative rounded-[1.4rem] md:rounded-[2rem] overflow-hidden aspect-[4/5] bg-slate-100 border border-slate-200 shadow-lg">
                <img
                  src={PHOTO_SRC}
                  loading="lazy"
                  decoding="async"
                  width={600}
                  height={750}
                  className="w-full h-full object-cover"
                  alt={PHOTO_ALT}
                />
              </div>
            ) : (
              <div className="relative rounded-[1.4rem] md:rounded-[2rem] aspect-[4/5] bg-slate-50 border border-slate-200 shadow-lg flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-2 border-accent/40 flex items-center justify-center font-serif text-2xl md:text-3xl font-black text-accent">
                  RP
                </div>
                <span className="font-serif text-slate-900 text-base md:text-lg font-bold leading-tight">
                  {CONSULTANT.name}
                </span>
                <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-[0.15em] font-bold leading-snug">
                  {CONSULTANT.role}
                </span>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="absolute right-2 bottom-2 md:right-3 md:bottom-3 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-md"
            >
              <div className="flex items-center gap-1.5">
                <Award size={12} className="text-accent" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-700">
                  Engenharia + IA
                </span>
              </div>
            </motion.div>
          </div>

          {/* Conteudo */}
          <div className="flex flex-col text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mb-4 w-fit mx-auto md:mx-0">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <span className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                Seu consultor
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-serif text-slate-900 mb-2 md:mb-3 leading-tight">
              {CONSULTANT.name} <br />
              <span className="italic font-normal text-slate-500 text-[0.7em] md:text-[0.75em]">
                {CONSULTANT.tagline}
              </span>
            </h2>

            <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-5 max-w-md mx-auto md:mx-0">
              {CONSULTANT.bio}
            </p>

            <ul className="flex flex-col gap-2 mb-6 text-left max-w-md mx-auto md:mx-0">
              {CONSULTANT.credentials.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check size={14} className="text-accent shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="leading-snug">{c}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-row justify-center md:justify-start">
              <button
                onClick={() => { track('cta_click', { location: 'consultant' }); onStrategyClick?.(); }}
                className="px-6 py-3.5 md:py-4 w-full md:w-auto bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Ver a proposta <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
