import { useState, useCallback, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Headset, Brain, TrendingUp, Zap, Clock, ShieldCheck, Target, Sparkles, Loader2 } from 'lucide-react';
import CyberpunkScene from '../components/CyberpunkScene';
import DataWave3D from '../components/DataWave3D';
import NarrativeScroll from '../components/NarrativeScroll';
import EliteHUD from '../components/EliteHUD';

// Lazy load heavy components
const AIChatAgent = lazy(() => import('../components/AIChatAgent'));
const PotentialDiagnostic = lazy(() => import('../components/PotentialDiagnostic'));
const SocialProofSection = lazy(() => import('../components/SocialProofSection'));
const ConsultantSection = lazy(() => import('../components/ConsultantSection'));

// ─── Scene 0: THE HOOK ───────────────────────────────────────────────────────
function SceneHero({ onStartDiagnostic }: { onStartDiagnostic: () => void }) {
  const searchParams = new URLSearchParams(window.location.search);
  const ref = searchParams.get('ref')?.toLowerCase();
  
  let headline = (
    <>
      O Tsunami da IA está chegando! <br className="hidden md:block" />
      <span className="text-glow-accent italic font-normal text-white/90">É o fim da ineficiência humana.</span>
    </>
  );

  if (ref === 'industria') {
    headline = (
      <>
        Sua <span className="text-glow-accent italic font-normal text-white/90">produção manual</span> <br className="hidden md:block" />
        é o gargalo que vai <br className="hidden md:block" />
        te afogar.
      </>
    );
  } else if (ref === 'servicos') {
    headline = (
      <>
        Vender <span className="text-glow-accent italic font-normal text-white/90">horas humanas</span> <br className="hidden md:block" />
        é um modelo de negócio <br className="hidden md:block" />
        com os dias contados.
      </>
    );
  } else if (ref === 'varejo') {
    headline = (
      <>
        O <span className="text-glow-accent italic font-normal text-white/90">estoque parado</span> <br className="hidden md:block" />
        não é seu único custo. <br className="hidden md:block" />
        A ineficiência é.
      </>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 shadow-xl"
      >
        <Target className="text-accent animate-pulse" size={14} />
        <span className="text-white/60 font-sans tracking-[0.2em] uppercase text-[9px] md:text-[10px] font-bold">
          {ref ? `Estratégia para ${ref.toUpperCase()}` : 'Exclusivo para Empresas de R$ 100k+'}
        </span>
      </motion.div>

      <h1 className="heading-hero mb-6 text-white tracking-tight">
        {headline}
      </h1>

      <p className="text-base md:text-xl text-muted max-w-2xl mb-10 font-sans font-light leading-relaxed px-2">
        A ineficiência é o imposto invisível que você paga todos os dias. Seu negócio está pronto para navegar — ou será submergido?
      </p>

      <div className="flex flex-col items-center gap-4 w-full sm:w-auto pointer-events-auto">
        <button
          onClick={onStartDiagnostic}
          className="w-full sm:w-auto group px-8 py-5 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:bg-accent hover:shadow-[0_0_40px_rgba(0,229,255,0.3)] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          <span>Garantir minha Alavancagem</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
        </button>
        <p className="text-white/20 text-[9px] tracking-[0.3em] uppercase font-bold">Role para aceitar a verdade</p>
      </div>
    </div>
  );
}

// ─── Scene 1: THE LEVERAGE ───────────────────────────────────────────────────

// ─── Scene 1: THE POSSIBILITIES ──────────────────────────────────────────────
const services = [
  {
    title: 'Concierges Inteligentes 24/7',
    desc: 'Sites que não apenas informam, mas vendem. Agentes responsivos que qualificam e convertem leads enquanto você dorme.',
    icon: Bot,
    big: true,
  },
  {
    title: 'Criativos & Campanhas IA',
    desc: 'Produção em escala de criativos para redes sociais e vídeos de campanha usando as IAs generativas mais avançadas do mundo.',
    icon: Sparkles,
  },
  {
    title: 'Otimização SEO & GEO',
    desc: 'Não basta estar no Google. Sua empresa precisa ser a primeira resposta para IAs (Gemini, Perplexity, GPT).',
    icon: Zap,
  },
  {
    title: 'Automação de Processos',
    desc: 'Elimine tarefas repetitivas e erros humanos. IA integrada ao seu workflow operacional.',
    icon: Brain,
  },
  {
    title: 'Estratégia Full-Stack',
    desc: 'Implementação de ponta a ponta: do diagnóstico técnico ao agente em produção.',
    icon: TrendingUp,
  },
];

function SceneServices() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 pointer-events-auto">
      <div className="mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md mb-4 font-sans">
          <Zap size={12} className="text-accent" />
          <span className="text-accent text-[9px] uppercase tracking-[0.2em] font-bold">O Novo Moat Digital</span>
        </div>
        <h2 className="heading-section text-white">
          Sua empresa alinhada <br className="hidden md:block" />
          <span className="italic font-normal text-white/50">com a nova era.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto relative">
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

// ─── Scene 3: THE TIMING ─────────────────────────────────────────────────────
const stats = [
  { number: '1%', text: 'É o custo de um Agente de IA comparado a um funcionário sênior com a mesma produtividade.' },
  { number: '24/7', text: 'Sua empresa operando em velocidade máxima enquanto seus concorrentes dormem.' },
  { number: 'HOJE', text: 'O timing é a única variável que você não consegue comprar depois que ela passa.' },
];

function SceneStats() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 pointer-events-auto">
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

// ─── Scene 6: THE OFFER ──────────────────────────────────────────────────────
function SceneCTA({ onFinalContact }: { onFinalContact: (data: any) => void }) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col items-center text-center pointer-events-auto py-10 md:py-0">
      <div className="w-full mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 mb-6">
          <Clock size={12} className="text-accent" />
          <span className="text-accent text-[9px] uppercase tracking-widest font-bold">Vagas limitadas por mês</span>
        </div>
        
        <h2 className="heading-section text-white mb-4">
          Você vai surfar ou<br />
          <span className="italic font-normal text-glow-accent text-white/90">se afogar?</span>
        </h2>
        
        <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto font-sans font-light leading-relaxed">
          Inicie a conversa com nosso Agente para descobrir seu Potencial de Alavancagem.
        </p>
      </div>

      <AIChatAgent onComplete={onFinalContact} />
      
      <div className="mt-12 flex items-center gap-2 text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold">
        <ShieldCheck size={14} className="text-accent/40" />
        <span>Sessão gratuita para faturamento R$ 100k+</span>
      </div>
    </div>
  );
}


