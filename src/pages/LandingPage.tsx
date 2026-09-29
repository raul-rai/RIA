import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useScroll } from 'motion/react';
import { Target } from 'lucide-react';
import DataWave3D from '../components/DataWave3D';
import ChapterSection from '../components/ChapterSection';
import { useActiveChapter } from '../hooks/useActiveChapter';
import EliteHUD from '../components/EliteHUD';
import BrandMark from '../components/BrandMark';
import AIChatAgent from '../components/AIChatAgent';
import ScannerForm from '../components/ScannerForm';
import ReportSection from '../components/ReportSection';
import PathsSection from '../components/PathsSection';
import WhatsAppFab from '../components/WhatsAppFab';
import { prefersReducedMotion } from '../lib/canvas-quality';
import { track } from '../lib/analytics';
import { SiteScoreProvider } from '../context/SiteScoreContext';
import { ScanProvider } from '../hooks/useSiteScan';
import { AgentIntentProvider } from '../context/AgentIntentContext';
import { REF_LABEL } from '../content/intents';
import CredibilitySection from '../components/CredibilitySection';
import OfferFaqSection from '../components/OfferFaqSection';
import SiteFooter from '../components/SiteFooter';
import { metaFor } from '../content/meta';
import { SESSION_MINUTES } from '../content/offer';

/** Capitulo que concentra a oferta e o agente. Todo CTA aponta para ca. */
const CTA_CHAPTER = 4;

// ─── Capitulo 0: MEDIR O SITE ─────────────────────────────────────────────────

/**
 * As manchetes, por segmento de campanha.
 *
 * Sempre duas linhas: a primeira neutra, a segunda em accent. Eram quatro
 * blocos `if/else if` construindo JSX quase idêntico; virou tabela porque a
 * unica coisa que muda entre elas é o texto — e porque o escalonamento da
 * entrada precisa contar as palavras da primeira linha para continuar a
 * contagem na segunda.
 */
const HEADLINES: Record<string, readonly [string, string]> = {
  default: ['Quando alguém pergunta ao ChatGPT o que você vende,', 'o seu site aparece?'],
  industria: ['Quem procura o que sua indústria produz', 'encontra você ou o concorrente?'],
  servicos: ['Quando buscam o serviço que você presta,', 'o seu site é o que a IA cita?'],
  varejo: ['Quem procura o que sua loja vende', 'chega até você pela busca de IA?'],
};

/**
 * Passo entre palavras na entrada da manchete.
 *
 * Era 0,12s, herdado do `staggerChildren` do motion. Com treze palavras, a
 * última só começava a aparecer 1,54s depois do primeiro frame — e era ela que
 * segurava o LCP. A 0,045s a manchete inteira fecha em ~1,1s e o escalonamento
 * continua legível como escalonamento.
 */
const WORD_STEP_S = 0.045;

/** Atraso de entrada, lido pelo CSS em `animation-delay: var(--d)`. */
const enterAt = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

/**
 * Uma linha da manchete, palavra a palavra.
 *
 * `offset` é a posição da primeira palavra desta linha na frase inteira, para o
 * escalonamento atravessar a quebra de linha sem reiniciar.
 *
 * Sem `motion` de propósito: a entrada é CSS (`.hero-word` em index.css), o que
 * tira a primeira pintura da dependência do bundle. Ver a nota longa lá.
 */
function HeroLine({
  text, offset, accent = false,
}: { text: string; offset: number; accent?: boolean }) {
  const words = text.split(' ');
  return (
    <span className={accent ? 'text-accent-dark font-semibold italic' : undefined}>
      {words.map((word, i) => (
        <Fragment key={word + i}>
          <span className="hero-word" style={enterAt((offset + i) * WORD_STEP_S)}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </span>
  );
}

function SceneHero({ onMeasured }: { onMeasured: () => void }) {
  const [ref, setRef] = useState<string | undefined>(undefined);
  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get('ref')?.toLowerCase());
  }, []);

  const [lead, accent] = (ref && HEADLINES[ref]) || HEADLINES.default;
  /** Onde a segunda linha entra na contagem de palavras. */
  const accentOffset = lead.split(' ').length;

  const headline = (
    <>
      <span className="block pb-2">
        <HeroLine text={lead} offset={0} />
      </span>{' '}
      <span className="block pb-4">
        <HeroLine text={accent} offset={accentOffset} accent />
      </span>
    </>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center pointer-events-auto relative z-10 min-h-[calc(100svh-11rem)] md:min-h-[calc(100svh-12rem)] justify-between">
      <div className="flex flex-col items-center">
      <div className="hero-rise glass-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 md:mb-6">
        <Target className="text-accent animate-pulse motion-reduce:animate-none" size={16} />
        <span className="text-slate-900 font-sans tracking-[0.1em] md:tracking-[0.15em] uppercase text-[10px] md:text-xs font-black whitespace-nowrap">
          {ref && REF_LABEL[ref] ? `Estratégia para ${REF_LABEL[ref]}` : 'Sobrevivência é questão de adaptação'}
        </span>
      </div>

      <h1 className="heading-hero text-slate-950 font-bold tracking-tight">
        {headline}
      </h1>
      </div>

      <div
        aria-hidden="true"
        className="flex-1 min-h-[8svh] md:min-h-[18svh] [@media(max-height:600px)]:min-h-0"
      />

      <div className="flex flex-col items-center w-full">
      <p
        style={enterAt(0.3)}
        className="hero-rise glass text-[15px] md:text-xl text-slate-800 max-w-2xl mb-6 md:mb-10 font-sans font-medium leading-relaxed px-4 py-3 rounded-2xl"
      >
        A Inteligência Artificial não é coisa do futuro, é <strong className="font-bold text-slate-950">necessidade do presente</strong> para continuar prosperando.
      </p>

      {/* O formulario do scanner entra no mesmo passo dos antigos CTAs. Ele e o
          unico que converte nesta dobra, e nao pode ser o ultimo a existir: a
          entrada e CSS (`.hero-rise`), nao motion, entao nao espera o bundle
          hidratar. */}
      <div
        style={enterAt(0.42)}
        className="hero-rise w-full pointer-events-auto"
      >
        <ScannerForm onMeasured={onMeasured} />
      </div>
      </div>
    </div>
  );
}

