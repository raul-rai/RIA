import { useState, useCallback } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, Bot, Headset, Brain, TrendingUp, Zap, Clock, ShieldCheck, Target, Sparkles, Search, MapPin, Paintbrush, Video, Layout, Settings } from 'lucide-react';
import CyberpunkScene from '../components/CyberpunkScene';
import DataWave3D from '../components/DataWave3D';
import NarrativeScroll from '../components/NarrativeScroll';
import EliteHUD from '../components/EliteHUD';

import AIChatAgent from '../components/AIChatAgent';
import PotentialDiagnostic from '../components/PotentialDiagnostic';
import SocialProofSection from '../components/SocialProofSection';
import ConsultantSection from '../components/ConsultantSection';
import { whatsappWithMessage } from '../constants/links';

function MagneticButton({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX * 0.2); 
    y.set(mouseY * 0.2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      style={{ x: mouseXSpring, y: mouseYSpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ─── Scene 0: THE HOOK ───────────────────────────────────────────────────────
function SceneHero({ onStartDiagnostic }: { onStartDiagnostic: () => void }) {
  const searchParams = new URLSearchParams(window.location.search);
  const ref = searchParams.get('ref')?.toLowerCase();

  const animatedText = (text: string, isAccent?: boolean) => (
    <span className={isAccent ? "text-glow-accent italic font-normal text-white/90" : ""}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={word + i}
          variants={{
            hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" }
          }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mr-[0.25em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
  
  let headline = (
    <>
      <span className="block pb-2">{animatedText("O Tsunami da IA está chegando!")}</span>
      <span className="block pb-4">{animatedText("É o fim da ineficiência humana.", true)}</span>
    </>
  );

  if (ref === 'industria') {
    headline = (
      <>
        {animatedText("Sua")} {animatedText("produção manual", true)} <br className="hidden md:block" />
        {animatedText("é o gargalo que vai")} <br className="hidden md:block" />
        {animatedText("te afogar.")}
      </>
    );
  } else if (ref === 'servicos') {
    headline = (
      <>
        {animatedText("Vender")} {animatedText("horas humanas", true)} <br className="hidden md:block" />
        {animatedText("é um modelo de negócio")} <br className="hidden md:block" />
        {animatedText("com os dias contados.")}
      </>
    );
  } else if (ref === 'varejo') {
    headline = (
      <>
        {animatedText("O")} {animatedText("estoque parado", true)} <br className="hidden md:block" />
        {animatedText("não é seu único custo.")} <br className="hidden md:block" />
        {animatedText("A ineficiência é.")}
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
        <Target className="text-accent animate-pulse" size={16} />
        <span className="text-white/80 font-sans tracking-[0.2em] uppercase text-[10px] md:text-xs font-bold">
          {ref ? `Estratégia para ${ref.toUpperCase()}` : 'Exclusivo para Empresas de R$ 100k+'}
        </span>
      </motion.div>

      <motion.h1 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          hidden: {}
        }}
        className="heading-hero mb-6 text-white tracking-tight"
      >
        {headline}
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="text-base md:text-xl text-muted max-w-2xl mb-10 font-sans font-light leading-relaxed px-2"
      >
        A ineficiência é o imposto invisível que você paga todos os dias. Seu negócio está pronto para navegar — ou será submergido?
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="flex flex-col items-center gap-4 w-full sm:w-auto pointer-events-auto"
      >
        <MagneticButton
          onClick={onStartDiagnostic}
          className="w-full sm:w-auto group px-8 py-5 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-500 hover:bg-accent hover:shadow-[0_0_40px_rgba(0,229,255,0.3)] shadow-2xl flex items-center justify-center gap-3"
        >
          <span>Garantir minha Alavancagem</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
        </MagneticButton>
        <p className="text-white/40 text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold mt-2">Role para aceitar a verdade</p>
      </motion.div>
    </div>
  );
}

// ─── Scene 1: THE LEVERAGE ───────────────────────────────────────────────────

// ─── Scene 1: THE POSSIBILITIES ──────────────────────────────────────────────
const servicesNodes = [
  { label: 'SDR', icon: Bot },
  { label: 'Estratégia', icon: TrendingUp },
  { label: 'Sites', icon: Layout },
  { label: 'SEO', icon: Search },
  // Index 4 is reserved for Center
  { label: 'Criativos', icon: Paintbrush },
  { label: 'GEO', icon: MapPin },
  { label: 'Automação', icon: Settings },
  { label: 'Vídeos', icon: Video }
];

function SceneServices() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.15 } },
        hidden: {}
      }}
      className="w-full max-w-5xl mx-auto px-2 md:px-4 pointer-events-auto flex flex-col items-center justify-center h-full py-2 relative z-10"
    >
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
        }}
        className="mb-4 md:mb-8 text-center shrink-0"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md mb-2 md:mb-4 font-sans shadow-[0_0_20px_rgba(0,229,255,0.15)]">
          <Zap size={14} className="text-accent" />
          <span className="text-accent text-[9px] md:text-xs uppercase tracking-[0.2em] font-bold">Ecossistema Conectado</span>
        </div>
        <h2 className="text-xl md:text-4xl font-serif text-white mb-0 leading-tight drop-shadow-md">
          Sua empresa como o centro <br className="hidden md:block" />
          <span className="italic font-normal text-white/50">de uma rede inteligente.</span>
        </h2>
      </motion.div>

      {/* Grid Network Graph */}
      <div className="relative w-full max-w-4xl mx-auto mt-2 md:mt-4">
        {/* SVG Lines connecting center (50%, 50%) to the 8 grid cells */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0 overflow-visible">
          <defs>
            <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,229,255,0.1)" />
              <stop offset="50%" stopColor="rgba(0,229,255,0.8)" />
              <stop offset="100%" stopColor="rgba(0,229,255,0.1)" />
            </linearGradient>
          </defs>
          {[
            { x: '16.6%', y: '16.6%' }, { x: '50%', y: '16.6%' }, { x: '83.3%', y: '16.6%' },
            { x: '16.6%', y: '50%' }, /* Center skipped */       { x: '83.3%', y: '50%' },
            { x: '16.6%', y: '83.3%' }, { x: '50%', y: '83.3%' }, { x: '83.3%', y: '83.3%' }
          ].map((pos, i) => (
            <motion.line 
              key={`line-${i}`}
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, delay: 0.3 + i * 0.1 } }
              }}
              x1="50%" y1="50%" x2={pos.x} y2={pos.y} 
              stroke="url(#netGrad)" 
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          ))}
        </svg>

        {/* 3x3 Grid Layout */}
        <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-y-4 md:gap-y-8 gap-x-2 md:gap-x-4 place-items-center w-full px-2">
          {/* Row 1 */}
          <OrbitalNode node={servicesNodes[0]} delay={0.1} />
          <OrbitalNode node={servicesNodes[1]} delay={0.2} />
          <OrbitalNode node={servicesNodes[2]} delay={0.3} />

          {/* Row 2 */}
          <OrbitalNode node={servicesNodes[3]} delay={0.4} />
          {/* CENTER NODE */}
          <motion.div 
            variants={{
              hidden: { scale: 0, opacity: 0 },
              visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 100, delay: 0.2 } }
            }}
            className="w-24 h-24 md:w-36 md:h-36 shrink-0 rounded-full premium-glass border border-accent/60 flex items-center justify-center shadow-[0_0_60px_rgba(0,229,255,0.3)] bg-black/95 relative group"
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-accent" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="font-serif text-white text-[11px] md:text-sm font-bold tracking-widest uppercase text-center leading-tight whitespace-nowrap z-10">
              Sua<br/>Empresa
            </span>
          </motion.div>
          <OrbitalNode node={servicesNodes[4]} delay={0.5} />

          {/* Row 3 */}
          <OrbitalNode node={servicesNodes[5]} delay={0.6} />
          <OrbitalNode node={servicesNodes[6]} delay={0.7} />
          <OrbitalNode node={servicesNodes[7]} delay={0.8} />
        </div>
      </div>
    </motion.div>
  );
}

