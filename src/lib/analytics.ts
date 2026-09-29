import { hasAnalyticsConsent } from './consent';

// Camada de eventos agnostica de provedor.
//
// Sem VITE_GA_MEASUREMENT_ID definido, track() e um no-op silencioso: a pagina
// funciona identica, so nao reporta. Assim o codigo de produto ja chama os
// eventos certos antes de existir uma conta de analytics.

export type RiaEvent =
  | 'chapter_view'
  | 'cta_click'
  /** Um CTA levou o lead ao agente carregando intencao. Ver content/intents.ts. */
  | 'agent_intent'
  /** Visitante declarou que ainda nao tem site — caminho 'novo', rota curta ao agente. */
  | 'no_website_declared'
  /** Visitante escolheu um dos dois caminhos (criar ou otimizar). */
  | 'path_pick'
  /** O scanner do hero disparou as duas medicoes (Lighthouse e Is Agentic). */
  | 'scan_started'
  /** As duas medicoes resolveram, com nota ou com falha nomeada — e o evento carrega qual (ScanFinishedParams). */
  | 'scan_finished'
  | 'agent_message_sent'
  | 'agent_replied'
  | 'agent_failed'
  | 'whatsapp_click'
  | 'qualification_started'
  | 'qualification_step'
  | 'qualification_completed';

type Params = Record<string, string | number | boolean | undefined>;

/**
 * O desfecho de um instrumento de medição: `ok` quando houve nota, ou o motivo
 * nomeado da falha — os mesmos nomes que a tela imprime como "não medido".
 * `rate-limited` é o teto do Is Agentic (10 varreduras por minuto por IP, e o IP
 * que eles veem é o da nossa função de borda: o orçamento é do site inteiro);
 * `quota` é o equivalente do PageSpeed.
 */
export type ScanOutcome = 'ok' | 'rate-limited' | 'unreachable' | 'invalid-url' | 'quota';

/** `scan_finished` sempre diz como cada instrumento terminou. Sem isto, uma
 *  campanha que estoura o teto do terceiro seria indistinguível de desinteresse. */
export interface ScanFinishedParams {
  google_outcome: ScanOutcome;
  agentic_outcome: ScanOutcome;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}



const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? '';

/** True quando existe um destino configurado. Exposto para testes. */
export const analyticsEnabled = Boolean(measurementId);

let bootstrapped = false;

/**
 * Injeta o gtag.js uma unica vez, sob demanda. Nao roda no primeiro paint —
 * so quando o primeiro evento acontece — para nao competir com o LCP.
 */
function bootstrap() {
  if (bootstrapped || !analyticsEnabled || typeof document === 'undefined') return;
  bootstrapped = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

/** Registra um evento. Nunca lanca — analytics jamais derruba a pagina. */
export function track(event: 'scan_finished', params: ScanFinishedParams): void;
export function track(event: Exclude<RiaEvent, 'scan_finished'>, params?: Params): void;
export function track(event: RiaEvent, params: Params | ScanFinishedParams = {}): void {
  if (!analyticsEnabled) return;
  // LGPD: sem consentimento explícito, nada é carregado nem enviado. Esta
  // linha separa 'medição consentida' de 'tratamento sem base legal', e vem
  // ANTES de bootstrap() de propósito: o script do gtag não pode sequer
  // chegar ao <head> antes de o visitante decidir.
  if (!hasAnalyticsConsent()) return;
  try {
    bootstrap();
    window.gtag?.('event', event, params);
  } catch {
    /* silencio proposital */
  }
}
