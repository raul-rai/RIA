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
    <div className="w-full max-w-6xl mx-auto px-4 py-24 pointer-events-auto">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
          <Quote size={14} className="text-accent" />
          <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Vozes do Mercado</span>
        </div>
        <h2 className="heading-section text-white mb-6">
          Não sou só eu que <br />
          <span className="italic font-normal text-white/50">estou falando.</span>
        </h2>
        <p className="text-white/30 text-sm max-w-xl mx-auto font-light">
          Líderes globais e economistas são unânimes: a janela de oportunidade está fechando. 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {influencers.map((item, i) => (
          <motion.div
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative h-[400px] rounded-3xl overflow-hidden border border-white/5 bg-white/5"
          >
            {/* Background Image / Video */}
            <div className="absolute inset-0 z-0">
              <img 
                src={item.thumbnail} 
                className={`w-full h-full object-cover opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:opacity-10 ${hoveredIndex === i ? 'blur-sm' : ''}`}
                alt={item.name}
              />
              <AnimatePresence>
                {hoveredIndex === i && item.videoUrl && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
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
            <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent">
              <div className="mb-4">
                <Quote size={24} className="text-accent mb-4 opacity-40" />
                <p className="text-white/80 text-lg font-serif leading-relaxed mb-6 italic">
                  "{item.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm uppercase tracking-wider">{item.name}</span>
                  <span className="text-accent/60 text-[10px] uppercase font-medium">{item.title}</span>
                </div>
                {item.videoUrl && (
                  <div className="ml-auto w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Play size={14} className="text-accent animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-16 text-center text-white/20 text-[9px] uppercase tracking-[0.4em] font-black">
        CONSCIÊNCIA COLETIVA • RISCO DE OBSOLESCÊNCIA: <span className="text-red-500/50">CRÍTICO</span>
      </div>
    </div>
  );
}
