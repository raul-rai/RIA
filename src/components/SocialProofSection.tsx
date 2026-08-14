import { useState } from 'react';
import { motion } from 'motion/react';
import { Quote, Play, TrendingUp, Cpu, Check, ShieldAlert } from 'lucide-react';
import VideoModal from './VideoModal';
import { useVulnerability } from '../context/VulnerabilityContext';

const influencers = [
  {
    id: 0,
    name: "Ricardo Amorim",
    title: "Economista & Estrategista",
    quote: "A IA não é o futuro, é a sobrevivência do presente. Quem não se adaptar agora será engolido pelo mercado.",
    checkboxLabel: "Estou ciente de que a IA não é o futuro, mas sim a sobrevivência do presente.",
    videoUrl: "https://www.youtube.com/embed/4ZRJCW9CSvE?autoplay=1",
    thumbnail: "/autoridades/ricardo-amorim.webp",
    bio: "Economista mais influente do Brasil segundo a Forbes, apresentador do Manhattan Connection e LinkedIn Top Voice. Com mais de 20 anos no mercado financeiro global, é a voz mais respeitada sobre transformações econômicas e tecnológicas no país.",
    icon: TrendingUp,
    startTime: 0,
    endTime: 154
  },
  {
    id: 1,
    name: "Silvio Meira",
    title: "Cientista Chefe TDS",
    quote: "A Inteligência Artificial emerge não como uma simples ferramenta, mas como uma força estratégica - uma nova dimensão da inteligência para os negócios.",
    checkboxLabel: "Estou ciente de que a IA é uma força estratégica indispensável para os negócios.",
    videoUrl: "https://www.youtube.com/embed/tcmntVEQr2o?autoplay=1",
    thumbnail: "/autoridades/silvio-meira.webp",
    bio: "Um dos fundadores do CESAR (Centro de Estudos e Sistemas Avançados do Recife) e Cientista Chefe da TDS Company. Uma das maiores referências em engenharia de software e inovação digital do Brasil.",
    icon: Cpu,
    startTime: 1378,
    endTime: 1438
  },
  {
    id: 2,
    name: "Flávio Augusto",
    title: "Fundador Wiser Educação",
    quote: "A Inteligência Artificial não é um hype, é a maior alavanca de eficiência do nosso tempo. O mercado recompensa a eficiência e não perdoa a inércia.",
    checkboxLabel: "Estou ciente de que o mercado recompensa a eficiência e não perdoa a inércia.",
    videoUrl: "https://www.youtube.com/embed/a1MVf8eGlG8?autoplay=1",
    thumbnail: "/autoridades/flavio-augusto.webp",
    bio: "Um dos empreendedores mais bem-sucedidos do Brasil, fundador da Wiser Educação (Wise Up) e ex-dono do Orlando City. Referência absoluta em vendas, gestão e escala de negócios no país.",
    icon: TrendingUp
  }
];

export default function SocialProofSection() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<typeof influencers[0] | null>(null);
  const { awarenessChecks, toggleAwarenessCheck } = useVulnerability();
  const vistos = awarenessChecks.filter(Boolean).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16 pointer-events-auto flex flex-col justify-center">
      {/* Header */}
      <div className="mb-6 md:mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 mb-3">
          <ShieldAlert size={14} className="text-amber-600" />
          <span className="text-amber-800 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Vozes do mercado
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 mb-2 leading-tight">
          Não é só a <span className="italic font-normal text-slate-500">nossa opinião.</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Três das vozes mais ouvidas do mercado brasileiro, falando sobre a mesma coisa.
          {vistos > 0 && (
            <span className="block mt-1 text-slate-500 font-mono text-[11px] tracking-wider">
              {vistos} de 3 marcados
            </span>
          )}
        </p>
      </div>

      {/* Cards Grid / Mobile Carousel */}
      <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-4 md:gap-6 no-scrollbar snap-x snap-mandatory max-w-5xl mx-auto w-full">
        {influencers.map((item, i) => {
          const Icon = item.icon;
          const isChecked = awarenessChecks[i];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`group relative flex flex-col justify-between w-[85vw] sm:w-[320px] md:w-auto shrink-0 snap-center rounded-2xl overflow-hidden border bg-white shadow-md transition-all duration-500 ${
                isChecked
                  ? 'border-emerald-400 ring-2 ring-emerald-400/20 shadow-emerald-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xl'
              }`}
            >
              {/* Top Video Trigger Area */}
              <div 
                onClick={() => setSelectedInfluencer(item)}
                className="relative h-48 md:h-52 overflow-hidden cursor-pointer bg-slate-950"
              >
                <img
                  src={item.thumbnail}
                  loading="lazy"
                  decoding="async"
                  width={640}
                  height={416}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  style={{ objectPosition: "center top" }}
                  alt={item.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Icon Badge */}
                <div className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white">
                  <Icon size={14} />
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest font-bold block mb-0.5">
                    {item.title}
                  </span>
                  <h3 className="text-white text-sm md:text-base font-bold">{item.name}</h3>
                </div>
              </div>

              {/* Quote & Interactive Checkbox Body */}
              <div className="p-4 md:p-5 flex flex-col justify-between flex-1 bg-white">
                <blockquote className="text-slate-600 text-xs italic mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{item.quote}"
                </blockquote>

                {/* Interactive Checkbox */}
                <div
                  onClick={() => toggleAwarenessCheck(i)}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-[11px] md:text-xs font-semibold block leading-tight">
                      {item.checkboxLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                      {isChecked ? '✓ Marcado' : 'Marcar se você concorda'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Declaracoes publicas sobre IA em geral — nao endosso a RIA. Dizer isso
          protege a marca e nao custa nada em conversao. */}
      <p className="text-[10px] md:text-[11px] text-slate-500 text-center mt-5 max-w-2xl mx-auto leading-relaxed bg-white/80 rounded-lg px-3 py-2">
        Declarações públicas sobre inteligência artificial no mercado brasileiro. Não constituem
        endosso, parceria ou recomendação da RIA.
      </p>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={!!selectedInfluencer} 
        onClose={() => setSelectedInfluencer(null)} 
        videoUrl={selectedInfluencer?.videoUrl || ''} 
        title={selectedInfluencer?.name || ''}
        bio={selectedInfluencer?.bio}
        startTime={selectedInfluencer?.startTime}
        endTime={selectedInfluencer?.endTime}
      />
    </div>
  );
}
