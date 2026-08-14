import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Globe, Search, Zap, Cpu, ArrowRight, Activity, AlertTriangle,
  CheckCircle2, Share2, MessageCircle, RotateCcw,
} from 'lucide-react';
import { config } from '../config';
import { useVulnerability } from '../context/VulnerabilityContext';
import { whatsappWithMessage } from '../constants/links';
import { track } from '../lib/analytics';

/** Qual instrumento produziu o laudo. Os dois medem coisas diferentes e a
 *  pagina precisa dizer qual foi — senao o mesmo botao entrega dois produtos. */
type DiagnosticSource = 'lighthouse' | 'ria';

type DiagnosticResult = {
  source: DiagnosticSource;
  score: number;
  nivel: number;
  nivel_nome: string;
  leitura: string;
  dimensoes: {
    D1: { nome: string; pct: number };
    D2: { nome: string; pct: number };
    D3: { nome: string; pct: number };
    D4: { nome: string; pct: number };
  };
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
}

/** O n8n e livre para mudar de forma; nada dele chega ao render sem passar aqui. */
function parseWebhookResult(raw: unknown): DiagnosticResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = (Array.isArray(raw) ? raw[0] : raw) as Record<string, any>;
  if (!payload) return null;

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
      D1: readDim('D1', 'Dimensao 1'),
      D2: readDim('D2', 'Dimensao 2'),
      D3: readDim('D3', 'Dimensao 3'),
      D4: readDim('D4', 'Dimensao 4'),
    },
  };
}

interface PotentialDiagnosticProps {
  onWantStrategy?: () => void;
}

