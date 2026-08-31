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
import {
  readAgenticReadiness, overallScore, type AgenticCheck,
} from '../lib/agentic-readiness';

/** Qual instrumento produziu o laudo. Os dois medem coisas diferentes e a
 *  pagina precisa dizer qual foi — senao o mesmo botao entrega dois produtos. */
type DiagnosticSource = 'lighthouse' | 'ria';

export type WebVital = {
  id: string;
  name: string;
  value: string;
  score: number;
};

type DiagnosticDimension = {
  nome: string;
  /** `null` = não medido. NUNCA 0 para isso: zero a tela lê como reprovação. */
  pct: number | null;
  labelExtra?: string;
  /** Só a D5: as auditorias que compõem a nota, para o laudo poder ser conferido. */
  checks?: AgenticCheck[];
};

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

/** Uma escala de cor só para o laudo inteiro.
 *
 *  Até ago/2026 a nota geral acendia em `accent` (o teal da marca) e as
 *  dimensões acendiam em `emerald` na mesma faixa — dois verdes diferentes
 *  dizendo a mesma coisa na mesma tela, o que faz o olho procurar uma
 *  distinção que não existe. Aqui a faixa é uma só e vale para a nota, para as
 *  cinco dimensões e para os Core Web Vitals. */
function toneOf(pct: number) {
  if (pct < 50) return { text: 'text-red-600', bar: 'bg-red-500', glass: 'glass-red' };
  if (pct < 80) return { text: 'text-amber-600', bar: 'bg-amber-500', glass: 'glass-amber' };
  return { text: 'text-accent', bar: 'bg-accent', glass: 'glass-accent' };
}

/** O tom de "não medido". Cinza porque ausência de medição não é nota. */
const NEUTRO = { text: 'text-slate-400', bar: 'bg-slate-300', glass: 'glass-slate' };

/** "LCP (Maior Pintura)" -> ["LCP", "Maior Pintura"]. A sigla ancora a coluna;
 *  a tradução vira legenda embaixo, em vez de disputar a mesma linha. */
function splitVitalName(name: string): [string, string] {
  const m = name.match(/^(.+?)\s*\((.+)\)\s*$/);
  return m ? [m[1], m[2]] : [name, ''];
}

/**
 * Teto de espera do PageSpeed.
 *
 * Era 20 s, e a tela ao lado promete "pode levar até 30 segundos". A diferença
 * não era teórica: medido contra a API de produção, uma varredura com as quatro
 * categorias leva ~21 s na primeira chamada (o PSI só devolve rápido quando o
 * resultado já está no cache dele). Ou seja, o app desistia um segundo antes da
 * resposta chegar e mostrava "a varredura não completou" para um site que o
 * Lighthouse tinha acabado de medir.
 *
 * O número agora é o mesmo que a página promete. Se um dia precisar de mais,
 * o texto da barra de progresso muda junto.
 */
