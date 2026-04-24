import { useState } from 'react';
import { motion } from 'motion/react';
import { Quote, Play, TrendingUp, Cpu, Brain } from 'lucide-react';
import VideoModal from './VideoModal';

const influencers = [
  {
    name: "Ricardo Amorim",
    title: "Economista & Estrategista",
    quote: "A IA não é o futuro, é a sobrevivência do presente. Quem não se adaptar agora será engolido pelo mercado.",
    videoUrl: "https://www.youtube.com/embed/4ZRJCW9CSvE?autoplay=1",
    thumbnail: "https://p2.trrsf.com/image/fget/cf/940/0/images.terra.com/2023/06/13/1089201103-ricardoamorim.jpg",
    bio: "Economista mais influente do Brasil segundo a Forbes, apresentador do Manhattan Connection e LinkedIn Top Voice. Com mais de 20 anos no mercado financeiro global, é a voz mais respeitada sobre transformações econômicas e tecnológicas no país.",
    icon: TrendingUp
  },
  {
    name: "Jensen Huang",
    title: "CEO NVIDIA",
    quote: "Estamos no início da maior revolução tecnológica da nossa história. A IA é a nova eletricidade.",
    videoUrl: "https://www.youtube.com/embed/AlT8V7uV90o?autoplay=1",
    thumbnail: "https://www.adrenaline.com.br/wp-content/uploads/2024/03/jensen-huang-keynote-gtc-2024.jpg",
    bio: "Fundador e CEO da NVIDIA. Visionário que transformou a computação gráfica em inteligência artificial acelerada, liderando a empresa que hoje sustenta toda a infraestrutura global de IA.",
    icon: Cpu
  },
  {
    name: "Sam Altman",
    title: "CEO OpenAI",
    quote: "A inteligência artificial será o maior multiplicador de progresso da história da humanidade. O impacto é inevitável.",
    videoUrl: "https://www.youtube.com/embed/k96D3V99vR0?autoplay=1",
    thumbnail: "https://www.cnnbrasil.com.br/wp-content/uploads/sites/12/2023/11/sam-altman-e1700687784381.jpg",
    bio: "CEO da OpenAI e criador do ChatGPT. Considerado uma das mentes mais brilhantes do Vale do Silício, está à frente da missão de garantir que a IA beneficie toda a humanidade.",
    icon: Brain
  }
];

export default function SocialProofSection() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<typeof influencers[0] | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-8 pointer-events-auto">
      <div className="mb-4 md:mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-2 md:mb-4">
          <Quote size={10} className="text-accent" />
          <span className="text-white/40 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-bold">Vozes do Mercado</span>
        </div>
        <h2 className="text-xl md:text-4xl font-serif text-white mb-1 md:mb-2 leading-tight">
          Vozes da <span className="italic font-normal text-white/50 text-glow-accent">Evolução.</span>
        </h2>
      </div>

      {/* Grid for 3 items - perfectly centered */}
      <div className="flex overflow-x-auto pb-6 md:pb-0 md:grid md:grid-cols-3 gap-4 md:gap-8 no-scrollbar snap-x snap-mandatory">
        {influencers.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              onClick={() => setSelectedInfluencer(item)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative h-[340px] md:h-[420px] w-[280px] md:w-auto shrink-0 snap-center rounded-2xl overflow-hidden border border-white/5 bg-white/5 cursor-pointer hover:border-accent/30 transition-all duration-500"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={item.thumbnail} 
                  className="w-full h-full object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-20 grayscale-0"
                  alt={item.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 z-10 p-5 md:p-8 flex flex-col justify-end">
                <div className="mb-3 md:mb-6">
                  <div className="p-2 w-fit rounded-lg bg-accent/10 border border-accent/20 mb-3 md:mb-4">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <p className="text-white text-sm md:text-lg font-serif leading-relaxed italic">
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
          );
        })}
      </div>
      
      <VideoModal 
        isOpen={!!selectedInfluencer} 
        onClose={() => setSelectedInfluencer(null)} 
        videoUrl={selectedInfluencer?.videoUrl || ''} 
        title={selectedInfluencer?.name || ''}
        bio={selectedInfluencer?.bio}
      />

      <div className="mt-6 md:mt-12 text-center text-white/10 text-[6px] md:text-[8px] uppercase tracking-[0.4em] font-black">
        CONSCIÊNCIA COLETIVA • OBSOLESCÊNCIA: <span className="text-red-500/30">CRÍTICO</span>
      </div>
    </div>
  );
}