export default function PotentialDiagnostic({ onWantStrategy }: PotentialDiagnosticProps) {
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
      'Ola Raul, tentei rodar a varredura no site e ela nao completou.',
      '',
      `Dominio: ${url || '(nao informado)'}`,
      '',
      'Pode fazer a analise manualmente?',
    ].join('\n')
  );

  const reset = () => {
    setResult(null);
    setFailure(null);
    setProgress(0);
  };

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
      ['PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'BEST_PRACTICES'].forEach((c) => params.append('category', c));
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
          const d2 = Math.round((categories.seo?.score ?? 0) * 100);
          const d3 = Math.round((categories.accessibility?.score ?? 0) * 100);
          const d4 = Math.round((categories['best-practices']?.score ?? 0) * 100);
          const overall = Math.round(d1 * 0.4 + d2 * 0.3 + d3 * 0.15 + d4 * 0.15);

          const [nivel, nivel_nome, leitura] =
            overall >= 80
              ? [3, 'Otimizado para IA', 'Velocidade, estrutura semantica e conformidade dentro das diretrizes do Google.']
              : overall >= 50
                ? [2, 'Atencao Requerida', 'Boa base tecnica, mas com perdas de carregamento e marcadores semanticos incompletos.']
                : [1, 'Critico', 'Gargalos severos de carregamento e estruturacao detectados pelo Lighthouse.'];

          diagnosticData = {
            source: 'lighthouse',
            score: overall,
            nivel: nivel as number,
            nivel_nome: nivel_nome as string,
            leitura: leitura as string,
            dimensoes: {
              D1: { nome: 'Performance (Velocidade)', pct: d1 },
              D2: { nome: 'SEO & Visibilidade', pct: d2 },
              D3: { nome: 'Acessibilidade', pct: d3 },
              D4: { nome: 'Melhores Praticas', pct: d4 },
            },
          };
        }
      }
    } catch (err) {
      console.warn('[RIA] PageSpeed indisponivel:', err);
    }

    // 2. Varredura RIA — fallback, tambem com teto de tempo.
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
        console.warn('[RIA] Varredura RIA indisponivel:', err);
      }
    }

    clearInterval(progressInterval);

    // 3. Nenhum numero inventado. Se as duas fontes falharam, a pagina diz isso.
    if (!diagnosticData) {
      setProgress(0);
      setIsAnalyzing(false);
      setFailure(quotaExceeded ? 'quota' : 'unreachable');
      track('diagnostic_failed', { reason: quotaExceeded ? 'quota' : 'unreachable' });
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
      <div className="premium-glass rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 p-4 md:p-12 relative overflow-hidden bg-white/95 shadow-xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 blur-[120px]" />

        <div className="text-center mb-6 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-3">
            <Search size={12} className="text-accent" />
            <span className="text-accent-dark text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
              Diagnostico de Presenca Digital
            </span>
          </div>
          <h2 className="text-xl md:text-5xl font-serif text-slate-900 mb-2">
            Seu site sobrevive a <span className="italic font-normal text-slate-500">era dos motores de IA?</span>
          </h2>
          <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-snug">
            Se sua empresa nao possui site ou possui um site com SEO deficiente, a IA nao conseguira
            recomenda-la aos clientes.
          </p>
        </div>

        {/* Tem site / nao tem site */}
        <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setNoWebsite(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              !hasNoWebsite
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Globe size={14} />
            <span>Possuo um site para analisar</span>
          </button>

          <button
            onClick={() => setNoWebsite(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              hasNoWebsite
                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Nao tenho um site ainda</span>
          </button>
        </div>

        {hasNoWebsite ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center text-red-950 mb-8 shadow-lg shadow-red-500/5"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-red-900 mb-1">
              Invisibilidade Digital
            </h3>
            <p className="text-xs text-red-800 leading-relaxed mb-4">
              Sem um site estruturado para a Web Generativa, sua empresa nao existe para os assistentes de
              IA (ChatGPT, Perplexity, Gemini, Claude). E o gargalo que impede qualquer outra alavanca de
              funcionar.
            </p>
            <button
              onClick={() => { track('cta_click', { location: 'diagnostic_no_website' }); onWantStrategy?.(); }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all inline-flex items-center gap-2 shadow-md"
            >
              <span>Resolver com a RIA</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : !result && !failure ? (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative flex flex-col md:flex-row gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  aria-label="Dominio do seu site"
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
                <div className="h-[2px] w-full bg-slate-200 rounded-full overflow-hidden">
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
          </div>
        ) : failure ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8 bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center"
          >
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-900 mb-2">
              {failure === 'invalid-url' ? 'Endereco incompleto' : 'A varredura nao completou'}
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed mb-5 max-w-md mx-auto">
              {failure === 'invalid-url'
                ? 'Digite o dominio com o ponto — por exemplo, suaempresa.com.br.'
                : failure === 'quota'
                  ? 'O limite diario da API do Google foi atingido. Prefiro nao te mostrar um numero estimado: o Raul roda a analise manualmente e te manda o laudo real.'
                  : 'Nao consegui alcancar as fontes de medicao agora. Prefiro nao te mostrar um numero estimado: o Raul roda a analise manualmente e te manda o laudo real.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-5 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all inline-flex items-center justify-center gap-2"
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
                  Pedir analise manual
                </a>
              )}
            </div>
          </motion.div>
        ) : (
          result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 mb-6"
            >
              {[result.dimensoes.D1, result.dimensoes.D2, result.dimensoes.D3, result.dimensoes.D4].map((m, i) => {
                const icons = [Zap, Search, Cpu, Globe];
                const Icon = icons[i] || Activity;
                const tone =
                  m.pct < 50
                    ? { text: 'text-red-600', bar: 'bg-red-500' }
                    : m.pct < 80
                      ? { text: 'text-amber-600', bar: 'bg-amber-500' }
                      : { text: 'text-accent', bar: 'bg-accent' };

                return (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-xl p-3 md:p-6 border border-slate-200 flex items-center md:flex-col gap-3 md:gap-4 shadow-sm"
                  >
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0">
                      <Icon size={12} className={tone.text} />
                    </div>
                    <div className="flex-1 md:text-center">
                      <div className="text-xl md:text-3xl font-serif text-slate-900 font-bold mb-1">{m.pct}%</div>
                      <div className="text-[10px] md:text-xs text-slate-600 uppercase tracking-wider font-bold">
                        {m.nome}
                      </div>
                    </div>
                    <div className="hidden md:block h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${tone.bar}`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="col-span-1 md:col-span-2 lg:col-span-4 p-4 bg-accent/10 border border-accent/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-serif text-lg font-bold shrink-0 bg-white ${
                      result.score < 50
                        ? 'border-red-500 text-red-600'
                        : result.score < 80
                          ? 'border-amber-500 text-amber-600'
                          : 'border-accent text-accent'
                    }`}
                  >
                    {Math.round(result.score)}
                  </div>
                  <div>
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
                <button
                  onClick={() => { track('cta_click', { location: 'diagnostic_result' }); onWantStrategy?.(); }}
                  className="px-5 py-3 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 shadow-md shrink-0"
                >
                  <span>Otimizar com IA</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )
        )}

        {/* Presenca em redes */}
        <div className="mt-6 pt-6 border-t border-slate-200/80 max-w-2xl mx-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 text-center flex items-center justify-center gap-2">
            <Share2 size={14} className="text-accent" />
            <span>Presenca e tracao nas redes sociais</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Possuo perfil ativo e atualizado nas redes (Instagram/LinkedIn)', index: 0 },
              { label: 'Tenho canal/link direto para atendimento via IA ou WhatsApp', index: 1 },
            ].map((item) => {
              const checked = socialChecks[item.index];
              return (
                <button
                  key={item.index}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => { toggleSocialCheck(item.index); track('operational_check', { kind: 'social', index: item.index }); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 text-left ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-semibold leading-snug">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
