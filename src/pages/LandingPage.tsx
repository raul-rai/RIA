import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, Target, ChevronDown } from 'lucide-react';
import DataWave3D from '../components/DataWave3D';
import ChapterSection from '../components/ChapterSection';
import { useActiveChapter } from '../hooks/useActiveChapter';
import EliteHUD from '../components/EliteHUD';
import BrandMark from '../components/BrandMark';

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
  /**
   * O segmento da campanha entra DEPOIS da montagem, nao durante o render.
   *
   * Este era o unico acesso a `window` no corpo de um render em toda a
   * aplicacao (todo o resto ja vivia dentro de useEffect), e por causa dele o
   * prerender do build quebrava com "window is not defined". Mas so guardar
   * com `typeof window` nao bastava: o HTML prerenderizado e sempre a
   * variante generica, e se o primeiro render do cliente ja lesse
   * `?ref=industria` a hidratacao divergiria do servidor justamente no H1.
   *
   * Entao o primeiro render do cliente e identico ao do servidor — generico — e
   * a variante de campanha entra no efeito seguinte. Custo: um quadro com o
   * titulo generico em URLs de campanha. Ganho: o crawler recebe sempre a
   * pagina canonica, e a hidratacao nunca briga com ela.
   */
  const [ref, setRef] = useState<string | undefined>(undefined);
  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get('ref')?.toLowerCase());
  }, []);

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
      <span className="block pb-2">{animatedText('A inteligência artificial não é o futuro.')}</span>{' '}
      <span className="block pb-4">{animatedText('Ela já é o presente — e o presente cobra.', true)}</span>
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
    /**
     * Dois grupos empurrados para os extremos, com a onda no meio.
     *
     * Antes isto era um bloco unico centrado verticalmente — e o painel de
     * vidro do subtexto pousava exatamente sobre a crista, que no scroll 0
     * desenha a faixa dos ~45% aos ~65% da viewport (ver projectPoint em
     * lib/wave-scene). A cena que sustenta a narrativa da pagina inteira ficava
     * tapada por uma caixa opaca na unica dobra em que ela aparece inteira.
     *
     * A altura desconta o padding que ChapterSection ja reserva (pt-20 pb-24 =
     * 11rem; md:pt-28 md:pb-20 = 12rem). Nao sao numeros escolhidos: se aquele
     * padding mudar, estes mudam junto.
     */
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

      {/*
        O vao. E `flex-1` com piso, nao altura fixa: em monitor alto ele absorve
        toda a folga e a onda fica com mais de um terco da tela; num celular de
        640px ele recolhe ate 8svh e o CTA secundario continua acima da dobra.
        Vazio de proposito — o leitor de tela salta do H1 direto para o subtexto.

        O piso de 18svh e o do `md:`, que liga pela LARGURA — e num celular
        deitado a largura passa de 768px com 375px de altura sobrando. Ali o
        criterio tem que ser a altura, senao o vao abre 68px numa tela que nao
        tem 68px para dar. Mesma regra que ChapterSection e EliteHUD ja usam.

        Abaixo de 600px de altura o piso some de vez: numa tela dessas nao ha
        folga para revelar onda nenhuma, e reservar espaco para uma revelacao
        que nao acontece so empurra o CTA para fora da dobra. O `flex-1`
        continua ali e volta a abrir sozinho assim que houver sobra.
      */}
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
        Nenhuma mudança ambiental poupou o maior nem o mais forte — só quem se adaptou primeiro. Hoje, adaptar-se é usar IA em <strong className="font-bold text-slate-950">todos os seus projetos</strong>.
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
          <span>Quero me adaptar primeiro</span>
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
        <BrandMark />

        <WhatsAppFab hideOnChapter={CTA_CHAPTER} />
        </div>
      </AgentIntentProvider>
    </VulnerabilityProvider>
  );
}
