import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'motion/react';
import {
  ArrowRight, Bot, TrendingUp, Zap, Target, Search, MapPin,
  Paintbrush, Video, Layout, Settings,
} from 'lucide-react';
import DataWave3D from '../components/DataWave3D';
import ChapterSection from '../components/ChapterSection';
import { useActiveChapter } from '../hooks/useActiveChapter';
import EliteHUD from '../components/EliteHUD';

import AIChatAgent from '../components/AIChatAgent';
import OfferSection from '../components/OfferSection';
import PotentialDiagnostic from '../components/PotentialDiagnostic';
import ProofSection from '../components/ProofSection';
import SocialProofSection from '../components/SocialProofSection';
import ConsultantSection from '../components/ConsultantSection';
import WhatsAppFab from '../components/WhatsAppFab';
import { whatsappWithMessage } from '../constants/links';
import { prefersReducedMotion } from '../lib/canvas-quality';
import { track } from '../lib/analytics';
import { VulnerabilityProvider } from '../context/VulnerabilityContext';
import OperationalAIChecklist from '../components/OperationalAIChecklist';

/** Capitulo que concentra a oferta e o agente. Todo CTA aponta para ca. */
const CTA_CHAPTER = 7;

function MagneticButton({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.2);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.2);
  }

  return (
    <motion.button
      style={{ x: mouseXSpring, y: mouseYSpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ─── Capitulo 0: A AMEACA ────────────────────────────────────────────────────
function SceneHero({ onStartDiagnostic }: { onStartDiagnostic: () => void }) {
  const searchParams = new URLSearchParams(window.location.search);
  const ref = searchParams.get('ref')?.toLowerCase();

  const REF_LABEL: Record<string, string> = {
    industria: 'Indústria',
    servicos: 'Serviços',
    varejo: 'Varejo',
  };

  /**
   * Cada palavra anima sozinha, mas o espaco entre elas e um no de texto real —
   * nao margem. Sem isso o textContent do H1 sai grudado ("OTsunamidaIA...") e
   * fica ilegivel para leitor de tela, copy-paste e crawler generativo.
   */
  const animatedText = (text: string, isAccent?: boolean) => {
    const words = text.split(' ');
    return (
      <span className={isAccent ? 'text-accent-dark font-semibold italic' : ''}>
        {words.map((word, i) => (
          <Fragment key={word + i}>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
              }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </span>
    );
  };

  let headline = (
    <>
      <span className="block pb-2">{animatedText('O Tsunami da IA está chegando!')}</span>{' '}
      <span className="block pb-4">{animatedText('É o fim da ineficiência humana.', true)}</span>
    </>
  );

  if (ref === 'industria') {
    headline = (
      <>
        <span className="block pb-2">{animatedText('Sua produção manual')}</span>{' '}
        <span className="block pb-4">{animatedText('é o gargalo que vai te afogar.', true)}</span>
      </>
    );
  } else if (ref === 'servicos') {
    headline = (
      <>
        <span className="block pb-2">{animatedText('Vender horas humanas')}</span>{' '}
        <span className="block pb-4">{animatedText('é um modelo com os dias contados.', true)}</span>
      </>
    );
  } else if (ref === 'varejo') {
    headline = (
      <>
        <span className="block pb-2">{animatedText('O estoque parado')}</span>{' '}
        <span className="block pb-4">{animatedText('não é seu único custo.', true)}</span>
      </>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center pointer-events-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-300 bg-white/95 backdrop-blur-md mb-6 shadow-md"
      >
        <Target className="text-accent animate-pulse" size={16} />
        <span className="text-slate-900 font-sans tracking-[0.2em] uppercase text-[10px] md:text-xs font-black">
          {ref && REF_LABEL[ref] ? `Estratégia para ${REF_LABEL[ref]}` : 'Exclusivo para empresas de R$ 100k+'}
        </span>
      </motion.div>

      <motion.h1
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }, hidden: {} }}
        className="heading-hero mb-6 text-slate-950 font-bold tracking-tight"
      >
        {headline}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="text-base md:text-xl text-slate-800 max-w-2xl mb-10 font-sans font-medium leading-relaxed px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm"
      >
        A ineficiência é o imposto invisível que você paga todos os dias. Seu negócio está pronto
        para navegar — ou será submergido?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="flex flex-col items-center gap-4 w-full sm:w-auto pointer-events-auto"
      >
        <MagneticButton
          onClick={onStartDiagnostic}
          className="w-full sm:w-auto group px-8 py-5 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors duration-300 hover:bg-accent shadow-2xl flex items-center justify-center gap-3"
        >
          <span>Garantir minha alavancagem</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
        </MagneticButton>
        <p className="text-slate-800 text-[10px] md:text-xs tracking-[0.2em] uppercase font-black mt-2 bg-white/90 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-md">
          Role para aceitar a verdade
        </p>
      </motion.div>
    </div>
  );
}

// ─── Capitulo 2: AS POSSIBILIDADES ───────────────────────────────────────────
const servicesNodes = [
  { label: 'SDR', icon: Bot },
  { label: 'Estratégia', icon: TrendingUp },
  { label: 'Sites', icon: Layout },
  { label: 'SEO', icon: Search },
  { label: 'Criativos', icon: Paintbrush },
  { label: 'GEO', icon: MapPin },
  { label: 'Automação', icon: Settings },
  { label: 'Vídeos', icon: Video },
];

function OrbitalNode({ node, delay }: { node: { label: string; icon: typeof Bot }, delay: number }) {
  const Icon = node.icon;
  return (
    <motion.div
      variants={{
        hidden: { scale: 0, opacity: 0, y: 20 },
        visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', delay } },
      }}
      className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-full border border-slate-200 flex flex-col items-center justify-center shadow-md bg-white/95 hover:border-accent/70 hover:-translate-y-1 transition-all duration-300 cursor-default"
    >
      <Icon size={20} className="text-accent mb-0.5 md:mb-1" />
      <span className="text-[9px] md:text-xs text-slate-800 font-sans tracking-wide font-semibold text-center leading-tight px-1 whitespace-nowrap">
        {node.label}
      </span>
    </motion.div>
  );
}

function SceneServices() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{ visible: { transition: { staggerChildren: 0.12 } }, hidden: {} }}
      className="w-full max-w-5xl mx-auto px-2 md:px-4 pointer-events-auto flex flex-col items-center justify-center py-2 relative z-10"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
        className="mb-4 md:mb-8 text-center shrink-0"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-accent/20 bg-accent/10 backdrop-blur-md mb-2 md:mb-4 font-sans">
          <Zap size={14} className="text-accent" />
          <span className="text-accent-dark text-[9px] md:text-xs uppercase tracking-[0.2em] font-bold">
            Ecossistema conectado
          </span>
        </div>
        <h2 className="text-xl md:text-4xl font-serif text-slate-900 mb-0 leading-tight bg-white/80 rounded-2xl px-4 py-2">
          Sua empresa como o centro <br className="hidden md:block" />
          <span className="italic font-normal text-slate-500">de uma rede inteligente.</span>
        </h2>
      </motion.div>

      <div className="relative w-full max-w-4xl mx-auto mt-2 md:mt-4">
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,131,143,0.15)" />
              <stop offset="50%" stopColor="rgba(0,131,143,0.7)" />
              <stop offset="100%" stopColor="rgba(0,131,143,0.15)" />
            </linearGradient>
          </defs>
          {[
            { x: '16.6%', y: '16.6%' }, { x: '50%', y: '16.6%' }, { x: '83.3%', y: '16.6%' },
            { x: '16.6%', y: '50%' },                             { x: '83.3%', y: '50%' },
            { x: '16.6%', y: '83.3%' }, { x: '50%', y: '83.3%' }, { x: '83.3%', y: '83.3%' },
          ].map((pos, i) => (
            <motion.line
              key={`line-${i}`}
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 0.2 + i * 0.08 } },
              }}
              x1="50%" y1="50%" x2={pos.x} y2={pos.y}
              stroke="url(#netGrad)" strokeWidth="1.5" strokeDasharray="4 4"
            />
          ))}
        </svg>

        <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-y-4 md:gap-y-8 gap-x-2 md:gap-x-4 place-items-center w-full px-2">
          <OrbitalNode node={servicesNodes[0]} delay={0.1} />
          <OrbitalNode node={servicesNodes[1]} delay={0.2} />
          <OrbitalNode node={servicesNodes[2]} delay={0.3} />
          <OrbitalNode node={servicesNodes[3]} delay={0.4} />

          {/* Unico elemento em destaque da tela (spec D-01, regra 2). */}
          <motion.div
            variants={{
              hidden: { scale: 0, opacity: 0 },
              visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.2 } },
            }}
            className="w-24 h-24 md:w-36 md:h-36 shrink-0 rounded-full border-2 border-accent flex items-center justify-center shadow-[0_0_40px_rgba(0,131,143,0.18)] bg-white relative"
          >
            <span className="font-serif text-slate-900 text-[11px] md:text-sm font-bold tracking-widest uppercase text-center leading-tight whitespace-nowrap z-10">
              Sua<br />Empresa
            </span>
          </motion.div>

          <OrbitalNode node={servicesNodes[4]} delay={0.5} />
          <OrbitalNode node={servicesNodes[5]} delay={0.6} />
          <OrbitalNode node={servicesNodes[6]} delay={0.7} />
          <OrbitalNode node={servicesNodes[7]} delay={0.8} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Capitulo 7: A OFERTA + O AGENTE ─────────────────────────────────────────
