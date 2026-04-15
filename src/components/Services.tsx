import { motion } from 'motion/react';
import { Bot, Code, Zap, Wrench, Compass, ArrowUpRight } from 'lucide-react';
import { useRef } from 'react';
import { useInView } from 'motion/react';

const services = [
  {
    icon: <Bot size={24} className="text-accent mb-4" />,
    title: "Agentes de Vendas (SDR)",
    desc: "Um agente que qualifica seus leads no WhatsApp 24h por dia. Sem equipe, sem atrasos.",
    className: "md:col-span-2 md:row-span-1"
  },
  {
    icon: <Code size={24} className="text-accent mb-4" />,
    title: "Ecossistemas Digitais",
    desc: "Presença digital que converte — construída com IA e design de alta performance.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    icon: <Zap size={24} className="text-accent mb-4" />,
    title: "Automação Operacional",
    desc: "Elimine tarefas repetitivas e conecte seus sistemas com fluxos inteligentes.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    icon: <Compass size={24} className="text-accent mb-4" />,
    title: "Roadmap Estratégico",
    desc: "Diagnóstico completo e plano de implementação para governança de IA.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    icon: <Wrench size={24} className="text-accent mb-4" />,
    title: "Sistemas Sob Medida",
    desc: "Dashboards e ferramentas personalizadas para sua necessidade específica.",
    className: "md:col-span-1 md:row-span-1"
  }
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="servicos" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 text-left"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
            Estratégias para <br />
            <span className="italic font-normal opacity-70">o próximo nível.</span>
          </h2>
          <p className="text-muted max-w-lg text-lg font-light leading-relaxed">
            Unimos inteligência de dados, design premium e as ferramentas de IA mais avançadas para transformar seu gargalo em vantagem competitiva.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 1, delay: 0.2 + (index * 0.1), ease: [0.16, 1, 0.3, 1] }}
              className={`premium-glass rounded-3xl p-8 relative group overflow-hidden ${service.className}`}
            >
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="text-accent" size={20} />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  {service.icon}
                  <h3 className="text-xl font-serif text-white mb-3">
                    {service.title}
                  </h3>
                </div>
                <p className="text-muted text-sm font-light leading-relaxed">
                  {service.desc}
                </p>
              </div>

              {/* Spotlight focus effect */}
              <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
