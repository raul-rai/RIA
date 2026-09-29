import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { config } from '../config';
import { useSiteScore } from '../context/SiteScoreContext';
import { normalizeTarget, type AgenticFailure } from '../lib/agentic-report';
import { parseLighthouse, pageSpeedUrl } from '../lib/lighthouse-report';
import { scanAgentic } from '../lib/agentic-scan-client';
import { track } from '../lib/analytics';
import { withDeadline } from '../lib/scan-deadline';

/**
 * As duas medições.
 *
 * Elas rodam EM PARALELO e resolvem separadas: o Lighthouse leva ~10 s e o Is
 * Agentic ~19 s, e cada coluna do laudo publica assim que a sua chega. Encadear
 * as duas faria o visitante esperar a soma dos dois tempos para ver a primeira.
 *
 * Nenhuma falha vira nota. `googleFailure` e `agenticFailure` são estados
 * próprios, que a tela imprime como "não medido" com motivo.
 */

/** Teto de espera do PageSpeed. Medido: ~21 s na primeira chamada (sem cache
 *  no PSI). O texto da tela promete o mesmo número — se um mudar, o outro muda. */
const PAGESPEED_TIMEOUT_MS = 30000;

/** Teto de espera do Is Agentic. A ponte (api/agentic-scan.ts) desiste de cada
 *  fetch upstream aos 40 s; o cliente espera 5 s a mais para que o motivo
 *  nomeado que ela manda chegue antes de o cliente abandonar por conta própria.
 *  Um scan novo leva ~19 s. Sem teto, um Is Agentic pendurado deixava a fase em
 *  'running' para sempre — botão desabilitado, barra parada e o laudo do Google,
 *  já publicado, sem o botão "Entender este laudo". */
const AGENTIC_TIMEOUT_MS = 45000;

export type ScanPhase = 'idle' | 'running' | 'done';
export type GoogleFailure = 'quota' | 'unreachable' | 'invalid-url';

export interface SiteScanState {
  phase: ScanPhase;
  googleFailure: GoogleFailure | null;
  agenticFailure: AgenticFailure | null;
  /** 0–100, alimentado pelos eventos reais do scan agêntico. */
  progress: number;
  start: (input: string) => void;
  cancel: () => void;
}

function useSiteScanState(): SiteScanState {
  const { setGoogle, setAgentic, setTarget, setNoWebsite } = useSiteScore();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [googleFailure, setGoogleFailure] = useState<GoogleFailure | null>(null);
  const [agenticFailure, setAgenticFailure] = useState<AgenticFailure | null>(null);
  const [progress, setProgress] = useState(0);
  const abort = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setPhase('idle');
    setProgress(0);
  }, []);

  const start = useCallback(
    (input: string) => {
      const target = normalizeTarget(input);
      if (!target) {
        setGoogleFailure('invalid-url');
        setAgenticFailure(null);
        return;
      }

      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      const cancelled = () => controller.signal.aborted;

      setPhase('running');
      setProgress(0);
      setGoogleFailure(null);
      setAgenticFailure(null);
      setGoogle(null);
      setAgentic(null);
      // Medir uma URL é, por definição, a retratação de "ainda não tenho site".
      // Sem esta linha a declaração sobrevivia à medição: o capítulo do laudo
      // dizia "sem site não há o que medir" durante a varredura, e, se as duas
      // medições falhassem, o agente abria com a saudação de quem não tem site.
      setNoWebsite(false);
      setTarget(target);
      track('scan_started');


      const google = (async () => {
        // Prazo próprio: estourar o teto do PageSpeed não pode derrubar o
        // scan agêntico, que compartilha o `controller` de cancelamento.
        const psi = withDeadline(controller.signal, PAGESPEED_TIMEOUT_MS);
        try {
          const response = await fetch(pageSpeedUrl(target, config.pageSpeedApiKey), {
            signal: psi.signal,
          });
          if (cancelled()) return;
          if (response.status === 429) {
            setGoogleFailure('quota');
            return;
          }
          const report = response.ok ? parseLighthouse(await response.json()) : null;
          if (cancelled()) return;
          if (report) {
            setGoogle(report);
          } else {
            setGoogleFailure('unreachable');
          }
        } catch {
          if (!cancelled()) setGoogleFailure('unreachable');
        } finally {
          psi.dispose();
        }
      })();

      // O cliente pode terminar sem publicar laudo nem falha (o stream fecha
      // cedo, ou o teto abaixo aborta): sem esta guarda o visitante veria
      // "concluído" sem nota e sem motivo.
      let agenticAnswered = false;
      const agentic = (async () => {
        // Prazo próprio, como no PageSpeed: o teto do agêntico aborta só a
        // varredura agêntica. Abortar o `controller` compartilhado derrubaria
        // também o PageSpeed, que talvez ainda esteja medindo.
        const ag = withDeadline(controller.signal, AGENTIC_TIMEOUT_MS);
        try {
          await scanAgentic(
            target,
            (event) => {
              if (cancelled()) return;
              if (event.type === 'progress') {
                setProgress(event.total ? Math.round((event.done / event.total) * 100) : 0);
              } else if (event.type === 'report') {
                agenticAnswered = true;
                setProgress(100);
                setAgentic(event.report);
              } else {
                agenticAnswered = true;
                setAgenticFailure(event.reason);
              }
            },
            ag.signal
          );
        } catch {
          // Falha inesperada do cliente: tem nome próprio, não vira nota.
        } finally {
          ag.dispose();
          if (!agenticAnswered && !cancelled()) {
            setAgenticFailure('unreachable');
          }
        }
      })();

      void Promise.allSettled([google, agentic]).then(() => {
        if (cancelled()) return;
        setPhase('done');
        track('scan_finished');
      });
    },
    [setGoogle, setAgentic, setTarget, setNoWebsite]
  );

  return { phase, googleFailure, agenticFailure, progress, start, cancel };
}

const ScanContext = createContext<SiteScanState | undefined>(undefined);

/**
 * Uma instância só da medição para a página inteira.
 *
 * O formulário dispara no capítulo 0 e o laudo publica no capítulo 1. Sem este
 * provedor, cada um teria seu próprio estado e o laudo nunca veria o que o
 * formulário começou — o bug não aparece em teste de texto, só na tela.
 *
 * Todo consumidor usa `useScan()`. `useSiteScanState` não é exportado de
 * propósito: chamá-lo de dois lugares criaria duas instâncias.
 */
export function ScanProvider({ children }: { children: React.ReactNode }) {
  return <ScanContext.Provider value={useSiteScanState()}>{children}</ScanContext.Provider>;
}

export function useScan(): SiteScanState {
  const context = useContext(ScanContext);
  if (!context) throw new Error('useScan precisa de um ScanProvider acima');
  return context;
}
