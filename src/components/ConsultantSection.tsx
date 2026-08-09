import { motion } from 'motion/react';
import { Award, Briefcase, ArrowUpRight } from 'lucide-react';

interface ConsultantSectionProps {
  onStrategyClick?: () => void;
}

export default function ConsultantSection({ onStrategyClick }: ConsultantSectionProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-12 flex flex-col justify-center h-full pointer-events-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        {/* Profile Image with Decorative Elements */}
        <div className="relative max-w-[220px] md:max-w-[340px] mx-auto w-full shrink-0">
          <div className="absolute -inset-1.5 md:-inset-3 border border-accent/20 rounded-[1.5rem] md:rounded-[2.5rem] -rotate-1 md:-rotate-2" />
          
          <div className="relative rounded-[1.4rem] md:rounded-[2.2rem] overflow-hidden aspect-[4/5] bg-bg-alt border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <img
              src="/raul.pedro.webp"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              alt="Raul Pedro - Consultor de IA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 z-10" />
            
            {/* Safe Floating Card inside the image bounds */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="absolute right-3 bottom-3 md:right-4 md:bottom-4 p-3 md:p-4 premium-glass rounded-xl border border-accent/20 z-20 backdrop-blur-md"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Award size={12} className="text-accent" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/80">Especialidade</span>
              </div>
              <div className="text-[10px] md:text-xs font-serif text-white leading-tight">Engenheiro & IA Strategy</div>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col text-center md:text-left shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6 w-fit mx-auto md:mx-0">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-white/60 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Seu Consultor</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-2 md:mb-4 leading-tight">
            Raul Pedro <br />
            <span className="italic font-normal text-white/50 text-[0.7em] md:text-[0.8em]">Liderando sua Transição.</span>
          </h2>

          <p className="text-white/80 text-xs md:text-sm font-light leading-relaxed mb-6 md:mb-8 max-w-md mx-auto md:mx-0">
            Especialista em unir a precisão da Engenharia à vanguarda da IA para garantir escala e eficiência operacional.
          </p>

          <div className="hidden md:flex flex-col gap-4 mb-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 shadow-inner">
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 shrink-0">
                <Briefcase size={14} className="text-accent" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[10px] uppercase tracking-widest mb-1">Experiência Real</h4>
                <p className="text-white/40 text-[10px] leading-relaxed">Agentes de IA já em produção qualificando leads em larga escala.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row justify-center md:justify-start">
            <button 
              onClick={() => {
                if (onStrategyClick) onStrategyClick();
                else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 md:py-4 w-full md:w-auto bg-accent text-black rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
            >
              Estratégia <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
