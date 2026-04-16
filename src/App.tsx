import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Bot, Headset, Brain, TrendingUp, Zap } from 'lucide-react';
import { WHATSAPP_URL_HERO, WHATSAPP_URL_CTA } from './constants/links';
import CyberpunkScene from './components/CyberpunkScene';
import DataWave3D from './components/DataWave3D';
import NarrativeScroll from './components/NarrativeScroll';

// ─── Scene 0: HERO ───────────────────────────────────────────────────────────
function SceneHero() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-2xl">
        <Sparkles className="text-accent animate-pulse" size={14} />
        <span className="text-muted font-sans tracking-[0.2em] uppercase text-[10px] md:text-xs font-semibold">
          O Próximo Salto da Evolução Empresarial
        </span>
      </div>

      <h1 className="text-[40px] md:text-[60px] lg:text-[80px] font-serif leading-[1.1] mb-8 text-white tracking-tight">
        A IA não é uma onda.
        <br />
        <span className="text-glow-accent italic font-normal">É o tsunami.</span>
      </h1>

      <p className="text-lg md:text-xl text-muted max-w-2xl mb-12 font-sans font-light leading-relaxed">
        Seu negócio está pronto para navegar — ou será submergido? Nós construímos sistemas de IA que colocam sua empresa na liderança.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-5 pointer-events-auto">
        <a
          href={WHATSAPP_URL_HERO}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto group px-10 py-5 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:bg-accent hover:shadow-[0_0_60px_rgba(0,229,255,0.4)] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          <span>Iniciar Transformação</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
        </a>
        <p className="text-white/30 text-xs tracking-widest uppercase">role para ver a onda chegar</p>
      </div>
    </div>
  );
}

// ─── Scene 1: SERVICES (Bento) ────────────────────────────────────────────────
const services = [
  {
    title: 'Agentes de Vendas (SDR)',
    desc: 'IA que prospecta, qualifica e agenda reuniões 24h por dia, 7 dias por semana.',
    icon: Bot,
    big: true,
  },
  {
    title: 'Atendimento Inteligente',
    desc: 'Suporte imediato e humanizado via WhatsApp, Instagram e site.',
    icon: Headset,
    big: false,
  },
  {
    title: 'Inteligência de Mercado',
    desc: 'Análise preditiva de dados para decisões antes do concorrente.',
    icon: Brain,
    big: false,
  },
  {
    title: 'IA Personalizada',
    desc: 'Soluções sob medida integradas aos seus processos atuais.',
    icon: TrendingUp,
    big: false,
  },
];

function SceneServices() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 backdrop-blur-md mb-4">
          <Zap size={12} className="text-accent" />
          <span className="text-accent text-[10px] uppercase tracking-widest font-semibold">Nossas Soluções</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-serif text-white">
          O que a IA pode fazer<br />
          <span className="italic font-normal text-white/60">pelo seu negócio agora.</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className={`premium-glass rounded-2xl p-5 border border-white/10 hover:border-accent/40 transition-all duration-500 ${
                s.big ? 'col-span-2 md:col-span-2 row-span-1' : 'col-span-1'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{s.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene 2: STATS ───────────────────────────────────────────────────────────
const stats = [
  { number: '73%', text: 'das empresas que adotam IA relatam vantagem competitiva em menos de 6 meses.' },
  { number: '37%', text: 'crescimento anual do mercado global de IA — o Brasil está acelerando.' },
  { number: '<2 anos', text: 'é o que separa os líderes de mercado dos que ficaram para trás.' },
];

function SceneStats() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-16 text-center">
        A janela está aberta.<br />
        <span className="italic font-normal text-white/50">Por enquanto.</span>
      </h2>
      <div className="grid md:grid-cols-3 gap-12">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="text-5xl md:text-6xl lg:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-accent to-white mb-4">
              {s.number}
            </div>
            <p className="text-white/50 text-base font-light leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scene 3: CTA FINAL ───────────────────────────────────────────────────────
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
      <div className="premium-glass rounded-3xl p-10 md:p-16 border border-white/10 backdrop-blur-xl w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
          Sua empresa<br />
          <span className="italic font-normal text-glow-accent">do lado certo</span><br />
          da onda.
        </h2>
        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto font-light">
          Uma sessão estratégica gratuita de 30 minutos. Sem enrolação, sem pitch genérico.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
          <a
            href={WHATSAPP_URL_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="group px-10 py-5 bg-accent text-black rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:shadow-[0_0_80px_rgba(0,229,255,0.5)] flex items-center justify-center gap-3 active:scale-95"
          >
            <span>Agendar Sessão Gratuita</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const SCENES = [
  { id: 0, waveProgress: 0,    content: <SceneHero /> },
  { id: 1, waveProgress: 0.30, content: <SceneServices /> },
  { id: 2, waveProgress: 0.60, content: <SceneStats /> },
  { id: 3, waveProgress: 1.0,  content: <SceneCTA /> },
];

export default function App() {
  const [waveProgress, setWaveProgress] = useState(0);

  const handleWaveProgress = useCallback((p: number) => {
    setWaveProgress(p);
  }, []);

  return (
    <div
      className="bg-[#000408] min-h-screen text-white font-sans selection:bg-primary/30 selection:text-white overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* Layer 0: Static cyberpunk diorama (city + people + sea) */}
      <CyberpunkScene />

      {/* Layer 1: The living wave */}
      <DataWave3D waveProgress={waveProgress} />

      {/* Layer 2: The narrative orchestrator — scenes + scroll hijacking */}
      <NarrativeScroll scenes={SCENES} onWaveProgress={handleWaveProgress} />

      {/* Tiny logo watermark in top-left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed top-6 left-6 z-30 pointer-events-none"
      >
        <span className="text-white/40 text-xs tracking-[0.3em] uppercase font-sans">RIA</span>
      </motion.div>

      {/* Noise grain texture overlay */}
      <div className="fixed inset-0 z-30 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
