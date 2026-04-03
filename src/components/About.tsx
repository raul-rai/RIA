import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [imgError, setImgError] = useState(false);

  return (
    <section id="sobre" className="relative bg-transparent py-32 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white/5 via-black/60 to-black/80 z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center border-l border-white/20 pl-8 md:pl-12"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-8 tracking-tight">
              A engenharia por trás <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-muted">da inteligência.</span>
            </h2>

            <p className="text-xl text-muted font-light leading-relaxed mb-12">
              Engenheiro de Produção. Anos construindo sistemas de IA para o mercado financeiro brasileiro.
            </p>

            <ul className="space-y-8">
              {[
                "Agentes de IA em produção qualificando centenas de leads automaticamente",
                "Sistemas integrados com WhatsApp, CRM, bancos de dados vetoriais",
                "Do diagnóstico à entrega — sem burocracia e sem enrolação"
              ].map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.4 + (index * 0.2) }}
                  className="flex items-start gap-6 text-muted font-light group"
                >
                  <ArrowRight className="text-white/40 shrink-0 mt-1 group-hover:text-accent transition-colors duration-500" size={20} />
                  <span className="text-lg leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Image / Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[600px] lg:h-[700px] rounded-2xl overflow-hidden glass-card group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-black/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-700" />

            {/* Avatar — shows real photo when available, RP initials fallback when missing */}
            {imgError ? (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <span className="font-display font-bold text-white/30 text-[120px] tracking-tighter select-none">RP</span>
              </div>
            ) : (
              <img
                src="/raul-pedro.png"
                alt="Raul Pedro"
                className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
              />
            )}

            <div className="absolute bottom-10 left-10 z-20">
              <h3 className="text-3xl font-display font-medium text-white mb-2">Raul Pedro</h3>
              <p className="text-muted font-light tracking-widest uppercase text-sm">Consultor de IA</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
