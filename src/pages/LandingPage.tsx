import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, Target, ChevronDown } from 'lucide-react';
import DataWave3D from '../components/DataWave3D';
import ChapterSection from '../components/ChapterSection';
import { useActiveChapter } from '../hooks/useActiveChapter';
import EliteHUD from '../components/EliteHUD';

import AIChatAgent from '../components/AIChatAgent';
import OfferSection from '../components/OfferSection';
import PotentialDiagnostic from '../components/PotentialDiagnostic';
import SocialProofSection from '../components/SocialProofSection';
import WhatsAppFab from '../components/WhatsAppFab';
import { prefersReducedMotion } from '../lib/canvas-quality';
import { track } from '../lib/analytics';
import { VulnerabilityProvider } from '../context/VulnerabilityContext';
import { AgentIntentProvider, useAgentIntent } from '../context/AgentIntentContext';
import { REF_LABEL } from '../content/intents';
import FiveFronts from '../components/FiveFronts';
import CredibilitySection from '../components/CredibilitySection';

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
  const searchParams = new URLSearchParams(window.location.search);
  const ref = searchParams.get('ref')?.toLowerCase();

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
        className="heading-hero mb-5 md:mb-6 text-slate-950 font-bold tracking-tight"
      >
        {headline}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="glass text-[15px] md:text-xl text-slate-800 max-w-2xl mb-8 md:mb-10 font-sans font-medium leading-relaxed px-4 py-3 rounded-2xl"
      >
        Se você ainda não utiliza inteligência artificial em <strong className="font-bold text-slate-950">TODOS OS SEUS PROJETOS</strong>, você está rasgando dinheiro.
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
  );
}

// ─── Capitulo 5: O AGENTE E A AGENDA ─────────────────────────────────────────
// Um caminho so. Antes eram tres saidas competindo — cartao de oferta, chat e
// FAB — e a conversao real era um link de WhatsApp com dados parciais. A oferta
// vira faixa de contexto acima do agente: informacao disponivel, sem disputar
// o clique.
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto">
      <div className="w-full mb-4 md:mb-5">
        <h2 className="reading-surface text-2xl md:text-5xl font-serif text-slate-900 mb-2 px-4 py-2 inline-block">
          Trinta minutos, <span className="italic font-normal text-slate-500">e você sai com um mapa.</span>
        </h2>
        {/* reading-surface e obrigatorio aqui: nesta dobra a onda ja fechou
            sobre a camera e o fundo do canvas e azul profundo. Sem a superficie
            clara, este e o unico texto do capitulo que ficaria escuro sobre
            escuro — os demais ja vivem dentro de cartoes de vidro. */}
        <p className="reading-surface inline-block px-4 py-2 text-slate-700 text-[13px] md:text-base max-w-xl mx-auto font-sans leading-relaxed">
          Conte ao agente o que sua empresa faz. Ele já sabe o que você respondeu até aqui, e marca
          a sessão comigo.
        </p>
      </div>

      <div className="w-full mb-4">
        <OfferSection />
      </div>

      <div className="w-full h-[78svh] lg:h-auto lg:min-h-[560px]">
        <AIChatAgent />
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────
// Seis dobras. A ordem e a espinha narrativa: ameaca -> validacao externa ->
// tensao pessoal (a nota do site) -> o caminho (o catalogo) -> confianca ->
// acao. O que quebrava antes era o degrau entre tensao e caminho: a pagina
// subia a tensao e respondia com metodologia de ROI.
const CHAPTERS = [
  { label: 'A ameaça silenciosa', title: 'RIA — A Ameaça Silenciosa' },
  { label: 'Vozes do mercado', title: 'RIA — Vozes do Mercado' },
  { label: 'Diagnóstico de saúde digital', title: 'RIA — Diagnóstico de Saúde Digital' },
  { label: 'As cinco frentes', title: 'RIA — As Cinco Frentes' },
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
  const goToMarketVoices = useCallback(() => goToChapter(1), [goToChapter]);

  const chapterContent = useMemo(() => [
    <SceneHero onUnderstandMore={goToMarketVoices} />,
    <SocialProofSection />,
    <PotentialDiagnostic />,
    <FiveFronts />,
    <CredibilitySection />,
    <SceneCTA />,
  ], [goToMarketVoices]);

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

        {/* Marca — recolhida no mobile, onde competia com o indice pelo topo. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="hidden md:block fixed top-6 left-6 z-30 pointer-events-none"
        >
          <div className="glass-chip flex items-center gap-3 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-slate-900 text-xs tracking-[0.35em] uppercase font-black">RIA</span>
          </div>
        </motion.div>

        <WhatsAppFab hideOnChapter={CTA_CHAPTER} />
        </div>
      </AgentIntentProvider>
    </VulnerabilityProvider>
  );
}
