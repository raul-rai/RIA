import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [imgError, setImgError] = useState(false);

  return (
    <section id="sobre" className="relative py-24 md:py-32 overflow-hidden border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-10 leading-tight">
              A engenharia <br />
              <span className="italic font-normal opacity-70">por trás da visão.</span>
            </h2>

            <p className="text-lg text-muted font-light leading-relaxed mb-12">
              Engenheiro de Produção especializado em sistemas de IA de alta performance. Minha missão é traduzir complexidade técnica em ROI direto para o seu negócio.
            </p>

            <ul className="space-y-6">
              {[
                "Arquitetura de Agentes Autônomos em produção",
                "Integrações robustas com ecossistemas de dados",
                "Foco absoluto em escala e segurança empresarial"
              ].map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.8, delay: 0.4 + (index * 0.1), ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-4 text-muted font-light group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-150 group-hover:shadow-[0_0_10px_rgba(0,229,255,0.8)] transition-all duration-500 shrink-0" />
                  <span className="text-base">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Image / Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-square md:aspect-[4/5] rounded-[3rem] overflow-hidden premium-glass group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent z-10" />
            
            {/* Avatar fallback */}
            {imgError ? (
              <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                <span className="font-serif font-bold text-white/10 text-[100px] select-none">RP</span>
              </div>
            ) : (
              <img
                src="/raul-pedro.png"
                alt="Raul Pedro"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-[1.02] group-hover:scale-100"
                onError={() => setImgError(true)}
              />
            )}

            <div className="absolute bottom-10 left-10 z-20">
              <h3 className="text-2xl font-serif text-white mb-1">Raul Pedro</h3>
              <p className="text-white/50 font-sans tracking-[0.2em] uppercase text-[10px] font-bold">Consultor de IA</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
