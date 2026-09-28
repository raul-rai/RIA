// Ponte para o Is Agentic (Vercel Labs).
//
// POR QUE ESTA FUNCAO EXISTE
//
// O endpoint de LEITURA deles (/api/v1/report) tem CORS aberto e poderia ser
// chamado direto do navegador. O de DISPARO (/api/scan/stream) nao tem — o
// OPTIONS responde 204 sem Access-Control-Allow-Origin. Como um site que nunca
// foi escaneado precisa do disparo, o caminho inteiro passa por aqui.
//
// POR QUE ELA RESPONDE EM STREAMING
//
// Um scan novo leva ~19 s (medido em 2026-09-21). Segurar a resposta esse tempo
// encosta no teto de resposta inicial da plataforma; devolvendo text/event-stream
// o primeiro byte sai imediatamente. De brinde, o progresso vira real: a barra da
// pagina era um setInterval com incremento aleatorio.
//
// O LIMITE QUE O CHAMADOR PRECISA SABER
//
// Sao 10 scans por minuto POR IP, e o IP visto pelo Is Agentic e o desta funcao,
// nao o do visitante — ou seja, o limite e global do site. Por isso 429 vira um
// evento de falha nomeado ('rate-limited'), que a tela traduz como fila cheia.

import { normalizeTarget, classifyProblem } from '../src/lib/agentic-report';
import { parseSseFrames, sseData } from '../src/lib/sse';

export const config = { runtime: 'edge' };

const BASE = 'https://is-agentic.com';
const UA = 'ria-site/1.0 (+https://raulvieira.vercel.app)';

function sse(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// Retorno achatado, sem uniao discriminada por booleano: sem strictNullChecks
// no tsconfig deste projeto, `if (pronto.ok)` nao restringe `pronto.status` na
// sequencia (o TS so faz esse estreitamento com strictNullChecks ligado). Um
// tipo unico com todos os campos sempre presentes evita depender disso.
async function readReport(
  target: string,
  signal: AbortSignal
): Promise<{ ok: boolean; status: number; code: unknown; body: unknown }> {
  const endpoint = new URL('/api/v1/report', BASE);
  endpoint.searchParams.set('url', target);
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal,
  });
  const body = await response.json().catch(() => null);
  const code = body && typeof body === 'object' ? (body as Record<string, unknown>).code : undefined;
  return { ok: response.ok, status: response.status, code, body };
}

export default async function handler(request: Request): Promise<Response> {
  const alvo = normalizeTarget(new URL(request.url).searchParams.get('url') ?? '');

  // Cancela os dois fetch() de uma vez quando o visitante fecha a aba ou o
  // cliente aborta. Sem isto a funcao segue consumindo o SSE deles ate o fim
  // mesmo sem ninguem ouvindo, gastando o orcamento compartilhado de 10
  // scans/min do site inteiro com uma varredura que ninguem mais quer.
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      const enfileira = (event: unknown) => controller.enqueue(new TextEncoder().encode(sse(event)));

      // Unico ponto de fechamento: chamar `fechar()` de novo (ex.: try e
      // finally chegando ao mesmo close) e inocuo. Fechar um stream que o
      // cliente ja cancelou lancaria — o try/catch aqui absorve isso.
      let fechado = false;
      const fechar = () => {
        if (fechado) return;
        fechado = true;
        try {
          controller.close();
        } catch {
          // stream ja fechado pelo cancelamento do cliente — nada a fazer.
        }
      };

      if (!alvo) {
        enfileira({ type: 'failure', reason: 'invalid-url' });
        fechar();
        return;
      }

      try {
        // 1. Laudo ja arquivado? Devolve na hora — e o caminho barato.
        const pronto = await readReport(alvo, abortController.signal);
        if (pronto.ok) {
          enfileira({ type: 'report', report: pronto.body });
          return;
        }

        // 404 e o unico erro que justifica gastar um scan. Os outros sao falha.
        if (pronto.status !== 404) {
          enfileira({ type: 'failure', reason: classifyProblem(pronto.status, pronto.code) });
          return;
        }

        // 2. Sem laudo: dispara o scan e acompanha ate o arquivamento.
        const scan = new URL('/api/scan/stream', BASE);
        scan.searchParams.set('target', alvo);
        const upstream = await fetch(scan, {
          headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-store', 'User-Agent': UA },
          signal: abortController.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const code = upstream.status === 429 ? 'rate_limit_exceeded' : undefined;
          enfileira({ type: 'failure', reason: classifyProblem(upstream.status, code) });
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let total = 0;
        let done = 0;
        let arquivado = false;

        for (;;) {
          const { done: fim, value } = await reader.read();
          if (fim) break;
          buffer += decoder.decode(value, { stream: true });
          const { frames, rest } = parseSseFrames(buffer);
          buffer = rest;

          for (const frame of frames) {
            const evento = sseData(frame) as Record<string, unknown> | null;
            if (!evento || typeof evento.type !== 'string') continue;
            if (evento.type === 'scan_init' && Array.isArray(evento.checkRoster)) {
              total = evento.checkRoster.length;
            } else if (evento.type === 'check_complete') {
              done += 1;
              enfileira({ type: 'progress', done, total });
            } else if (evento.type === 'scan_archived') {
              arquivado = true;
            } else if (evento.type === 'error') {
              enfileira({ type: 'failure', reason: 'unreachable' });
              return;
            }
          }
        }

        if (!arquivado) {
          enfileira({ type: 'failure', reason: 'unreachable' });
          return;
        }

        // 3. O scan arquivou: rele o laudo, que agora existe.
        const depois = await readReport(alvo, abortController.signal);
        if (depois.ok) enfileira({ type: 'report', report: depois.body });
        else enfileira({ type: 'failure', reason: classifyProblem(depois.status, depois.code) });
      } catch {
        // Aborto do cliente (visitante ja foi embora) nunca vira falha
        // reportada — nao ha mais ninguem para ouvir. Qualquer outra excecao
        // vira falha nomeada; nunca nota.
        if (!abortController.signal.aborted) {
          enfileira({ type: 'failure', reason: 'unreachable' });
        }
      } finally {
        fechar();
      }
    },
    cancel(reason) {
      // O visitante fechou a aba ou o cliente abortou: derruba os fetch()
      // upstream em vez de deixar o scan correr sozinho consumindo o
      // orcamento compartilhado de 10/min do site inteiro.
      abortController.abort(reason);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    },
  });
}
