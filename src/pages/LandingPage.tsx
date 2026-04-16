import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Headset, Brain, TrendingUp, Zap, Clock, ShieldCheck, Target } from 'lucide-react';
import { WHATSAPP_URL_HERO, WHATSAPP_URL_CTA } from '../constants/links';
import CyberpunkScene from '../components/CyberpunkScene';
import DataWave3D from '../components/DataWave3D';
import NarrativeScroll from '../components/NarrativeScroll';

// ─── Scene 0: THE HOOK ───────────────────────────────────────────────────────
function SceneHero() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 shadow-xl"
      >
        <Target className="text-accent animate-pulse" size={14} />
        <span className="text-white/60 font-sans tracking-[0.2em] uppercase text-[9px] md:text-[10px] font-bold">
          Exclusivo para Empresas de R$ 100k+
        </span>
      </motion.div>

      <h1 className="heading-hero mb-6 text-white tracking-tight">
        Faturar R$ 100k/mês é o <br className="hidden md:block" />
        <span className="text-glow-accent italic font-normal text-white/90">nível mais perigoso</span> <br className="hidden md:block" />
        para se estar.
      </h1>

      <p className="text-base md:text-xl text-muted max-w-2xl mb-10 font-sans font-light leading-relaxed px-2">
        Você tem escala para ser notado, mas não tem a alavancagem para sobreviver ao que vem por aí. O Tsunami da IA não é um software novo, é o fim da ineficiência humana.
      </p>

      <div className="flex flex-col items-center gap-4 w-full sm:w-auto pointer-events-auto">
        <a
          href={WHATSAPP_URL_HERO}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto group px-8 py-5 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:bg-accent hover:shadow-[0_0_40px_rgba(0,229,255,0.3)] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          <span>Garantir minha Alavancagem</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
        </a>
        <p className="text-white/20 text-[9px] tracking-[0.3em] uppercase font-bold">Role para aceitar a verdade</p>
      </div>
    </div>
  );
}

// ─── Scene 1: THE LEVERAGE ───────────────────────────────────────────────────
const services = [
  {
    title: 'SDRs Digitais Incansáveis',
    desc: 'Esqueça o atrito de gerenciar humanos. Agentes que prospectam e qualificam 24h sem interrupção.',
    icon: Bot,
    big: true,
  },
  {
    title: 'Atendimento Pró-Ativo',
    desc: 'Sistemas que aprendem sobre seu produto e fecham vendas sozinhos.',
    icon: Headset,
  },
  {
    title: 'Inteligência Executiva',
    desc: 'Decisões baseadas em dados puros, não em palpites de gerentes.',
    icon: Brain,
  },
  {
    title: 'Escala sem Headcount',
    desc: 'Dobre seu faturamento sem precisar contratar um único funcionário novo.',
    icon: TrendingUp,
  },
];

function SceneServices() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md mb-4 font-sans">
          <Zap size={12} className="text-accent" />
          <span className="text-accent text-[9px] uppercase tracking-[0.2em] font-bold">O Novo Moat Digital</span>
        </div>
        <h2 className="heading-section text-white">
          Humanos não escalam. <br className="hidden md:block" />
          <span className="italic font-normal text-white/50">Sistemas de Inteligência sim.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className={`premium-glass rounded-2xl p-6 md:p-5 border border-white/5 transition-all duration-500 overflow-hidden ${
                s.big ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 mb-4">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="text-white font-serif text-lg md:text-base mb-2">{s.title}</h3>
              <p className="text-white/40 text-xs md:text-[11px] leading-relaxed font-sans">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene 2: THE TIMING ─────────────────────────────────────────────────────
const stats = [
  { number: '1%', text: 'É o custo de um Agente de IA comparado a um funcionário sênior com a mesma produtividade.' },
  { number: '24/7', text: 'Sua empresa operando em velocidade máxima enquanto seus concorrentes dormem.' },
  { number: 'Hox', text: 'O timing é a única variável que você não consegue comprar depois que ela passa.' },
];

function SceneStats() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <h2 className="heading-section text-white mb-12 md:mb-20 text-center">
        A IA não vai te substituir.<br />
        <span className="italic font-normal text-white/40">Mas quem usa ela vai.</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 max-w-5xl mx-auto">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="text-5xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-accent to-white/20 mb-3 md:mb-6">
              {s.number}
            </div>
            <p className="text-white/50 text-base md:text-lg font-sans font-light leading-relaxed max-w-xs">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scene 3: THE OFFER ──────────────────────────────────────────────────────
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
      <div className="premium-glass rounded-[2.5rem] p-8 md:p-20 border border-white/10 backdrop-blur-2xl w-full relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-accent/20 blur-sm rounded-full" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 mb-8">
          <Clock size={12} className="text-accent" />
          <span className="text-accent text-[9px] uppercase tracking-widest font-bold">Vagas limitadas por mês</span>
        </div>
        
        <h2 className="heading-section text-white mb-6">
          Você vai surfar ou<br />
          <span className="italic font-normal text-glow-accent text-white/90">se afogar?</span>
        </h2>
        
        <p className="text-white/50 text-base md:text-xl mb-12 max-w-xl mx-auto font-sans font-light leading-relaxed">
          Agende sua Sessão Estratégica de 30min: Vamos desenhar seu Plano de Defesa e Ataque contra o Tsunami.
        </p>

        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          <a
            href={WHATSAPP_URL_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto group px-12 py-6 bg-accent text-black rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(0,229,255,0.4)] flex items-center justify-center gap-3 active:scale-95"
          >
            <span>Montar meu Plano Agora</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
          
          <div className="flex items-center gap-2 text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold">
            <ShieldCheck size={14} className="text-accent/40" />
            <span>Sessão gratuita para faturamento R$ 100k+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SCENES = [
  { id: 0, waveProgress: 0,    content: <SceneHero /> },
  { id: 1, waveProgress: 0.35, content: <SceneServices /> },
  { id: 2, waveProgress: 0.65, content: <SceneStats /> },
  { id: 3, waveProgress: 1.0,  content: <SceneCTA /> },
];

export default function LandingPage() {
  const [waveProgress, setWaveProgress] = useState(0);

  const handleWaveProgress = useCallback((p: number) => {
    setWaveProgress(p);
  }, []);

  return (
    <div className="bg-[#010408] min-h-screen text-white font-sans selection:bg-accent/30 selection:text-white overflow-hidden" style={{ height: '100vh' }}>
      <CyberpunkScene />
      <DataWave3D waveProgress={waveProgress} />
      <div className="fixed inset-0 z-20 vignette-overlay pointer-events-none" />
      
      <NarrativeScroll scenes={SCENES} onWaveProgress={handleWaveProgress} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed top-8 left-8 z-30 pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-[1px] bg-accent/40" />
          <span className="text-white/40 text-[10px] tracking-[0.5em] uppercase font-black">RIA • ELITE</span>
        </div>
      </motion.div>

      <div className="fixed inset-0 z-40 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