function OrbitalNode({ node, delay }: { node: any, delay: number }) {
  const Icon = node.icon;
  return (
    <motion.div
      variants={{
        hidden: { scale: 0, opacity: 0, y: 20 },
        visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", delay } }
      }}
      className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-full premium-glass border border-white/10 flex flex-col items-center justify-center shadow-lg bg-[#050505]/95 hover:border-accent/80 hover:bg-accent/10 hover:scale-110 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300 cursor-default group relative"
    >
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-accent/10 blur-xl transition-opacity duration-300" />
      <Icon size={20} className="text-accent mb-0.5 md:mb-1 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
      <span className="text-[9px] md:text-xs text-white/90 font-sans tracking-wide font-medium text-center leading-tight px-1 whitespace-nowrap z-10">
        {node.label}
      </span>
    </motion.div>
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.2 } },
        hidden: {}
      }}
      className="w-full max-w-5xl mx-auto px-4 pointer-events-auto"
    >
      <motion.h2 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
        }}
        className="heading-section text-white mb-12 md:mb-20 text-center"
      >
        A IA não vai te substituir.<br />
        <span className="italic font-normal text-white/40">Mas quem usa ela vai.</span>
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-14 max-w-5xl mx-auto">
        {stats.map((s, i) => (
          <motion.div 
            key={i}
            variants={{
              hidden: { opacity: 0, scale: 0.9, y: 20 },
              visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8 } }
            }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <div className="text-4xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-accent to-white/20 mb-2 md:mb-6">
              {s.number}
            </div>
            <p className="text-white/50 text-base md:text-lg font-sans font-light leading-relaxed max-w-xs">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Scene 6: THE OFFER ──────────────────────────────────────────────────────
function SceneCTA({ onFinalContact }: { onFinalContact: (data: any) => void }) {
  return (
    <div className="w-full flex-1 min-h-full max-w-5xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto pb-4">
      <div className="w-full mb-4 md:mb-8 mt-2 md:mt-0">
        <h2 className="text-3xl md:text-5xl font-serif text-white mb-2 md:mb-4">
          Você vai surfar ou <span className="italic font-normal text-glow-accent text-white/90">se afogar?</span>
        </h2>
        <p className="text-white/50 text-xs md:text-base max-w-xl mx-auto font-sans font-light leading-relaxed hidden md:block">
          Inicie a conversa com nosso Agente para descobrir seu Potencial de Alavancagem.
        </p>
      </div>

      <div className="w-full flex-1 max-h-[65vh] md:max-h-[600px] mb-8">
        <AIChatAgent onComplete={onFinalContact} />
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
    const message = [
      'Ola! Realizei o diagnostico via chat RIA.',
      '',
      `Nome: ${data.name}`,
      `Faturamento: R$ ${data.revenue.toLocaleString()}/mes`,
      `ROI Projetado: R$ ${data.roi.toLocaleString()}/ano`,
      `Eficiencia: +${data.efficiency}%`,
      '',
      'Quero agendar minha sessao estrategica para escalar esses numeros.',
    ].join('\n');
    window.open(whatsappWithMessage(message), '_blank');
  }, []);

  const scenes = [
    { id: 0, waveProgress: 0,    content: <SceneHero onStartDiagnostic={() => setRequestedScene(6)} /> },
    { id: 1, waveProgress: 0.15, content: <SocialProofSection /> },
    { id: 2, waveProgress: 0.35, content: <PotentialDiagnostic /> },
    { id: 3, waveProgress: 0.55, content: <SceneServices /> },
    { id: 4, waveProgress: 0.70, content: <SceneStats /> },
    { id: 5, waveProgress: 0.85, content: <ConsultantSection onStrategyClick={() => setRequestedScene(6)} /> },
    { id: 6, waveProgress: 1.0,  content: <SceneCTA onFinalContact={handleFinalContact} /> },
  ];

  return (
    <div className="bg-[#010408] min-h-screen text-white font-sans selection:bg-accent/30 selection:text-white overflow-hidden" style={{ height: '100vh' }}>
      <CyberpunkScene activeScene={activeScene} />
      <DataWave3D waveProgress={waveProgress} />
      <div className="fixed inset-0 z-20 vignette-overlay pointer-events-none" />
      
      <EliteHUD activeScene={activeScene} />
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
          <div className="w-8 h-[1px] bg-accent/60" />
          <span className="text-white/60 text-xs tracking-[0.4em] uppercase font-black">RIA • ELITE</span>
        </div>
      </motion.div>

      <div className="fixed inset-0 z-40 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
