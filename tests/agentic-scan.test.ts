import {
  describe, it, expect, afterEach,
} from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { normalizeTarget } from '../src/lib/agentic-report';
import { config } from '../src/config';
import { parseSseFrames, sseData } from '../src/lib/sse';
import { scanAgentic } from '../src/lib/agentic-scan-client';
import handler from '../api/agentic-scan';

const root = (p: string) => resolve(process.cwd(), p);

describe('SCAN: alvo do scan', () => {
  it('SCAN-01: completa o esquema quando falta', () => {
    expect(normalizeTarget('exemplo.com.br')).toBe('https://exemplo.com.br/');
  });

  it('SCAN-02: preserva https e http explícitos', () => {
    expect(normalizeTarget('https://exemplo.com.br/pagina')).toBe('https://exemplo.com.br/pagina');
    expect(normalizeTarget('http://exemplo.com.br/')).toBe('http://exemplo.com.br/');
  });

  it('SCAN-03: recusa o que não é endereço público', () => {
    expect(normalizeTarget('')).toBeNull();
    expect(normalizeTarget('sem-ponto')).toBeNull();
    expect(normalizeTarget('ftp://exemplo.com')).toBeNull();
    expect(normalizeTarget('javascript:alert(1)')).toBeNull();
  });

  it('SCAN-04: apara espaço em volta', () => {
    expect(normalizeTarget('  exemplo.com  ')).toBe('https://exemplo.com/');
  });
});

describe('SCAN: fronteira de configuração', () => {
  it('SCAN-05: o domínio do Is Agentic só aparece em config.ts e na função de borda', () => {
    const cliente = readFileSync(root('src/lib/agentic-scan-client.ts'), 'utf-8');
    expect(cliente, 'o cliente fala com a NOSSA rota, não com a deles').not.toContain('is-agentic.com');
    expect(cliente).toContain('config.agenticScanPath');
  });

  it('SCAN-06: a função de borda não inventa nota', () => {
    const fn = readFileSync(root('api/agentic-scan.ts'), 'utf-8');
    const semComentario = fn.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(semComentario, 'nenhum score literal na função').not.toMatch(/score:\s*\d/);
    expect(semComentario).toContain("type: 'failure'");
  });

  it('SCAN-07: a rota da nossa função está em config.ts', () => {
    expect(config.agenticScanPath).toBe('/api/agentic-scan');
  });
});

describe('SCAN: a função de borda (handler)', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  function pedido(url: string): Request {
    return new Request(`https://ria.local/api/agentic-scan?url=${encodeURIComponent(url)}`);
  }

  function sseBody(frames: Record<string, unknown>[]): ReadableStream<Uint8Array> {
    const texto = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join('');
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(texto));
        controller.close();
      },
    });
  }

  async function lerEventos(response: Response): Promise<Record<string, unknown>[]> {
    const eventos: Record<string, unknown>[] = [];
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = parseSseFrames(buffer);
      buffer = rest;
      for (const frame of frames) {
        const evento = sseData(frame) as Record<string, unknown> | null;
        if (evento) eventos.push(evento);
      }
    }
    return eventos;
  }

  it('SCAN-08: laudo já arquivado devolve report sem disparar scan', async () => {
    const chamadas: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      chamadas.push(url);
      if (url.includes('/api/v1/report')) {
        return new Response(JSON.stringify({ score: 80 }), { status: 200 });
      }
      throw new Error(`chamada inesperada: ${url}`);
    }) as typeof fetch;

    const response = await handler(pedido('exemplo.com.br'));
    const eventos = await lerEventos(response);

    expect(chamadas).toHaveLength(1);
    expect(eventos).toEqual([{ type: 'report', report: { score: 80 } }]);
  });

  it('SCAN-09: 404 dispara o scan, emite progress e termina em report', async () => {
    let chamadaReport = 0;
    const chamadas: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      chamadas.push(url);
      if (url.includes('/api/v1/report')) {
        chamadaReport += 1;
        if (chamadaReport === 1) return new Response(JSON.stringify({}), { status: 404 });
        return new Response(JSON.stringify({ score: 91 }), { status: 200 });
      }
      if (url.includes('/api/scan/stream')) {
        return new Response(sseBody([
          { type: 'scan_init', checkRoster: [1, 2] },
          { type: 'check_complete' },
          { type: 'check_complete' },
          { type: 'scan_archived' },
        ]), { status: 200 });
      }
      throw new Error(`chamada inesperada: ${url}`);
    }) as typeof fetch;

    const response = await handler(pedido('exemplo.com.br'));
    const eventos = await lerEventos(response);

    expect(chamadas.filter((u) => u.includes('/api/v1/report'))).toHaveLength(2);
    expect(chamadas.filter((u) => u.includes('/api/scan/stream'))).toHaveLength(1);
    expect(eventos).toEqual([
      { type: 'progress', done: 1, total: 2 },
      { type: 'progress', done: 2, total: 2 },
      { type: 'report', report: { score: 91 } },
    ]);
  });

  it('SCAN-10: 429 vira failure com motivo rate-limited', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/report')) {
        return new Response(JSON.stringify({ code: 'rate_limit_exceeded' }), { status: 429 });
      }
      throw new Error(`chamada inesperada: ${url}`);
    }) as typeof fetch;

    const response = await handler(pedido('exemplo.com.br'));
    const eventos = await lerEventos(response);

    expect(eventos).toEqual([{ type: 'failure', reason: 'rate-limited' }]);
  });

  it('SCAN-11: URL inválida vira failure com invalid-url sem nenhuma requisição', async () => {
    let chamou = false;
    globalThis.fetch = (async () => {
      chamou = true;
      throw new Error('não deveria chamar fetch');
    }) as typeof fetch;

    const response = await handler(pedido('javascript:alert(1)'));
    const eventos = await lerEventos(response);

    expect(chamou).toBe(false);
    expect(eventos).toEqual([{ type: 'failure', reason: 'invalid-url' }]);
  });

  it('SCAN-12: o cancelamento do cliente aborta o fetch upstream', async () => {
    let capturedSignal: AbortSignal | undefined;
    let resolveGate: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      resolveGate = resolve;
    });

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/v1/report')) {
        return new Response(JSON.stringify({}), { status: 404 });
      }
      if (url.includes('/api/scan/stream')) {
        capturedSignal = init?.signal ?? undefined;
        resolveGate();
        return new Promise<Response>(() => {}); // nunca resolve neste teste
      }
      throw new Error(`chamada inesperada: ${url}`);
    }) as typeof fetch;

    const response = await handler(pedido('exemplo.com.br'));
    await gate;

    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect(capturedSignal!.aborted).toBe(false);

    await response.body!.cancel(new Error('cliente foi embora'));

    expect(capturedSignal!.aborted).toBe(true);
  });
});

describe('SCAN: cliente direto da medicao', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('SCAN-13: abort durante fetch inicial nao emite failure', async () => {
    const eventos: Array<{ type: string; reason?: string }> = [];
    const controller = new AbortController();

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      controller.abort();
      throw new DOMException('The operation was aborted', 'AbortError');
    }) as typeof fetch;

    await scanAgentic('exemplo.com.br', (event) => {
      eventos.push(event);
    }, controller.signal);

    expect(eventos).toEqual([]);
  });
});
