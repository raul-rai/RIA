import { motion } from 'motion/react';
import { Bot, Code, Zap, Wrench, Compass } from 'lucide-react';
import { useRef } from 'react';
import { useInView } from 'motion/react';

const services = [
  {
    icon: <Code size={28} className="text-white mb-6 group-hover:text-accent transition-colors duration-500" />,
    title: "Sites & Landing Pages com IA",
    desc: "Presença digital moderna que converte — construída com IA e sem templates genéricos."
  },
  {
    icon: <Bot size={28} className="text-white mb-6 group-hover:text-accent transition-colors duration-500" />,
    title: "Agentes de Vendas (SDR)",
    desc: "Um agente que qualifica seus leads no WhatsApp 24h por dia. Sem equipe. Sem hora extra."
  },
  {
    icon: <Zap size={28} className="text-white mb-6 group-hover:text-accent transition-colors duration-500" />,
    title: "Automações Inteligentes",
    desc: "Elimine tarefas repetitivas. Conecte seus sistemas. Deixe a IA cuidar do operacional."
  },
  {
    icon: <Wrench size={28} className="text-white mb-6 group-hover:text-accent transition-colors duration-500" />,
    title: "Ferramentas Personalizadas",
    desc: "Dashboards, simuladores e sistemas feitos sob medida para o seu processo específico."
  },
  {
    icon: <Compass size={28} className="text-white mb-6 group-hover:text-accent transition-colors duration-500" />,
    title: "Consultoria de Entrada na Era IA",
    desc: "Diagnóstico + roadmap. Saiba exatamente o que implementar, em qual ordem, com qual custo."
  }
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="servicos" className="relative bg-transparent py-32 overflow-hidden border-t border-white/5">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight">
            O arsenal <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-muted">para o domínio.</span>
          </h2>
          <p className="text-muted max-w-md text-lg font-light leading-relaxed">
            Soluções de ponta desenhadas para escalar operações, reduzir custos e colocar sua empresa na vanguarda do mercado.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`glass-card rounded-2xl p-8 md:p-10 group transition-all duration-500 hover:-translate-y-2 ${
                index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="relative z-10 h-full flex flex-col">
                {service.icon}
                <h3 className="text-xl font-display font-medium text-white mb-4 group-hover:text-accent transition-colors duration-500">
                  {service.title}
                </h3>
                <p className="text-muted font-light leading-relaxed mt-auto">
                  {service.desc}
                </p>
              </div>
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
