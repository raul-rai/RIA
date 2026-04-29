import { motion } from 'motion/react';
import { Award, Briefcase, ArrowUpRight, Linkedin } from 'lucide-react';

export default function ConsultantSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-24 pointer-events-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
        {/* Profile Image with Decorative Elements */}
        <div className="relative max-w-[240px] md:max-w-none mx-auto md:mx-0 w-full">
          <div className="absolute -inset-1.5 md:-inset-4 border border-accent/20 rounded-[1.5rem] md:rounded-[3rem] -rotate-1 md:-rotate-3" />
          
          <div className="relative rounded-[1.4rem] md:rounded-[2.5rem] overflow-hidden aspect-[4/5] bg-bg-alt border border-white/10">
            <img 
              src="/raul.pedro.webp" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              alt="Raul Pedro - Consultor de IA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 via-transparent to-transparent z-10" />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="absolute -right-2 md:-right-8 bottom-4 md:bottom-12 p-3 md:p-6 premium-glass rounded-xl md:rounded-2xl border border-accent/20 max-w-[120px] md:max-w-[200px] z-20"
          >
            <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-2">
              <Award size={12} className="text-accent" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/80">Especialidade</span>
            </div>
            <div className="text-[9px] md:text-sm font-serif text-white leading-tight">Engenheiro & IA Strategy</div>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2 md:mb-6 w-fit mx-auto md:mx-0">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-white/60 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Seu Consultor</span>
          </div>
          
          <h2 className="text-2xl md:text-5xl font-serif text-white mb-2 md:mb-6">
            Raul Pedro <br />
            <span className="italic font-normal text-white/50 text-[0.8em]">Liderando sua Transição.</span>
          </h2>

          <p className="text-white/80 text-[13px] md:text-base font-light leading-relaxed mb-6 md:mb-10 max-w-md mx-auto md:mx-0">
            Especialista em unir a precisão da Engenharia à vanguarda da IA para garantir escala e eficiência operacional.
          </p>

          <div className="hidden md:grid grid-cols-1 gap-6 mb-12">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                <Briefcase size={16} className="text-accent" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-1">Experiência Real</h4>
                <p className="text-white/30 text-[11px] leading-relaxed">Agentes de IA já em produção qualificando leads.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-3 justify-center md:justify-start">
            <button 
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="px-6 py-4 bg-accent text-black rounded-lg font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
            >
              Estratégia <ArrowUpRight size={12} />
            </button>
            <a 
              href="#" 
              className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-lg font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Linkedin size={12} />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
