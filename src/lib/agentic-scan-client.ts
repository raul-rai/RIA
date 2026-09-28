// Consumo da nossa ponte /api/agentic-scan.
//
// `fetch` + leitor de stream em vez de EventSource por uma razao so: EventSource
// nao da para cancelar com AbortSignal, e a medicao precisa morrer junto com o
// componente quando o visitante muda de ideia no meio.

import { config } from '../config';
import { parseSseFrames, sseData } from './sse';
import { parseAgenticReport, type AgenticFailure, type AgenticReport } from './agentic-report';

export type ScanEvent =
  | { type: 'progress'; done: number; total: number }
  | { type: 'report'; report: AgenticReport }
  | { type: 'failure'; reason: AgenticFailure };

// Interna: so `scanAgentic` e publico deste modulo (e o que SCAN-05/SCAN-07
// e o plano de implementacao documentam como interface). Nada fora daqui
// monta a URL da nossa ponte, entao nao ha razao para exportar.
function scanUrl(target: string): string {
  return `${config.agenticScanPath}?url=${encodeURIComponent(target)}`;
}

export async function scanAgentic(
  target: string,
  onEvent: (event: ScanEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(scanUrl(target), { signal });
  } catch {
    if (!signal?.aborted) onEvent({ type: 'failure', reason: 'unreachable' });
    return;
  }

  if (!response.ok || !response.body) {
    onEvent({ type: 'failure', reason: 'unreachable' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = parseSseFrames(buffer);
      buffer = rest;

      for (const frame of frames) {
        const evento = sseData(frame) as Record<string, unknown> | null;
        if (!evento) continue;

        if (evento.type === 'progress') {
          onEvent({ type: 'progress', done: Number(evento.done) || 0, total: Number(evento.total) || 0 });
        } else if (evento.type === 'report') {
          const report = parseAgenticReport(evento.report);
          // Laudo que nao parseia e ausencia de medicao, nao nota ruim.
          onEvent(report ? { type: 'report', report } : { type: 'failure', reason: 'unreachable' });
        } else if (evento.type === 'failure') {
          onEvent({ type: 'failure', reason: evento.reason as AgenticFailure });
        }
      }
    }
  } catch {
    if (!signal?.aborted) onEvent({ type: 'failure', reason: 'unreachable' });
  } finally {
    reader.releaseLock();
  }
}