function SceneCTA({ onFinalContact }: { onFinalContact: (data: { roi: number; name?: string; revenue?: number; efficiency?: number }) => void }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto">
      <div className="w-full mb-5 md:mb-8">
        <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-2 md:mb-3 bg-white/80 rounded-2xl px-4 py-2 inline-block">
          Você vai surfar ou <span className="italic font-normal text-slate-500">se afogar?</span>
        </h2>
        <p className="text-slate-700 text-xs md:text-base max-w-xl mx-auto font-sans leading-relaxed">
          A proposta está à esquerda. O agente à direita já sabe o que você respondeu até aqui.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 md:gap-6 items-stretch">
        <div className="order-2 lg:order-1 min-h-[420px]">
          <OfferSection />
        </div>
        <div className="order-1 lg:order-2 h-[65svh] lg:h-auto lg:min-h-[560px]">
          <AIChatAgent onComplete={onFinalContact} />
        </div>
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { label: 'A ameaça silenciosa', title: 'RIA — A Ameaça Silenciosa' },
  { label: 'Vozes do mercado', title: 'RIA — Vozes do Mercado' },
  { label: 'O ecossistema de IA', title: 'RIA — O Ecossistema' },
  { label: 'Como medimos retorno', title: 'RIA — Retorno Auditável' },
  { label: 'Diagnóstico de saúde digital', title: 'RIA — Diagnóstico de Saúde Digital' },
  { label: 'IA operacional na prática', title: 'RIA — IA Operacional na Prática' },
  { label: 'Seu consultor', title: 'RIA — Seu Consultor' },
  { label: 'A proposta e o agente', title: 'RIA — A Proposta' },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const { active, setRef } = useActiveChapter(CHAPTERS.length);

  useEffect(() => {
    const chapter = CHAPTERS[active];
    if (!chapter) return;
    document.title = chapter.title;
    track('chapter_view', { index: active, label: chapter.label });
  }, [active]);

  const goToChapter = useCallback((index: number) => {
    document.getElementById(`capitulo-${index}`)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const goToCta = useCallback(() => goToChapter(CTA_CHAPTER), [goToChapter]);

  const handleFinalContact = useCallback((data: { roi: number; name?: string; revenue?: number; efficiency?: number }) => {
    const message = [
      'Olá! Realizei o diagnóstico via chat RIA.',
      '',
      data.name ? `Nome: ${data.name}` : null,
      data.revenue ? `Faturamento: R$ ${data.revenue.toLocaleString('pt-BR')}/mês` : null,
      `ROI projetado: R$ ${data.roi.toLocaleString('pt-BR')}/ano`,
      data.efficiency ? `Eficiência: +${data.efficiency}%` : null,
      '',
      'Quero agendar minha sessão estratégica.',
    ].filter(Boolean).join('\n');
    track('whatsapp_click', { location: 'agent_complete' });
    window.open(whatsappWithMessage(message), '_blank', 'noopener,noreferrer');
  }, []);

  const chapterContent = useMemo(() => [
    <SceneHero onStartDiagnostic={goToCta} />,
    <SocialProofSection />,
    <SceneServices />,
    <ProofSection onWantStrategy={goToCta} />,
    <PotentialDiagnostic onWantStrategy={goToCta} />,
    <OperationalAIChecklist onWantStrategy={goToCta} />,
    <ConsultantSection onStrategyClick={goToCta} />,
    <SceneCTA onFinalContact={handleFinalContact} />,
  ], [goToCta, handleFinalContact]);

  return (
    <VulnerabilityProvider>
      <div className="bg-white text-slate-900 font-sans selection:bg-accent/20 selection:text-slate-900">
        <a
          href={`#capitulo-${CTA_CHAPTER}`}
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-xs focus:font-bold"
        >
          Pular para a proposta
        </a>

        <DataWave3D progress={scrollYProgress} />
        <EliteHUD activeScene={active} />

        <main className="relative z-10">
          {CHAPTERS.map((chapter, i) => (
            <ChapterSection key={i} index={i} label={chapter.label} setRef={setRef(i)}>
              {chapterContent[i]}
            </ChapterSection>
          ))}
        </main>

        {/* Marca — recolhida no mobile, onde competia com o indice pelo topo. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="hidden md:block fixed top-6 left-6 z-30 pointer-events-none"
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 border border-slate-200 shadow-md backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-slate-900 text-xs tracking-[0.35em] uppercase font-black">RIA</span>
          </div>
        </motion.div>

        <WhatsAppFab hideOnChapter={CTA_CHAPTER} />
      </div>
    </VulnerabilityProvider>
  );
}
