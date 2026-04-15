import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';

const stats = [
  {
    number: "73%",
    text: "das empresas com IA relatam vantagem competitiva em menos de 6 meses."
  },
  {
    number: "37%",
    text: "crescimento anual do mercado global de IA — o Brasil está acelerando."
  },
  {
    number: "< 2 anos",
    text: "é o que separa os primeiros dos retardatários em adoção de tecnologia."
  }
];

export default function WhyNow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-left mb-20 md:mb-28"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
            A janela ainda está aberta. <br />
            <span className="italic font-normal opacity-70">Por enquanto.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 1, delay: 0.2 + (index * 0.1), ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col group"
            >
              <div className="text-5xl md:text-6xl lg:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-6 group-hover:from-accent group-hover:to-white transition-all duration-1000">
                {stat.number}
              </div>
              <p className="text-muted text-lg font-light leading-relaxed">
                {stat.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
