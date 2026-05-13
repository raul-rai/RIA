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
    thumbnail: "https://commons.wikimedia.org/wiki/Special:FilePath/Ricardo_Amorim_1.jpg",
    bio: "Economista mais influente do Brasil segundo a Forbes, apresentador do Manhattan Connection e LinkedIn Top Voice. Com mais de 20 anos no mercado financeiro global, é a voz mais respeitada sobre transformações econômicas e tecnológicas no país.",
    icon: TrendingUp,
    startTime: 0,
    endTime: 154
  },
  {
    name: "Silvio Meira",
    title: "Cientista Chefe TDS",
    quote: "A Inteligência Artificial emerge não como uma simples ferramenta, mas como uma força estratégica - uma nova dimensão da inteligência para os negócios.",
    videoUrl: "https://www.youtube.com/embed/tcmntVEQr2o?autoplay=1",
    thumbnail: "https://commons.wikimedia.org/wiki/Special:FilePath/Silvio_Meira_0038.jpg",
    bio: "Um dos fundadores do CESAR (Centro de Estudos e Sistemas Avançados do Recife) e Cientista Chefe da TDS Company. Uma das maiores referências em engenharia de software e inovação digital do Brasil.",
    icon: Cpu,
    startTime: 1378,
    endTime: 1438
  },
  {
    name: "Flávio Augusto",
    title: "Fundador Wiser Educação",
    quote: "A Inteligência Artificial não é um hype, é a maior alavanca de eficiência do nosso tempo. O mercado recompensa a eficiência e não perdoa a inércia.",
    videoUrl: "https://www.youtube.com/embed/a1MVf8eGlG8?autoplay=1",
    thumbnail: "https://commons.wikimedia.org/wiki/Special:FilePath/Fl%C3%A1vio_Augusto_(cropped).jpg",
    bio: "Um dos empreendedores mais bem-sucedidos do Brasil, fundador da Wiser Educação (Wise Up) e ex-dono do Orlando City. Referência absoluta em vendas, gestão e escala de negócios no país.",
    icon: TrendingUp
  }
];

export default function SocialProofSection() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<typeof influencers[0] | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 md:py-4 pointer-events-auto flex flex-col justify-center h-full">
      <div className="mb-4 md:mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-2">
          <Quote size={12} className="text-accent" />
          <span className="text-white/60 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">Vozes do Mercado</span>
        </div>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-serif text-white mb-1 leading-tight">
          Vozes da <span className="italic font-normal text-white/50 text-glow-accent">Evolução.</span>
        </h2>
      </div>

      {/* Grid for 3 items - perfectly centered */}
      <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-4 md:gap-6 no-scrollbar snap-x snap-mandatory max-w-5xl mx-auto w-full">
        {influencers.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              onClick={() => setSelectedInfluencer(item)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col justify-end w-[85vw] md:w-auto h-[55vh] min-h-[280px] max-h-[360px] shrink-0 snap-center rounded-2xl overflow-hidden border border-white/5 bg-white/5 cursor-pointer hover:border-accent/30 transition-all duration-500"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={item.thumbnail} 
                  className="w-full h-full object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-20"
                  style={{ objectPosition: "center top" }}
                  alt={item.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-5 md:p-6 flex flex-col h-full justify-end">
                <div className="mb-4">
                  <div className="p-1.5 w-fit rounded-lg bg-accent/10 border border-accent/20 mb-3">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <p className="text-white/90 text-sm md:text-[15px] font-serif leading-snug italic line-clamp-4">
                    "{item.quote}"
                  </p>
                </div>
                
                <div className="flex items-center gap-3 border-t border-white/10 pt-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs uppercase tracking-wider">{item.name}</span>
                    <span className="text-accent/80 text-[9px] uppercase font-medium">{item.title}</span>
                  </div>
                  <div className="ml-auto w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] group-hover:scale-110 transition-transform shrink-0">
                    <Play size={14} fill="currentColor" />
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
        startTime={selectedInfluencer?.startTime}
        endTime={selectedInfluencer?.endTime}
      />

      <div className="mt-4 md:mt-8 text-center text-white/40 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black px-4">
        CONSCIÊNCIA COLETIVA • OBSOLESCÊNCIA: <span className="text-red-500/80">CRÍTICO</span>
      </div>
    </div>
  );
}