// ─── Capitulo 4: O AGENTE ─────────────────────────────────────────────────────
function SceneCTA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto">
      <h2 className="reading-surface inline-block px-4 py-2 mb-3 md:mb-4 max-w-2xl font-sans text-[13px] md:text-lg text-slate-700 leading-relaxed">
        Converse com o agente para ler o seu laudo e agendar{' '}
        <span className="font-semibold text-slate-900">{SESSION_MINUTES} minutos</span> com o especialista.
      </h2>

      <div className="w-full h-[calc(100svh-280px)] min-h-[380px] lg:h-[calc(100svh-290px)] lg:min-h-[420px] lg:max-h-[680px]">
        <AIChatAgent />
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────
/**
 * Os capítulos.
 *
 * Cada um tinha também um `title`, escrito em `document.title` a cada troca de
 * capítulo. Esse campo saiu: o Googlebot executa o JavaScript e lê o título
 * DEPOIS, então o título indexado passava a ser "RIA — A Ameaça Silenciosa" em
 * vez do que o prerender injetou — sem "gargalo", sem "ferramenta de IA". Ver
 * a nota em src/content/meta.ts.
 *
 * O `label` continua fazendo o trabalho que importa: é o `aria-label` de cada
 * <section> e o rótulo do evento de analytics.
 */
const CHAPTERS = [
  { label: 'Meça seu site' },
  { label: 'O laudo' },
  { label: 'Criar ou otimizar' },
  { label: 'Prova e quem executa' },
  { label: 'O agente e a agenda' },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const { active, setRef } = useActiveChapter(CHAPTERS.length);

  /**
   * Restaura o título da home na navegação client-side — voltar de
   * /privacidade pelo link do topo não recarrega o documento, e sem isto a home
   * herdaria o título da política. Roda UMA vez, na montagem: não é função do
   * capítulo ativo.
   */
  useEffect(() => {
    document.title = metaFor('/').title;
  }, []);

  useEffect(() => {
    const chapter = CHAPTERS[active];
    if (!chapter) return;
    track('chapter_view', { index: active, label: chapter.label });
  }, [active]);

  const goToChapter = useCallback((index: number) => {
    document.getElementById(`capitulo-${index}`)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const goToCta = useCallback(() => goToChapter(CTA_CHAPTER), [goToChapter]);
  const goToReport = useCallback(() => goToChapter(1), [goToChapter]);

  const chapterContent = useMemo(() => [
    <SceneHero onMeasured={goToReport} />,
    <ReportSection />,
    <PathsSection />,
    <CredibilitySection />,
    <SceneCTA />,
  ], [goToReport]);

  // A ordem dos provedores importa: o ScanProvider le o contexto das notas
  // (useSiteScore) para publicar cada medicao, entao mora DENTRO do
  // SiteScoreProvider; o AgentIntentProvider le as duas coisas para a
  // telemetria, entao mora dentro dos dois.
  return (
    <SiteScoreProvider>
      <ScanProvider>
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

          {/* Fora de CHAPTERS de propósito: é consulta de fundo de página, não
              uma dobra de conversão. Vem depois do agente para nunca empurrá-lo
              para fora da tela. Ver OfferFaqSection. */}
          <OfferFaqSection />
        </main>

        <SiteFooter />

        <BrandMark />

        <WhatsAppFab hideOnChapter={CTA_CHAPTER} />
        </div>
      </AgentIntentProvider>
      </ScanProvider>
    </SiteScoreProvider>
  );
}