const PAGESPEED_TIMEOUT_MS = 30000;
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
      // Default 0, não 100. Quando o n8n omite D5, a leitura correta é "não
      // medido" — antes o default era nota máxima com etiqueta "3/3" fixa, ou
      // seja, a ausência de medição virava aprovação perfeita na tela.
      /**
       * Quando o n8n omite D5, a leitura correta é "não medido" — e agora a
       * tela diz isso, em vez de imprimir 0%, que o visitante lê como
       * reprovação. O comentário antigo aqui já afirmava essa intenção; o
       * código entregava um zero.
       */
      D5: (() => {
        const bruto = dim?.['D5']?.pct;
        if (bruto === undefined || bruto === null || !Number.isFinite(Number(bruto))) {
          return { nome: 'Navegação agêntica', pct: null, labelExtra: 'não medido' };
        }
        const pct = toNumber(bruto, 0);
        return {
          nome: 'Navegação agêntica',
          pct,
          labelExtra: `${Math.round((pct / 100) * 3)}/3`,
        };
      })(),
    },
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
  const overallTone = toneOf(result?.score ?? 0);

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

          const audits = data?.lighthouseResult?.audits || {};

          /**
           * D5, agora medida. Ver src/lib/agentic-readiness.ts para o que
           * estava aqui antes e por que saiu — em resumo: era a nota de SEO
           * disfarçada, entrando duas vezes na média.
           *
           * `null` quando as três auditorias não vêm completas. Nesse caso a
           * dimensão sai marcada como não medida e o peso dela é
           * redistribuído, em vez de contar zero.
           */
          const agentic = readAgenticReadiness(audits);
          const overall = overallScore({ d1, d2, d3, d4, d5: agentic?.pct ?? null });
          const webVitals: WebVital[] = [
            {
              id: 'lcp',
              name: 'LCP (Maior Pintura)',
              value: audits['largest-contentful-paint']?.displayValue || '—',
              score: Math.round((audits['largest-contentful-paint']?.score ?? (d1 / 100)) * 100),
            },
            {
              id: 'fcp',
              name: 'FCP (Primeira Pintura)',
              value: audits['first-contentful-paint']?.displayValue || '—',
              score: Math.round((audits['first-contentful-paint']?.score ?? (d1 / 100)) * 100),
            },
            {
              id: 'cls',
              name: 'CLS (Estabilidade Visual)',
              value: audits['cumulative-layout-shift']?.displayValue || '—',
              score: Math.round((audits['cumulative-layout-shift']?.score ?? 1) * 100),
            },
            {
              id: 'tbt',
              name: 'TBT (Tempo de Bloqueio)',
              value: audits['total-blocking-time']?.displayValue || '—',
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
              D5: agentic
                ? {
                    nome: 'Navegação agêntica',
                    pct: agentic.pct,
                    labelExtra: `${agentic.passed}/${agentic.total}`,
                    checks: agentic.checks,
                  }
                : { nome: 'Navegação agêntica', pct: null, labelExtra: 'não medido' },
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

    // 3. Nenhuma fonte respondeu — e aqui a página para.
    //
    // Até ago/2026 existia um terceiro passo: `generateHeuristicDiagnostic`,
    // que derivava nota de performance e Core Web Vitals ("LCP 2.8 s",
    // "CLS 0.12", "TBT 210 ms") de um hash do NOME DO DOMÍNIO, e publicava o
    // resultado sob o rótulo "Fonte: varredura RIA". Era determinístico, o que
    // piorava tudo: o mesmo domínio devolvia sempre o mesmo laudo, então nem
    // recarregar denunciava a invenção. Qualquer visitante que abrisse o
    // PageSpeed Insights em seguida recebia a prova de que o laudo dele tinha
    // sido forjado — numa página que vende diagnóstico.
    //
    // O estado de falha abaixo já existia e já dizia a frase certa ("prefiro
    // não te mostrar um número estimado"), mas era inalcançável: o fallback
    // fabricava antes. Agora ele é o caminho real.
    clearInterval(progressInterval);

    if (!diagnosticData) {
      track('diagnostic_failed', { reason: quotaExceeded ? 'quota' : 'unreachable' });
      setFailure(quotaExceeded ? 'quota' : 'unreachable');
      setProgress(0);
      setIsAnalyzing(false);
      return;
    }

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
                  className="w-full bg-transparent py-3 pl-10 pr-4 text-slate-900 text-base md:text-sm placeholder:text-slate-400"
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
              className="mb-6 md:mb-8 space-y-3 md:space-y-4"
            >
              {/* O veredito vem primeiro.
                  A dobra pergunta "seu site sobrevive?" — a resposta nao pode
                  chegar depois de cinco cartoes de detalhe. Ate ago/2026 o laudo
                  era um unico grid de cinco colunas onde o veredito e os Core
                  Web Vitals ocupavam quatro: sobrava uma coluna vazia a direita
                  em cada uma das duas linhas, e o bloco perdia o retangulo.
                  Agora sao tres blocos empilhados, cada um com o proprio grid,
                  e nenhum deles deixa coluna orfa. */}
              <div className="glass-inset glass-accent rounded-2xl p-4 md:p-5">
                <div className="flex items-start sm:items-center gap-4 md:gap-5">
                  {/* Anel preenchido ate a nota. O circulo antigo tinha 40px e
                      borda uniforme: mostrava o numero, nao a distancia que
                      falta para 100 — que e o argumento da secao. */}
                  <div className={`relative w-16 h-16 md:w-[76px] md:h-[76px] shrink-0 ${overallTone.text}`}>
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `conic-gradient(currentColor ${result.score}%, rgba(15,23,42,0.10) 0)` }}
                    />
                    <div className="absolute inset-[5px] md:inset-[6px] rounded-full bg-white/90 flex flex-col items-center justify-center">
                      <span className="font-serif text-xl md:text-2xl font-bold leading-none">
                        {Math.round(result.score)}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 leading-none tracking-tight mt-0.5">/100</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs md:text-sm font-bold uppercase tracking-[0.16em] leading-none">
                      <span className="text-slate-500">Status: </span>
                      <span className={overallTone.text}>{result.nivel_nome}</span>
                    </h4>
                    <p className="text-slate-600 text-[11px] md:text-xs leading-relaxed mt-2">{result.leitura}</p>
                    <p className="text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold mt-2">
                      {SOURCE_LABEL[result.source]}
                    </p>
                  </div>
                </div>
                {/* Ponte narrativa e acao na mesma linha, separadas por um filete:
                    a frase diz por que existe o botao, e antes ela estava
                    empilhada com mais quatro linhas na coluna da esquerda. */}
                <div className="mt-4 pt-3.5 border-t border-slate-900/10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <p className="flex-1 text-slate-700 text-[11px] md:text-xs leading-snug font-semibold">
                    O site é a primeira das três frentes. O agente te mostra as outras duas.
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

              {/* As cinco dimensoes que sustentam a nota.
                  Duas colunas no telefone e cinco no desktop; a quinta ocupa a
                  linha inteira nos tamanhos pares para nao sobrar meia celula.
                  A barra saiu do `hidden md:block`: no telefone o cartao mostrava
                  so o numero, e era justamente onde a comparacao entre as cinco
                  dimensoes precisava de forma, nao de leitura. */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 md:gap-3.5">
                {[
                  result.dimensoes.D1,
                  result.dimensoes.D2,
                  result.dimensoes.D3,
                  result.dimensoes.D4,
                  result.dimensoes.D5,
                ].map((m, i) => {
                  const icons = [Zap, Cpu, Globe, Search, Bot];
                  const Icon = icons[i] || Activity;
                  /* Não medido não tem cor de nota: acender vermelho num
                     "não sei" é a mesma mentira que acender verde. */
                  const medido = m.pct !== null;
                  const tone = medido ? toneOf(m.pct!) : NEUTRO;

                  return (
                    <div
                      key={i}
                      className={`glass-inset rounded-xl p-3 md:p-3.5 flex flex-col gap-2.5 ${
                        i === 4 ? 'col-span-2 lg:col-span-1' : ''
                      }`}
                    >
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
                          {medido ? (
                            <>
                              {m.pct}
                              <span className="text-sm text-slate-400 font-sans font-black">%</span>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                        <div className="text-[10px] md:text-[11px] text-slate-600 uppercase tracking-wider font-bold leading-tight mt-1.5">
                          {m.nome}
                        </div>
                      </div>

                      {/* As auditorias que compõem a D5, nomeadas.
                          É o que separa "nota" de "alegação": o visitante pode
                          abrir o PageSpeed e conferir cada uma pelo id. */}
                      {m.checks && (
                        <ul className="flex flex-col gap-1">
                          {m.checks.map((c) => (
                            <li key={c.id} className="flex items-center gap-1.5 text-[10px] leading-tight">
                              {c.ok ? (
                                <CheckCircle2 size={11} className="text-accent shrink-0" aria-hidden="true" />
                              ) : (
                                <AlertTriangle size={11} className="text-red-600 shrink-0" aria-hidden="true" />
                              )}
                              <span className={c.ok ? 'text-slate-600' : 'text-red-700 font-semibold'}>
                                {c.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-auto h-1.5 w-full bg-slate-900/10 rounded-full overflow-hidden">
                        {medido && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${tone.bar}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/*
                O LIMITE DA D5, dito na mesma tela que mostra a nota.

                As três auditorias medem se um motor CONSEGUE CHEGAR e SEGUIR a
                página. É condição necessária para ser citado, não suficiente:
                nenhuma delas responde se o HTML servido já traz o conteúdo
                antes do JavaScript rodar — e o Lighthouse audita a página
                RENDERIZADA, então ele não tem como responder isso.

                Declarar o que o instrumento NÃO alcança é o que separa este
                laudo do que ele era: uma função degrau da nota de SEO,
                publicada como se fosse medição independente.
              */}
              {result.dimensoes.D5.checks && (
                <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed">
                  <strong className="text-slate-600">Sobre a navegação agêntica:</strong> as três
                  checagens são auditorias do Lighthouse e dizem se um motor de IA consegue alcançar
                  e percorrer o site. Elas não verificam se o conteúdo já está no HTML antes do
                  JavaScript — essa parte entra no Diagnóstico de Gargalo, feita à mão.
                </p>
              )}

              {result.webVitals && (
                <div className="glass-inset rounded-2xl p-4 md:p-5">
                  <h5 className="text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-[0.12em] md:tracking-[0.16em] text-slate-500 mb-3 flex items-start gap-1.5">
                    <Activity size={12} className="text-accent shrink-0 mt-[1px]" />
                    <span>Métricas em Tempo Real (Core Web Vitals)</span>
                  </h5>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
                    {result.webVitals.map((v) => {
                      // A sigla e a traducao dividiam uma linha so, e "CLS
                      // (Estabilidade Visual)" quebrava onde desse — quatro
                      // cartoes com alturas de rotulo diferentes. Separadas, a
                      // sigla ancora a coluna e a traducao vira legenda.
                      const [sigla, legenda] = splitVitalName(v.name);
                      const tone = toneOf(v.score);
                      return (
                        <div key={v.id} className="glass-raised p-3 rounded-lg flex flex-col">
                          <span className="flex items-center gap-1.5 mb-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.bar}`} />
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.12em] text-slate-600">
                              {sigla}
                            </span>
                          </span>
                          <span className="font-serif text-lg md:text-xl font-black text-slate-900 leading-none">
                            {v.value}
                          </span>
                          {legenda && (
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-tight mt-1.5">
                              {legenda}
                            </span>
                          )}
                        </div>
                      );
                    })}
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
                className="glass-raised glass-interactive mx-auto flex w-fit px-5 py-3 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest items-center justify-center gap-2"
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
