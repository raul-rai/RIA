import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';

const stats = [
  {
    number: "73%",
    text: "das empresas com IA relatam vantagem competitiva em menos de 6 meses"
  },
  {
    number: "37%",
    text: "crescimento anual do mercado global de IA — e o Brasil está acelerando"
  },
  {
    number: "< 2 anos",
    text: "é o que separa os primeiros dos retardatários em adoção de tecnologia"
  }
];

export default function WhyNow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative bg-transparent py-32 overflow-hidden">
      {/* Subtle darkening to ensure text readability over the bright wave */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      {/* Tech Grid Background - More subtle */}
      <div className="absolute inset-0 opacity-[0.03] z-0" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight">
            A janela ainda está aberta. <br className="hidden md:block" />
            <span className="text-muted">Por enquanto.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-16 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-6 group-hover:from-accent group-hover:to-accent/20 transition-all duration-700">
                {stat.number}
              </div>
              <p className="text-lg text-muted font-light leading-relaxed max-w-xs mx-auto">
                {stat.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
