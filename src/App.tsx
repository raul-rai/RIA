import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Bot, Headset, Brain, TrendingUp, Zap, Clock, ShieldCheck, Target } from 'lucide-react';
import { WHATSAPP_URL_HERO, WHATSAPP_URL_CTA } from './constants/links';
import CyberpunkScene from './components/CyberpunkScene';
import DataWave3D from './components/DataWave3D';
import NarrativeScroll from './components/NarrativeScroll';

// ─── Scene 0: THE HOOK ───────────────────────────────────────────────────────
function SceneHero() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-2xl">
        <Target className="text-accent animate-pulse" size={14} />
        <span className="text-muted font-sans tracking-[0.2em] uppercase text-[10px] md:text-xs font-semibold">
          Exclusivo para Empresas de R$ 100k+
        </span>
      </div>

      <h1 className="text-[40px] md:text-[60px] lg:text-[75px] font-serif leading-[1.1] mb-8 text-white tracking-tight">
        Faturar R$ 100k/mês é o <br className="hidden md:block" />
        <span className="text-glow-accent italic font-normal">nível mais perigoso</span> <br className="hidden md:block" />
        para se estar.
      </h1>

      <p className="text-lg md:text-xl text-muted max-w-2xl mb-12 font-sans font-light leading-relaxed">
        Você tem escala para ser notado, mas não tem a alavancagem para sobreviver ao que vem por aí. O Tsunami da IA não é um software novo, é o fim da ineficiência humana.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-5 pointer-events-auto">
        <a
          href={WHATSAPP_URL_HERO}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto group px-10 py-5 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:bg-accent hover:shadow-[0_0_60px_rgba(0,229,255,0.4)] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          <span>Garantir minha Alavancagem</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
        </a>
        <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-semibold">Role se você aceita a verdade</p>
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
    big: false,
  },
  {
    title: 'Inteligência Executiva',
    desc: 'Decisões baseadas em dados puros, não em palpites de gerentes.',
    icon: Brain,
    big: false,
  },
  {
    title: 'Escala sem Headcount',
    desc: 'Dobre seu faturamento sem precisar contratar um único funcionário novo.',
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
          <span className="text-accent text-[10px] uppercase tracking-widest font-semibold">O Novo Moat Digital</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-serif text-white">
          Humanos não escalam. <br />
          <span className="italic font-normal text-white/60">Sistemas de Inteligência sim.</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className={`premium-glass rounded-2xl p-5 border border-white/10 transition-all duration-500 hover:bg-white/5 ${
                s.big ? 'col-span-2 md:col-span-2 row-span-1' : 'col-span-1'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{s.title}</h3>
              <p className="text-white/50 text-[11px] leading-relaxed">{s.desc}</p>
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
  { number: '24/7', text: 'Sua empresa operando em velocidade máxima enquanto seus concorrentes ainda estão dormindo.' },
  { number: 'Hox', text: 'O timming é a única variável que você não consegue comprar depois que ela passa.' },
];

function SceneStats() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-16 text-center leading-tight">
        A IA não vai te substituir.<br />
        <span className="italic font-normal text-white/50">Mas quem usa ela vai.</span>
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

// ─── Scene 3: THE OFFER ──────────────────────────────────────────────────────
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
      <div className="premium-glass rounded-3xl p-10 md:p-16 border border-white/10 backdrop-blur-xl w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 mb-6">
          <Clock size={12} className="text-accent" />
          <span className="text-accent text-[9px] uppercase tracking-widest font-bold">Vagas limitadas por mês</span>
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
          Você vai surfar ou<br />
          <span className="italic font-normal text-glow-accent">se afogar?</span>
        </h2>
        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto font-light">
          Agende sua Sessão Estratégica de 30min: Vamos desenhar seu Plano de Defesa e Ataque contra o Tsunami.
        </p>
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          <a
            href={WHATSAPP_URL_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="group px-10 py-5 bg-accent text-black rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:shadow-[0_0_80px_rgba(0,229,255,0.5)] flex items-center justify-center gap-3 active:scale-95"
          >
            <span>Montar meu Plano Agora</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
          </a>
          <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase tracking-[0.2em]">
            <ShieldCheck size={12} />
            <span>Gratuito para faturamento R$ 100k+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const SCENES = [
  { id: 0, waveProgress: 0,    content: <SceneHero /> },
  { id: 1, waveProgress: 0.35, content: <SceneServices /> },
  { id: 2, waveProgress: 0.65, content: <SceneStats /> },
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
      <CyberpunkScene />
      <DataWave3D waveProgress={waveProgress} />
      <NarrativeScroll scenes={SCENES} onWaveProgress={handleWaveProgress} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed top-6 left-6 z-30 pointer-events-none"
      >
        <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">RIA • Elite AI</span>
      </motion.div>

      <div className="fixed inset-0 z-30 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