// ─── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [waveProgress, setWaveProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const [requestedScene, setRequestedScene] = useState<number | undefined>(undefined);

  const handleWaveProgress = useCallback((p: number) => {
    setWaveProgress(p);
  }, []);

  const handleSceneChange = useCallback((index: number) => {
    setActiveScene(index);
    
    const titles = [
      "RIA — A Ameaça Silenciosa",
      "RIA — O Mercado está Mudando",
      "RIA — Diagnóstico de Saúde Digital",
      "RIA — Possibilidades Infinitas",
      "RIA — O Momento é Agora",
      "RIA — Seu Consultor",
      "RIA — Estratégia de Defesa"
    ];
    if (titles[index]) {
      document.title = titles[index];
    }
    setRequestedScene(undefined);
  }, []);

  const handleFinalContact = useCallback((data: any) => {
    const message = `Olá! Realizei o diagnóstico via chat RIA.%0A%0A👤 Nome: ${data.name}%0A💰 Faturamento: R$ ${data.revenue.toLocaleString()}/mês%0A💸 ROI Projetado: R$ ${data.roi.toLocaleString()}/ano%0A🚀 Eficiência: +${data.efficiency}%25%0A%0AQuero agendar minha sessão estratégica para escalar esses números.`;
    window.open(`https://wa.me/5516997879837?text=${message}`, '_blank');
  }, []);

  const scenes = [
    { id: 0, waveProgress: 0,    content: <SceneHero onStartDiagnostic={() => setRequestedScene(6)} /> },
    { id: 1, waveProgress: 0.15, content: <Suspense fallback={<Loader2 className="animate-spin text-accent" />}><SocialProofSection /></Suspense> },
    { id: 2, waveProgress: 0.35, content: <Suspense fallback={<Loader2 className="animate-spin text-accent" />}><PotentialDiagnostic /></Suspense> },
    { id: 3, waveProgress: 0.55, content: <SceneServices /> },
    { id: 4, waveProgress: 0.70, content: <SceneStats /> },
    { id: 5, waveProgress: 0.85, content: <Suspense fallback={<Loader2 className="animate-spin text-accent" />}><ConsultantSection /></Suspense> },
    { id: 6, waveProgress: 1.0,  content: <Suspense fallback={<Loader2 className="animate-spin text-accent" />}><SceneCTA onFinalContact={handleFinalContact} /></Suspense> },
  ];

  return (
    <div className="bg-[#010408] min-h-screen text-white font-sans selection:bg-accent/30 selection:text-white overflow-hidden" style={{ height: '100vh' }}>
      <CyberpunkScene activeScene={activeScene} />
      <DataWave3D waveProgress={waveProgress} />
      <div className="fixed inset-0 z-20 vignette-overlay pointer-events-none" />
      
      <EliteHUD />
      <div className="scanline" />
      
      <NarrativeScroll 
        scenes={scenes} 
        onWaveProgress={handleWaveProgress} 
        onSceneChange={handleSceneChange}
        externalActiveScene={requestedScene}
      />

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
