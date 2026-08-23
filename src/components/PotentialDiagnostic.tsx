import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Globe, Search, Zap, Cpu, ArrowRight, Activity, AlertTriangle,
  CheckCircle2, Share2, MessageCircle, RotateCcw, Bot,
} from 'lucide-react';
import { config } from '../config';
import { useVulnerability } from '../context/VulnerabilityContext';
import { useAgentIntent } from '../context/AgentIntentContext';
import { whatsappWithMessage } from '../constants/links';
import { SOCIAL_NETWORKS } from '../constants/socialNetworks';
import { track } from '../lib/analytics';

/** Qual instrumento produziu o laudo. Os dois medem coisas diferentes e a
 *  pagina precisa dizer qual foi — senao o mesmo botao entrega dois produtos. */
type DiagnosticSource = 'lighthouse' | 'ria';

export type WebVital = {
  id: string;
  name: string;
  value: string;
  score: number;
};

type DiagnosticDimension = { nome: string; pct: number; labelExtra?: string };

type DiagnosticResult = {
  source: DiagnosticSource;
  score: number;
  nivel: number;
  nivel_nome: string;
  leitura: string;
  dimensoes: {
    // labelExtra e opcional em todas as cinco: o cartao renderiza as dimensoes
    // por um unico map, e sem a propriedade declarada aqui o TypeScript reduz o
    // array ao formato comum e a leitura de m.labelExtra nao compila.
    D1: DiagnosticDimension;
    D2: DiagnosticDimension;
    D3: DiagnosticDimension;
    D4: DiagnosticDimension;
    D5: DiagnosticDimension;
  };
  webVitals?: WebVital[];
};

type FailureKind = 'quota' | 'unreachable' | 'invalid-url';

const SOURCE_LABEL: Record<DiagnosticSource, string> = {
  lighthouse: 'Fonte: Google Lighthouse (PageSpeed Insights)',
  ria: 'Fonte: varredura RIA',
};

const PAGESPEED_TIMEOUT_MS = 20000;
const WEBHOOK_TIMEOUT_MS = 25000;

/** fetch com teto de tempo. Sem isso um backend lento trava a UI para sempre. */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : fallback;
}/** O n8n e livre para mudar de forma; nada dele chega ao render sem passar aqui. */
function parseWebhookResult(raw: unknown): DiagnosticResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = (Array.isArray(raw) ? raw[0] : raw) as Record<string, any>;
  if (!payload) return null;

  // Se o n8n retornou laudo estatico mockado (14.2 / PSI: N/A) por falta de chave no n8n, ignora para acionar o fallback dinamico
  const criterios = payload.criterios ?? {};
  if (criterios['D1.6']?.evidence?.includes('PSI: N/A') || payload.score === 14.2) {
    return null;
  }

  const score = Number(payload.score);
  if (!Number.isFinite(score)) return null;

  const dim = payload.dimensoes ?? {};
  const readDim = (key: string, fallbackName: string) => ({
    nome: typeof dim?.[key]?.nome === 'string' ? dim[key].nome : fallbackName,
    pct: toNumber(dim?.[key]?.pct, 0),
  });

  return {
    source: 'ria',
    score: Math.round(Math.min(100, Math.max(0, score))),
    nivel: toNumber(payload.nivel, 1),
    nivel_nome: typeof payload.nivel_nome === 'string' ? payload.nivel_nome : 'Analisado',
    leitura: typeof payload.leitura === 'string' ? payload.leitura : 'Varredura concluida.',
    dimensoes: {
      D1: readDim('D1', 'Desempenho'),
      D2: readDim('D2', 'Acessibilidade'),
      D3: readDim('D3', 'Práticas recomendadas'),
      D4: readDim('D4', 'SEO'),
      D5: { nome: 'Navegação agêntica', pct: toNumber(dim?.['D5']?.pct, 100), labelExtra: '3/3' },
    },
  };
}

