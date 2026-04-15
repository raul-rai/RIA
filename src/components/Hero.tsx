import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { WHATSAPP_URL_HERO } from '../constants/links';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
      <div className="relative z-30 max-w-5xl mx-auto px-6 w-full flex flex-col items-center text-center">

        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-10 shadow-2xl"
        >
          <Sparkles className="text-accent animate-pulse" size={14} />
          <h2 className="text-muted font-sans tracking-[0.2em] uppercase text-[10px] md:text-xs font-semibold">
            O Próximo Salto da Evolução Empresarial
          </h2>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[40px] md:text-[60px] lg:text-[80px] font-serif leading-[1.1] mb-8 text-white tracking-tight"
        >
          A IA não é uma onda, <br />
          <span className="text-glow-accent italic font-normal text-white">é um oceano de <br className="md:hidden" /> oportunidades.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-muted max-w-2xl mb-16 md:mb-24 font-sans font-light leading-relaxed"
        >
          Seu negócio está pronto para navegar ou ser submergido? Nós construímos sistemas de IA que colocam sua empresa na liderança do mercado.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
        >
          <a
            href={WHATSAPP_URL_HERO}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto group relative px-10 py-5 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-105 hover:bg-accent hover:shadow-[0_0_60px_rgba(0,229,255,0.4)] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
          >
            <span className="relative z-10">Iniciar Transformação</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" size={18} />
          </a>

          <button
            className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all duration-300 flex items-center justify-center backdrop-blur-sm active:scale-95"
            onClick={() => {
              const el = document.getElementById('servicos');
              if (!el) return;
              const top = el.getBoundingClientRect().top + window.scrollY - 100;
              window.scrollTo({ top, behavior: 'smooth' });
            }}
          >
            Nossa Estratégia
          </button>
        </motion.div>
      </div>

      {/* Background visual element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-radial-gradient from-accent/10 to-transparent opacity-30 z-0 blur-3xl pointer-events-none" />
    </section>
  );
}
