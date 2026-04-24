import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Play } from 'lucide-react';

const influencers = [
  {
    name: "Ricardo Amorim",
    title: "Economista & Influenciador",
    quote: "A IA não é o futuro, é a sobrevivência do presente. Quem não se adaptar será engolido.",
    videoUrl: "https://www.youtube.com/embed/4ZRJCW9CSvE?autoplay=1&mute=1&controls=0&loop=1",
    thumbnail: "https://img.youtube.com/vi/4ZRJCW9CSvE/maxresdefault.jpg"
  },
  {
    name: "Nielsen Report",
    title: "Global Insight",
    quote: "Empresas que adotam IA generativa veem um aumento de 40% na produtividade operacional.",
    videoUrl: "", // Placeholder or another source
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Satya Nadella",
    title: "CEO Microsoft",
    quote: "Estamos no momento 'iPhone' da inteligência artificial. Tudo vai mudar.",
    videoUrl: "",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"
  }
];

export default function SocialProofSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-24 pointer-events-auto">
      <div className="mb-10 md:mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-4 md:mb-6">
          <Quote size={12} className="text-accent" />
          <span className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-bold">Vozes do Mercado</span>
        </div>
        <h2 className="heading-section text-white mb-4 md:mb-6">
          Não sou só eu quem <br />
          <span className="italic font-normal text-white/50">está falando.</span>
        </h2>
        <p className="text-white/30 text-[11px] md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Líderes globais e economistas são unânimes: a janela de oportunidade está fechando rápido. 
        </p>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8">
        {influencers.map((item, i) => (
          <motion.div
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative h-[320px] md:h-[400px] rounded-3xl overflow-hidden border border-white/5 bg-white/5 shrink-0"
          >
            {/* Background Image / Video */}
            <div className="absolute inset-0 z-0">
              <img 
                src={item.thumbnail} 
                className={`w-full h-full object-cover opacity-20 md:opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:opacity-10 ${hoveredIndex === i ? 'blur-sm' : ''}`}
                alt={item.name}
              />
              <AnimatePresence>
                {hoveredIndex === i && item.videoUrl && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none hidden md:block"
                  >
                    <iframe 
                      src={item.videoUrl}
                      className="w-full h-full scale-150 object-cover opacity-60"
                      allow="autoplay"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-end bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent">
              <div className="mb-2 md:mb-4">
                <Quote size={20} className="text-accent mb-2 md:mb-4 opacity-40" />
                <p className="text-white/80 text-sm md:text-lg font-serif leading-relaxed mb-4 md:mb-6 italic line-clamp-4">
                  "{item.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4 border-t border-white/10 pt-4 md:pt-6">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-[11px] md:text-sm uppercase tracking-wider">{item.name}</span>
                  <span className="text-accent/60 text-[8px] md:text-[10px] uppercase font-medium">{item.title}</span>
                </div>
                {item.videoUrl && (
                  <div className="ml-auto w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Play size={12} className="text-accent animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 md:mt-16 text-center text-white/20 text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-black">
        CONSCIÊNCIA COLETIVA • RISCO DE OBSOLESCÊNCIA: <span className="text-red-500/50">CRÍTICO</span>
      </div>
    </div>
  );
}
