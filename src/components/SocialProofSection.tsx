import { useState } from 'react';
import { motion } from 'motion/react';
import { Quote, Play, TrendingUp, Cpu, Globe, Brain, ShieldAlert } from 'lucide-react';
import VideoModal from './VideoModal';

const influencers = [
  {
    name: "Jensen Huang",
    title: "CEO NVIDIA",
    quote: "Estamos no início da Próxima Revolução Industrial. A IA é a fábrica que produz inteligência.",
    videoUrl: "https://www.youtube.com/embed/AlT8V7uV90o?autoplay=1",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    icon: Cpu
  },
  {
    name: "Ricardo Amorim",
    title: "Economista",
    quote: "A IA não é o futuro, é a sobrevivência do presente. Quem não se adaptar será engolido.",
    videoUrl: "https://www.youtube.com/embed/4ZRJCW9CSvE?autoplay=1",
    thumbnail: "https://img.youtube.com/vi/4ZRJCW9CSvE/maxresdefault.jpg",
    icon: TrendingUp
  },
  {
    name: "Sam Altman",
    title: "CEO OpenAI",
    quote: "A inteligência artificial será o maior multiplicador de progresso da história da humanidade.",
    videoUrl: "https://www.youtube.com/embed/k96D3V99vR0?autoplay=1",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    icon: Brain
  },
  {
    name: "Satya Nadella",
    title: "CEO Microsoft",
    quote: "Estamos no momento 'iPhone' da inteligência artificial. Todo o software será reinventado.",
    videoUrl: "https://www.youtube.com/embed/SshM_6xXfR4?autoplay=1",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
    icon: Globe
  },
  {
    name: "Nielsen Report",
    title: "Global Insight",
    quote: "Empresas que adotam IA generativa veem um aumento de 40% na produtividade operacional.",
    videoUrl: "https://www.youtube.com/embed/Z_v6S4m09-4?autoplay=1",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
    icon: ShieldAlert
  }
];

export default function SocialProofSection() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 md:py-8 pointer-events-auto">
      <div className="mb-4 md:mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-2 md:mb-4">
          <Quote size={10} className="text-accent" />
          <span className="text-white/40 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-bold">Vozes do Mercado</span>
        </div>
        <h2 className="text-xl md:text-4xl font-serif text-white mb-1 md:mb-2 leading-tight">
          Vozes da <span className="italic font-normal text-white/50 text-glow-accent">Evolução.</span>
        </h2>
      </div>

      {/* Horizontal Carousel with improved visibility */}
      <div className="flex overflow-x-auto pb-6 md:pb-8 gap-4 md:gap-6 no-scrollbar snap-x snap-mandatory">
        {influencers.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              onClick={() => setSelectedVideo(item.videoUrl)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative h-[320px] md:h-[380px] w-[260px] md:w-[320px] shrink-0 snap-center rounded-2xl overflow-hidden border border-white/5 bg-white/5 cursor-pointer hover:border-accent/30 transition-all duration-500"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={item.thumbnail} 
                  className="w-full h-full object-cover opacity-20 transition-all duration-700 group-hover:scale-110 group-hover:opacity-10 grayscale"
                  alt={item.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 z-10 p-5 md:p-6 flex flex-col justify-end">
                <div className="mb-3 md:mb-4">
                  <div className="p-2 w-fit rounded-lg bg-accent/5 border border-accent/10 mb-3">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <p className="text-white/80 text-[11px] md:text-base font-serif leading-relaxed italic line-clamp-4">
                    "{item.quote}"
                  </p>
                </div>
                
                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-[9px] md:text-xs uppercase tracking-wider">{item.name}</span>
                    <span className="text-accent/60 text-[7px] md:text-[9px] uppercase font-medium">{item.title}</span>
                  </div>
                  <div className="ml-auto w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] group-hover:scale-110 transition-transform">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <VideoModal 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        videoUrl={selectedVideo || ''} 
      />

      <div className="mt-4 md:mt-8 text-center text-white/10 text-[6px] md:text-[8px] uppercase tracking-[0.4em] font-black">
        CONSCIÊNCIA COLETIVA • OBSOLESCÊNCIA: <span className="text-red-500/30">CRÍTICO</span>
      </div>
    </div>
  );
}
