import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { WHATSAPP_URL_HERO } from '../constants/links';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
      <div className="relative z-30 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">

        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <h2 className="text-gray-300 font-mono tracking-widest uppercase text-xs md:text-sm">
            Revolução da Inteligência Artificial
          </h2>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="text-[20px] font-bold leading-[56.9px] mb-8 text-white/90 uppercase font-display"
        >
          A Inteligência Artificial não é uma onda, <br />
          <span className="text-[#2a42ec] text-[75px] md:text-[90px] lg:text-[110px] tracking-tighter leading-[0.9] block mt-2">É UM TSUNAMI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="text-lg md:text-2xl text-muted max-w-2xl mb-20 md:mb-28 font-light leading-relaxed"
        >
          Empresas que não se adaptarem serão engolidas. Nós construímos a prancha para você dominar essa força.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <a
            href={WHATSAPP_URL_HERO}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto group relative px-8 py-4 bg-white/90 backdrop-blur-sm text-black rounded-full font-medium text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3"
          >
            <span className="relative z-10">Iniciar Transformação</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" size={20} />
          </a>

          <button
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 text-white font-medium text-lg hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
            onClick={() => {
              const el = document.getElementById('servicos');
              if (!el) return;
              const top = el.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top, behavior: 'smooth' });
            }}
          >
            Nossa Metodologia
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30"
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
}
