import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, Target, ChevronDown } from 'lucide-react';
import DataWave3D from '../components/DataWave3D';
import ChapterSection from '../components/ChapterSection';
import { useActiveChapter } from '../hooks/useActiveChapter';
import EliteHUD from '../components/EliteHUD';
import BrandMark from '../components/BrandMark';
import AIChatAgent from '../components/AIChatAgent';
import PotentialDiagnostic from '../components/PotentialDiagnostic';
import MarketEvidenceSection from '../components/MarketEvidenceSection';
import SocialProofSection from '../components/SocialProofSection';
import WhatsAppFab from '../components/WhatsAppFab';
import { prefersReducedMotion } from '../lib/canvas-quality';
import { track } from '../lib/analytics';
import { VulnerabilityProvider } from '../context/VulnerabilityContext';
import { AgentIntentProvider, useAgentIntent } from '../context/AgentIntentContext';
import { REF_LABEL } from '../content/intents';
import FrontsSection from '../components/FrontsSection';
import CredibilitySection from '../components/CredibilitySection';
import SiteFooter from '../components/SiteFooter';

/** Capitulo que concentra a oferta e o agente. Todo CTA aponta para ca. */
const CTA_CHAPTER = 5;

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
function SceneHero({ onUnderstandMore }: { onUnderstandMore: () => void }) {
  const { requestIntent } = useAgentIntent();
  const [ref, setRef] = useState<string | undefined>(undefined);
  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get('ref')?.toLowerCase());
  }, []);

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
      <span className="block pb-2">{animatedText('Sua empresa está preparada para enfrentar')}</span>{' '}
      <span className="block pb-4">{animatedText('a maior mudança de mercado da história?', true)}</span>
    </>
  );

  if (ref === 'industria') {
    headline = (
      <>
        <span className="block pb-2">{animatedText('Qual etapa da sua produção')}</span>{' '}
        <span className="block pb-4">{animatedText('custa mais hora do que deveria?', true)}</span>
      </>
    );
  } else if (ref === 'servicos') {
    headline = (
      <>
        <span className="block pb-2">{animatedText('Quantas horas da sua equipe')}</span>{' '}
        <span className="block pb-4">{animatedText('vão para o que não é o serviço?', true)}</span>
      </>
    );
  } else if (ref === 'varejo') {
    headline = (
      <>
        <span className="block pb-2">{animatedText('Quanto do seu atendimento')}</span>{' '}
        <span className="block pb-4">{animatedText('acontece depois que você fecha?', true)}</span>
      </>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center pointer-events-auto relative z-10 min-h-[calc(100svh-11rem)] md:min-h-[calc(100svh-12rem)] justify-between">
      <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 md:mb-6"
      >
        <Target className="text-accent animate-pulse" size={16} />
        <span className="text-slate-900 font-sans tracking-[0.1em] md:tracking-[0.15em] uppercase text-[10px] md:text-xs font-black whitespace-nowrap">
          {ref && REF_LABEL[ref] ? `Estratégia para ${REF_LABEL[ref]}` : 'Conhecimento relevante para todo empresário'}
        </span>
      </motion.div>

      <motion.h1
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }, hidden: {} }}
        className="heading-hero text-slate-950 font-bold tracking-tight"
      >
        {headline}
      </motion.h1>
      </div>

      <div
        aria-hidden="true"
        className="flex-1 min-h-[8svh] md:min-h-[18svh] [@media(max-height:600px)]:min-h-0"
      />

      <div className="flex flex-col items-center w-full">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="glass text-[15px] md:text-xl text-slate-800 max-w-2xl mb-6 md:mb-10 font-sans font-medium leading-relaxed px-4 py-3 rounded-2xl"
      >
        A Inteligência Artificial não é coisa do futuro, é <strong className="font-bold text-slate-950">necessidade atual</strong> de empresários que se adaptam, para continuar prosperando.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3.5 md:gap-4 w-full sm:w-auto pointer-events-auto"
      >
        <MagneticButton
          onClick={() => {
            track('cta_click', { location: 'hero' });
            requestIntent('hero-cold');
          }}
          className="w-full sm:w-auto group px-7 py-4 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-accent shadow-2xl flex items-center justify-center gap-2.5 min-h-[52px]"
        >
          <span>Pare de rasgar dinheiro</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
        </MagneticButton>

        <MagneticButton
          onClick={onUnderstandMore}
          className="glass glass-hover w-full sm:w-auto group px-7 py-4 text-slate-900 hover:text-accent rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 min-h-[52px]"
        >
          <span>Entenda melhor</span>
          <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform duration-300" />
        </MagneticButton>
      </motion.div>
      </div>
    </div>
  );
}

// ─── Capitulo 5: O AGENTE ─────────────────────────────────────────────────────
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto">
      <h2 className="reading-surface inline-block px-4 py-2 mb-3 md:mb-4 max-w-2xl font-sans text-[13px] md:text-lg text-slate-700 leading-relaxed">
        Converse com o agente para agendar seu{' '}
        <span className="font-semibold text-slate-900">Diagnóstico de Gargalo</span> e uma reunião de 15 minutos com o especialista.
      </h2>

      <div className="w-full h-[calc(100svh-280px)] min-h-[380px] lg:h-[calc(100svh-290px)] lg:min-h-[420px] lg:max-h-[680px]">
        <AIChatAgent />
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { label: 'A ameaça silenciosa', title: 'RIA — A Ameaça Silenciosa' },
  { label: 'Vozes do mercado', title: 'RIA — Vozes do Mercado' },
  { label: 'Diagnóstico de saúde digital', title: 'RIA — Diagnóstico de Saúde Digital' },
  { label: 'As três frentes', title: 'RIA — As Três Frentes' },
  { label: 'Prova e quem executa', title: 'RIA — Prova e Quem Executa' },
  { label: 'O agente e a agenda', title: 'RIA — Agende sua Sessão' },
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
  const goToSocialProof = useCallback(() => goToChapter(1), [goToChapter]);

  const chapterContent = useMemo(() => [
    <SceneHero onUnderstandMore={goToSocialProof} />,
    <div className="w-full flex flex-col gap-8 md:gap-16">
      <MarketEvidenceSection />
      <SocialProofSection />
    </div>,
    <PotentialDiagnostic />,
    <FrontsSection />,
    <CredibilitySection />,
    <SceneCTA />,
  ], [goToSocialProof]);

  return (
    <VulnerabilityProvider>
      <AgentIntentProvider onReachAgent={goToCta}>
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

        <SiteFooter />

        <BrandMark />

        <WhatsAppFab hideOnChapter={CTA_CHAPTER} />
        </div>
      </AgentIntentProvider>
    </VulnerabilityProvider>
  );
}