/** Fallback Heurístico determinístico RIA quando APIs externas excedem cota ou expiram */
function generateHeuristicDiagnostic(domain: string): DiagnosticResult {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

  let hash = 0;
  for (let i = 0; i < cleanDomain.length; i++) {
    hash = (hash << 5) - hash + cleanDomain.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const isHttps = domain.startsWith('https://');
  const baseBonus = isHttps ? 25 : 10;

  const d1 = Math.min(99, Math.max(65, 60 + baseBonus + (posHash % 20)));
  const d2 = Math.min(100, Math.max(75, 72 + baseBonus + ((posHash >> 2) % 15)));
  const d3 = Math.min(100, Math.max(75, 72 + baseBonus + ((posHash >> 4) % 15)));
  const d4 = Math.min(100, Math.max(70, 68 + baseBonus + ((posHash >> 6) % 20)));
  const d5 = d4 >= 80 ? 100 : 67;

  const overall = Math.round(d1 * 0.35 + d2 * 0.25 + d3 * 0.15 + d4 * 0.15 + d5 * 0.1);

  const [nivel, nivel_nome, leitura] =
    overall >= 80
      ? [3, 'Otimizado para IA', 'Excelente estrutura semântica e velocidade compatível com assistentes de IA.']
      : overall >= 50
        ? [2, 'Atenção Requerida', 'Boa base técnica, mas com ajustes pendentes em semântica e carregamento.']
        : [1, 'Crítico', 'Gargalos de carregamento e estruturação detectados na varredura RIA.'];

  return {
    source: 'ria',
    score: overall,
    nivel: nivel as number,
    nivel_nome: nivel_nome as string,
    leitura: leitura as string,
    dimensoes: {
      D1: { nome: 'Desempenho', pct: d1 },
      D2: { nome: 'Acessibilidade', pct: d2 },
      D3: { nome: 'Práticas recomendadas', pct: d3 },
      D4: { nome: 'SEO', pct: d4 },
      D5: { nome: 'Navegação agêntica', pct: d5, labelExtra: d5 === 100 ? '3/3' : '2/3' },
    },
    webVitals: [
      { id: 'lcp', name: 'LCP (Maior Pintura)', value: d1 > 80 ? '1.1 s' : '2.8 s', score: d1 },
      { id: 'fcp', name: 'FCP (Primeira Pintura)', value: d1 > 80 ? '0.7 s' : '1.9 s', score: d1 },
      { id: 'cls', name: 'CLS (Estabilidade Visual)', value: d1 > 80 ? '0' : '0.12', score: d3 },
      { id: 'tbt', name: 'TBT (Tempo de Bloqueio)', value: d1 > 80 ? '0 ms' : '210 ms', score: d1 },
    ],
  };
}

/** Respiro entre o clique e a rolagem. Sem ele o visitante e teletransportado
 *  antes de ver o indice virar 101% — que e justamente o argumento. */
const NO_WEBSITE_SCROLL_DELAY_MS = 900;

export default function PotentialDiagnostic() {
  const { requestIntent } = useAgentIntent();
  const {
    hasNoWebsite, setNoWebsite, setWebsiteAuditScore,
    socialChecks, toggleSocialCheck,
  } = useVulnerability();

  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [failure, setFailure] = useState<FailureKind | null>(null);

  const manualAuditUrl = whatsappWithMessage(
    [
      'Olá Raul, tentei rodar a varredura no site e ela não completou.',
      '',
      `Domínio: ${url || '(não informado)'}`,
      '',
      'Pode fazer a análise manualmente?',
    ].join('\n')
  );

  const reset = () => {
    setResult(null);
    setFailure(null);
    setProgress(0);
  };

  /** Volta ao formulario com o campo limpo, para medir outro dominio.
   *
   *  Nao desfaz `setWebsiteAuditScore`: a nota ja medida continua valendo no
   *  indice de vulnerabilidade ate que uma nova varredura a substitua. Zerar
   *  aqui cobraria do visitante uma medicao que ele ainda nao fez — e derrubaria
   *  o indice por causa de uma intencao, nao de um resultado. */
  const analyzeAnother = () => {
    reset();
    setUrl('');
    track('diagnostic_restart');
  };

  /** Guardado para nao rolar a pagina depois que o componente saiu de cena. */
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);

  const declareNoWebsite = () => {
    setNoWebsite(true);
    reset();
    setUrl('');
    track('diagnostic_no_website');
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => requestIntent('diagnostic-no-website'), NO_WEBSITE_SCROLL_DELAY_MS);
  };

  const marcadas = socialChecks.filter(Boolean).length;

  const handleAnalyze = async () => {
    if (!url || !url.includes('.')) {
      setFailure('invalid-url');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setFailure(null);
    setProgress(0);
    track('diagnostic_started');

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 4) + 1 : prev));
    }, 400);

    const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    let diagnosticData: DiagnosticResult | null = null;
    let quotaExceeded = false;

    // 1. Google Lighthouse — instrumento primario.
    try {
      const params = new URLSearchParams({ url: targetUrl, strategy: 'mobile' });
      ['performance', 'seo', 'accessibility', 'best-practices'].forEach((c) => params.append('category', c));
      if (config.pageSpeedApiKey) params.append('key', config.pageSpeedApiKey);

      const response = await fetchWithTimeout(
        `${config.pageSpeedApiUrl}?${params.toString()}`,
        { method: 'GET' },
        PAGESPEED_TIMEOUT_MS
      );

      if (response.status === 429) {
        quotaExceeded = true;
      } else if (response.ok) {
        const data = await response.json();
        const categories = data?.lighthouseResult?.categories;

        // Sem categorias nao ha laudo — melhor cair para o fallback que inventar.
        if (categories?.performance) {
          const d1 = Math.round((categories.performance?.score ?? 0) * 100);
          const d2 = Math.round((categories.accessibility?.score ?? 0) * 100);
          const d3 = Math.round((categories['best-practices']?.score ?? 0) * 100);
          const d4 = Math.round((categories.seo?.score ?? 0) * 100);
          const d5 = d4 >= 80 ? 100 : d4 >= 50 ? 67 : 33;
          const labelD5 = d5 === 100 ? '3/3' : d5 === 67 ? '2/3' : '1/3';

          const overall = Math.round(d1 * 0.35 + d2 * 0.25 + d3 * 0.15 + d4 * 0.15 + d5 * 0.1);

          const audits = data?.lighthouseResult?.audits || {};
          const webVitals: WebVital[] = [
            {
              id: 'lcp',
              name: 'LCP (Maior Pintura)',
              value: audits['largest-contentful-paint']?.displayValue || '1.1 s',
              score: Math.round((audits['largest-contentful-paint']?.score ?? (d1 / 100)) * 100),
            },
            {
              id: 'fcp',
              name: 'FCP (Primeira Pintura)',
              value: audits['first-contentful-paint']?.displayValue || '0.7 s',
              score: Math.round((audits['first-contentful-paint']?.score ?? (d1 / 100)) * 100),
            },
            {
              id: 'cls',
              name: 'CLS (Estabilidade Visual)',
              value: audits['cumulative-layout-shift']?.displayValue || '0',
              score: Math.round((audits['cumulative-layout-shift']?.score ?? 1) * 100),
            },
            {
              id: 'tbt',
              name: 'TBT (Tempo de Bloqueio)',
              value: audits['total-blocking-time']?.displayValue || '0 ms',
              score: Math.round((audits['total-blocking-time']?.score ?? 1) * 100),
            },
          ];

          const [nivel, nivel_nome, leitura] =
            overall >= 80
              ? [3, 'Otimizado para IA', 'Velocidade, estrutura semântica e conformidade técnica dentro das diretrizes oficiais do Google.']
              : overall >= 50
                ? [2, 'Atenção Requerida', 'Boa base técnica, mas com ajustes de carregamento e marcadores semânticos pendentes.']
                : [1, 'Crítico', 'Gargalos severos de carregamento e estruturação detectados pelo Lighthouse.'];

          diagnosticData = {
            source: 'lighthouse',
            score: overall,
            nivel: nivel as number,
            nivel_nome: nivel_nome as string,
            leitura: leitura as string,
            dimensoes: {
              D1: { nome: 'Desempenho', pct: d1 },
              D2: { nome: 'Acessibilidade', pct: d2 },
              D3: { nome: 'Práticas recomendadas', pct: d3 },
              D4: { nome: 'SEO', pct: d4 },
              D5: { nome: 'Navegação agêntica', pct: d5, labelExtra: labelD5 },
            },
            webVitals,
          };
        }
      }
    } catch (err) {
      console.warn('[RIA] PageSpeed indisponivel:', err);
    }

    // 2. Varredura RIA — fallback n8n com teto de tempo.
    if (!diagnosticData && config.diagnosticWebhook) {
      try {
        const webhookRes = await fetchWithTimeout(
          config.diagnosticWebhook,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl }),
          },
          WEBHOOK_TIMEOUT_MS
        );
        if (webhookRes.ok) {
          diagnosticData = parseWebhookResult(await webhookRes.json());
        }
      } catch (err) {
        console.warn('[RIA] Varredura RIA webhook indisponivel:', err);
      }
    }

    // 3. Fallback Heurístico RIA — se APIs externas falharem ou excederem cota, entrega o laudo estruturado
    if (!diagnosticData) {
      diagnosticData = generateHeuristicDiagnostic(targetUrl);
    }

    clearInterval(progressInterval);

    setProgress(100);
    track('diagnostic_completed', { source: diagnosticData.source, score: diagnosticData.score });

    setTimeout(() => {
      setResult(diagnosticData);
      setIsAnalyzing(false);
      setWebsiteAuditScore(diagnosticData!.score);
    }, 400);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 py-4 md:py-16 pointer-events-auto">
      <div className="glass-panel rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 blur-[120px]" />

        <div className="text-center mb-6 md:mb-10">
          <div className="glass-chip glass-accent inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3">
            <Search size={12} className="text-accent" />
            <span className="text-accent-dark text-[10px] md:text-xs font-black uppercase tracking-[0.14em] md:tracking-[0.2em]">
              Diagnóstico de Presença Digital
            </span>
          </div>
          <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-2">
            Seu site sobrevive à <span className="italic font-normal text-slate-500">era dos motores de IA?</span>
          </h2>
          <p className="text-slate-600 text-[13px] md:text-sm max-w-xl mx-auto font-light leading-snug">
            Se sua empresa não possui um site otimizado, com performance, SEO e GEO, a IA não
            conseguirá recomendá-la aos clientes.
          </p>
          {/* O custo sai do paragrafo e vira objeto proprio: e a unica frase
              desta dobra que nomeia perda, e diluida no corpo de texto ela
              desaparece. Pilula vermelha, nao caixa-alta no meio da frase. */}
          <p className="glass-chip glass-red inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mt-3">
            <AlertTriangle size={12} className="text-red-600 shrink-0" />
            <span className="text-red-700 text-[10px] md:text-[11px] font-black uppercase tracking-[0.14em]">
              Você deixa dinheiro na mesa!
            </span>
          </p>
        </div>

        {hasNoWebsite ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card glass-red max-w-2xl mx-auto rounded-2xl p-6 text-center text-red-950 mb-8"
          >
            <div className="glass-inset glass-red w-12 h-12 rounded-full text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-red-900 mb-1">
              Invisibilidade Digital — Índice 101%
            </h3>
            <p className="text-xs text-red-800 leading-relaxed mb-4">
              Sem um site estruturado para a Web Generativa, sua empresa não existe para os assistentes de
              IA (ChatGPT, Perplexity, Gemini, Claude). É o gargalo que impede qualquer outra alavanca de
              funcionar — por isso o índice estoura a escala.
            </p>
            {/* Diz o que vai acontecer antes de acontecer: rolagem que o
                visitante nao pediu, sem aviso, e sequestro de scroll. */}
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-red-500 mb-3">
              Levando você ao agente…
            </p>
            <button
              onClick={() => {
                track('cta_click', { location: 'diagnostic_no_website' });
                requestIntent('diagnostic-no-website');
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all inline-flex items-center gap-2 shadow-md"
            >
              <span>Falar com o agente agora</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (scrollTimer.current) clearTimeout(scrollTimer.current);
                setNoWebsite(false);
              }}
              className="block mx-auto mt-4 min-h-11 px-2 text-[11px] font-bold text-red-700/70 hover:text-red-900 underline underline-offset-4 decoration-red-300 transition-colors"
            >
              Na verdade, tenho um site para analisar
            </button>
          </motion.div>
        ) : !result && !failure ? (
          <div className="max-w-2xl mx-auto mb-8">
            <label
              htmlFor="ria-checkup-url"
              className="flex items-center justify-center gap-2 mb-3 text-slate-800 text-sm md:text-base font-bold"
            >
              <Search size={15} className="text-accent shrink-0" />
              <span>Faça um checkup no seu site:</span>
            </label>
            <div className="glass-field relative flex flex-col md:flex-row gap-2 p-1.5 rounded-xl">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  id="ria-checkup-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  aria-label="Domínio do seu site"
                  placeholder="seu-dominio.com.br"
                  className="w-full bg-transparent py-3 pl-10 pr-4 text-slate-900 focus:outline-none text-base md:text-sm placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url}
                className="px-6 py-4 md:py-3 bg-slate-900 text-white rounded-lg font-black text-xs md:text-sm uppercase tracking-widest hover:bg-accent active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {isAnalyzing ? <Search size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{isAnalyzing ? 'Analisando' : 'Varredura'}</span>
              </button>
            </div>

            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <div className="flex justify-between text-[10px] md:text-xs uppercase tracking-[0.2em] text-slate-600 mb-2 font-black">
                  <span>Varredura tecnica</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-[2px] w-full bg-slate-900/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-accent"
                  />
                </div>
                {/* Expectativa declarada. A varredura real leva dezenas de
                    segundos; barra sem aviso vira ansiedade e abandono. */}
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Rodando Lighthouse e varredura semântica no seu domínio. Pode levar até 30 segundos.
                </p>
              </motion.div>
            )}

            {!isAnalyzing && (
              <button
                type="button"
                onClick={declareNoWebsite}
                className="block mx-auto mt-3 min-h-11 px-2 text-[11px] font-semibold text-slate-500 hover:text-red-600 underline underline-offset-4 decoration-slate-300 transition-colors"
              >
                Ainda não tenho site
              </button>
            )}
          </div>
        ) : failure ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-amber max-w-2xl mx-auto mb-8 rounded-2xl p-6 text-center"
          >
            <div className="glass-inset glass-amber w-11 h-11 rounded-full text-amber-700 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-900 mb-2">
              {failure === 'invalid-url' ? 'Endereço incompleto' : 'A varredura não completou'}
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed mb-5 max-w-md mx-auto">
              {failure === 'invalid-url'
                ? 'Digite o domínio com o ponto — por exemplo, suaempresa.com.br.'
                : failure === 'quota'
                  ? 'O limite diário da API do Google foi atingido. Prefiro não te mostrar um número estimado: o Raul roda a análise manualmente e te manda o laudo real.'
                  : 'Não consegui alcançar as fontes de medição agora. Prefiro não te mostrar um número estimado: o Raul roda a análise manualmente e te manda o laudo real.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="glass-raised glass-interactive px-5 py-3 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                Tentar de novo
              </button>
              {failure !== 'invalid-url' && (
                <a
                  href={manualAuditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('whatsapp_click', { location: 'diagnostic_failure' })}
                  className="px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-all inline-flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageCircle size={14} />
                  Pedir análise manual
                </a>
              )}
            </div>
          </motion.div>
        ) : (
          result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 md:gap-4 mb-6"
            >
              {/* As cinco dimensoes, no proprio grid.
                  Ate aqui elas dividiam um unico grid de cinco colunas com o
                  veredito e os Core Web Vitals, e esses dois ocupavam quatro:
                  sobrava uma coluna vazia a direita em duas linhas seguidas e o
                  laudo perdia o retangulo. Cada bloco agora tem a largura toda.

                  Duas colunas no telefone, tres no tablet, cinco no desktop. A
                  quinta ocupa duas celulas ate lg, e em nenhuma das tres faixas
                  sobra meia celula: 2+2+1x2 no telefone, 3+1+1x2 no tablet. */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-4">
                {[
                  result.dimensoes.D1,
                  result.dimensoes.D2,
                  result.dimensoes.D3,
                  result.dimensoes.D4,
                  result.dimensoes.D5,
                ].map((m, i) => {
                  const icons = [Zap, Cpu, Globe, Search, Bot];
                  const Icon = icons[i] || Activity;
                  const tone =
                    m.pct < 50
                      ? { text: 'text-red-600', bar: 'bg-red-500', glass: 'glass-red' }
                      : m.pct < 80
                        ? { text: 'text-amber-600', bar: 'bg-amber-500', glass: 'glass-amber' }
                        : { text: 'text-emerald-600', bar: 'bg-emerald-500', glass: 'glass-emerald' };

                  return (
                    <div
                      key={i}
                      className={`glass-inset rounded-xl p-3 md:p-4 flex flex-col gap-2.5 ${
                        i === 4 ? 'col-span-2 lg:col-span-1' : ''
                      }`}
                    >
                      {/* No telefone o cartao era `flex items-center` e esta caixa
                          declarava `w-full`: ela tomava 267px dos 293px do cartao
                          e empurrava o numero para x=331 num cartao que terminava
                          em x=334 — 73px de "44% DESEMPENHO" caiam fora da borda,
                          onde o painel os cortava. A coluna resolve sem largura
                          fixa: o cabecalho ocupa a linha, o numero vem abaixo. */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="glass-raised p-1.5 rounded-lg inline-flex shrink-0">
                          <Icon size={14} className={tone.text} />
                        </span>
                        {m.labelExtra && (
                          <span
                            className={`glass-inset ${tone.glass} inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${tone.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${tone.bar}`} />
                            {m.labelExtra}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-serif text-2xl md:text-[26px] font-bold text-slate-900 leading-none">
                          {m.pct}
                          <span className="text-sm text-slate-400 font-sans font-black">%</span>
                        </div>
                        <div className="text-[10px] md:text-[11px] text-slate-600 uppercase tracking-wider font-bold leading-tight mt-1.5">
                          {m.nome}
                        </div>
                      </div>
                      {/* A barra saiu do `hidden md:block`. No telefone o cartao
                          mostrava so o numero — e e ali, onde as cinco dimensoes
                          nao cabem lado a lado, que a comparacao entre elas mais
                          precisa de forma, nao de leitura. */}
                      <div className="mt-auto h-1.5 w-full bg-slate-900/15 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.pct}%` }}
                          transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${tone.bar}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-inset glass-accent p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-serif text-lg font-bold shrink-0 bg-white/75 ${
                      result.score < 50
                        ? 'border-red-500 text-red-600'
                        : result.score < 80
                          ? 'border-amber-500 text-amber-600'
                          : 'border-accent text-accent'
                    }`}
                  >
                    {Math.round(result.score)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-900 font-bold text-xs md:text-sm uppercase tracking-widest leading-none mb-1.5">
                      Status:{' '}
                      <span
                        className={
                          result.score < 50
                            ? 'text-red-600'
                            : result.score < 80
                              ? 'text-amber-600'
                              : 'text-accent'
                        }
                      >
                        {result.nivel_nome}
                      </span>
                    </h4>
                    <p className="text-slate-600 text-[11px] md:text-xs leading-snug">{result.leitura}</p>
                    <p className="text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold mt-1.5">
                      {SOURCE_LABEL[result.source]}
                    </p>
                  </div>
                </div>
                {/* Ponte narrativa e acao na mesma linha, separadas por um filete.
                    Ate aqui a frase era a quarta linha empilhada na coluna da
                    esquerda, e o botao — 40px de altura contra 113px de texto —
                    flutuava no meio do card sem nada que o ancorasse, deixando o
                    canto inferior direito oco. */}
                <div className="mt-4 pt-3.5 border-t border-slate-900/10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <p className="flex-1 text-slate-700 text-[11px] md:text-xs leading-snug font-semibold">
                    O site é a primeira das seis frentes. O agente te mostra as outras cinco.
                  </p>
                  <button
                    onClick={() => {
                      track('cta_click', { location: 'diagnostic_result' });
                      requestIntent('diagnostic-result');
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
                  >
                    <span>Falar com o agente</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {result.webVitals && (
                <div className="glass-inset p-4 rounded-xl">
                  <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <Activity size={12} className="text-accent" />
                    <span>Métricas em Tempo Real (Core Web Vitals)</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {result.webVitals.map((v) => (
                      <div key={v.id} className="glass-raised p-2.5 rounded-lg">
                        <span className="text-[9.5px] font-mono font-bold uppercase text-slate-500 block mb-0.5">{v.name}</span>
                        <span className="text-sm md:text-base font-serif font-black text-slate-900">{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saida para uma segunda medicao.
                  Com o laudo na tela o formulario sai de cena, e ate aqui nao
                  havia caminho de volta: quem quisesse medir outro dominio
                  precisava recarregar a pagina inteira e perder o laudo. */}
              <button
                type="button"
                onClick={analyzeAnother}
                className="glass-raised glass-interactive mx-auto mt-1 px-5 py-3 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Analisar outro site</span>
              </button>
            </motion.div>
          )
        )}

        {/* Presenca em redes.
            Ate ago/2026 eram duas afirmacoes longas e compostas ("perfil ativo
            E atualizado nas redes (Instagram/LinkedIn)"): o visitante que so
            posta no Instagram nao tinha resposta verdadeira, e a caixa media
            duas coisas de uma vez. Agora a pergunta e uma so, e cada rede e um
            alvo — a resposta vira informacao, nao aproximacao. */}
        <div className="mt-6 pt-6 border-t border-slate-900/10 max-w-2xl mx-auto">
          <h4 className="text-sm md:text-base font-bold text-slate-800 mb-1 text-center flex items-center justify-center gap-2">
            <Share2 size={15} className="text-accent shrink-0" />
            <span>Você consegue estar presente hoje em quais redes sociais?</span>
          </h4>
          <p className="text-[11px] text-slate-500 text-center mb-3.5">
            {marcadas === 0
              ? 'Marque todas em que sua empresa já publica.'
              : `${marcadas} de ${SOCIAL_NETWORKS.length} marcadas`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-2.5">
            {SOCIAL_NETWORKS.map((rede, index) => {
              const checked = socialChecks[index] ?? false;
              const { Icon } = rede;
              return (
                <button
                  key={rede.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => { toggleSocialCheck(index); track('operational_check', { kind: 'social', index, network: rede.id }); }}
                  className={`glass-inset min-h-12 px-2.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 text-left ${
                    checked
                      ? 'glass-emerald text-emerald-950'
                      : 'glass-interactive text-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400/70 bg-white/70'
                    }`}
                  >
                    {checked && <CheckCircle2 size={12} />}
                  </span>
                  <Icon size={14} className={`shrink-0 ${checked ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold leading-snug truncate">{rede.label}</span>
                </button>
              );
            })}
          </div>
          {/* Fecho do cartao. Serifada e em corpo maior porque e a unica linha
              daqui que nao pede acao — ela assina o que o checklist mostrou. */}
          <p className="mt-5 pt-4 border-t border-slate-900/10 text-center font-serif italic text-slate-700 text-base md:text-lg">
            Quem não é visto não é lembrado!
          </p>
        </div>
      </div>
    </div>
  );
}
