import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Play } from 'lucide-react';
import VideoModal from './VideoModal';

const influencers = [
  {
    name: "Ricardo Amorim",
    title: "Economista & Influenciador",
    quote: "A IA não é o futuro, é a sobrevivência do presente. Quem não se adaptar será engolido.",
    videoUrl: "https://www.youtube.com/embed/4ZRJCW9CSvE?autoplay=1",
    thumbnail: "https://img.youtube.com/vi/4ZRJCW9CSvE/maxresdefault.jpg"
  },
  {
    name: "Nielsen Report",
    title: "Global Insight",
    quote: "Empresas que adotam IA generativa veem um aumento de 40% na produtividade operacional.",
    videoUrl: "https://www.youtube.com/embed/SshM_6xXfR4?autoplay=1", // Using a relevant placeholder
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Satya Nadella",
    title: "CEO Microsoft",
    quote: "Estamos no momento 'iPhone' da inteligência artificial. Tudo vai mudar.",
    videoUrl: "https://www.youtube.com/embed/k96D3V99vR0?autoplay=1",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"
  }
];

export default function SocialProofSection() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-24 pointer-events-auto">
      <div className="mb-6 md:mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-3 md:mb-6">
          <Quote size={12} className="text-accent" />
          <span className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-bold">Vozes do Mercado</span>
        </div>
        <h2 className="heading-section text-white mb-2 md:mb-6 text-2xl md:text-5xl">
          Vozes da <span className="italic font-normal text-white/50 text-glow-accent">Evolução.</span>
        </h2>
      </div>

      {/* Mobile: Horizontal Carousel | Desktop: Grid */}
      <div className="flex overflow-x-auto pb-8 md:pb-0 md:grid md:grid-cols-3 gap-4 md:gap-8 no-scrollbar snap-x snap-mandatory">
        {influencers.map((item, i) => (
          <motion.div
            key={i}
            onClick={() => setSelectedVideo(item.videoUrl)}
            className="group relative h-[380px] md:h-[450px] w-[280px] md:w-auto shrink-0 snap-center rounded-3xl overflow-hidden border border-white/5 bg-white/5 cursor-pointer"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={item.thumbnail} 
                className="w-full h-full object-cover opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:opacity-10"
                alt={item.name}
              />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-end bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent">
              <div className="mb-2 md:mb-4">
                <Quote size={20} className="text-accent mb-3 md:mb-4 opacity-40" />
                <p className="text-white/80 text-sm md:text-lg font-serif leading-relaxed mb-4 md:mb-6 italic">
                  "{item.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4 border-t border-white/10 pt-4 md:pt-6">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-[10px] md:text-sm uppercase tracking-wider">{item.name}</span>
                  <span className="text-accent/60 text-[7px] md:text-[10px] uppercase font-medium">{item.title}</span>
                </div>
                <div className="ml-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] group-hover:scale-110 transition-transform">
                  <Play size={16} fill="currentColor" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <VideoModal 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        videoUrl={selectedVideo || ''} 
      />

      <div className="mt-8 md:mt-16 text-center text-white/20 text-[7px] md:text-[9px] uppercase tracking-[0.4em] font-black">
        CONSCIÊNCIA COLETIVA • RISCO DE OBSOLESCÊNCIA: <span className="text-red-500/50">CRÍTICO</span>
      </div>
    </div>
  );
}
