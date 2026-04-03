import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';

export default function TheChoice() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="a-escolha" className="relative py-32 overflow-hidden min-h-screen flex flex-col justify-center border-t border-white/5">
      {/* Subtle darkening to ensure text readability over the bright wave */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full" ref={ref}>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight mb-6">
            A Última Dobra. <br className="md:hidden" />
            <span className="text-muted">O momento da decisão.</span>
          </h2>
          <p className="text-xl text-muted font-light max-w-2xl mx-auto leading-relaxed">
            A onda chegou. Você não pode pará-la. Você só pode escolher onde vai estar quando ela quebrar.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 h-full">
          
          {/* Scenario 1 - Failure */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden group bg-black/40 backdrop-blur-md border border-white/5 hover:border-red-900/30 transition-colors duration-700"
          >
            {/* Background Glows */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0" />
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col h-full">
              <div className="h-[250px] md:h-[350px] w-full rounded-xl overflow-hidden mb-10 relative">
                <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-700" />
                <img 
                  src="https://images.unsplash.com/photo-1505159940484-eb2b9f2588e2?q=80&w=2070&auto=format&fit=crop" 
                  alt="Onda caótica" 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-[0.5] group-hover:scale-105 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mt-auto">
                <h3 className="text-3xl font-display font-medium text-white group-hover:text-red-400 mb-4 tracking-tight transition-colors duration-700">
                  Engolido pelo Tsunami
                </h3>
                <p className="text-lg text-muted font-light leading-relaxed">
                  Processos manuais obsoletos. Equipe sobrecarregada apagando incêndios. Concorrentes usando IA para escalar enquanto sua margem de lucro desaparece na espuma.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Scenario 2 - Success */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="relative rounded-2xl overflow-hidden group bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/30 transition-colors duration-700 shadow-[0_0_40px_rgba(255,255,255,0.02)] hover:shadow-[0_0_60px_rgba(255,255,255,0.05)]"
          >
            {/* Background Glows */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700 z-0" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-700 z-0" />
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col h-full">
              <div className="h-[250px] md:h-[350px] w-full rounded-xl overflow-hidden mb-10 relative">
                <div className="absolute inset-0 bg-black/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-700" />
                <img 
                  src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop" 
                  alt="Fluxo de dados estruturado" 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mt-auto">
                <h3 className="text-3xl font-display font-medium text-white mb-4 tracking-tight transition-colors duration-700">
                  Dominando a Onda
                </h3>
                <p className="text-lg text-muted font-light leading-relaxed">
                  IA trabalhando 24/7. Agentes qualificando leads, automações eliminando gargalos. Você focado na estratégia enquanto a tecnologia impulsiona seu crescimento.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
