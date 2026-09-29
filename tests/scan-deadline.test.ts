import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { withDeadline } from '../src/lib/scan-deadline';

const root = (p: string) => resolve(process.cwd(), p);
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

afterEach(() => {
  vi.useRealTimers();
});

/**
 * O prazo de cada medição é dela. O erro que já custou uma correção: o teto de
 * uma medição abortando o controle COMPARTILHADO e derrubando a outra.
 */
describe('DL: withDeadline', () => {
  it('DL-01: estourar o prazo aborta só o filho, nunca o pai', () => {
    vi.useFakeTimers();
    const pai = new AbortController();
    const filho = withDeadline(pai.signal, 45_000);

    vi.advanceTimersByTime(44_999);
    expect(filho.signal.aborted).toBe(false);
    vi.advanceTimersByTime(1);

    expect(filho.signal.aborted).toBe(true);
    expect(pai.signal.aborted, 'o teto de uma medição não pode derrubar a outra').toBe(false);
    filho.dispose();
  });

  it('DL-02: o cancelamento do pai chega ao filho, antes do prazo', () => {
    vi.useFakeTimers();
    const pai = new AbortController();
    const filho = withDeadline(pai.signal, 45_000);
    pai.abort();
    expect(filho.signal.aborted).toBe(true);
    filho.dispose();
  });

  it('DL-03: pai que já nasceu abortado produz filho abortado', () => {
    const pai = new AbortController();
    pai.abort();
    const filho = withDeadline(pai.signal, 45_000);
    expect(filho.signal.aborted).toBe(true);
    filho.dispose();
  });

  it('DL-04: dispose solta o timer — o prazo não dispara depois de a medição acabar', () => {
    vi.useFakeTimers();
    const pai = new AbortController();
    const filho = withDeadline(pai.signal, 45_000);
    filho.dispose();
    vi.advanceTimersByTime(60_000);
    expect(filho.signal.aborted).toBe(false);
  });

  it('DL-05: dispose solta o ouvinte do pai', () => {
    const pai = new AbortController();
    const filho = withDeadline(pai.signal, 45_000);
    filho.dispose();
    pai.abort();
    expect(filho.signal.aborted, 'o pai não pode mais alcançar um filho descartado').toBe(false);
  });
});

describe('DL: o hook usa o prazo próprio nas duas medições', () => {
  const hook = semComentarios(readFileSync(root('src/hooks/useSiteScan.tsx'), 'utf-8'));

  it('DL-06: o Is Agentic tem teto de cliente de 45 s, com prazo próprio', () => {
    expect(hook).toMatch(/const AGENTIC_TIMEOUT_MS = 45000;/);
    expect(hook).toMatch(/const ag = withDeadline\(controller\.signal, AGENTIC_TIMEOUT_MS\)/);
    // A varredura agêntica escuta o sinal do PRAZO, não o controle compartilhado:
    // dentro do bloco agêntico, o controle compartilhado só aparece para criar o prazo.
    const bloco = hook.slice(hook.indexOf('const agentic = (async'), hook.indexOf('void Promise.allSettled'));
    expect(bloco).toMatch(/ag\.signal\s*\)/);
    expect(bloco.match(/controller\.signal/g) ?? []).toHaveLength(1);
  });

  it('DL-07: o PageSpeed continua com os 30 s e o prazo próprio', () => {
    expect(hook).toMatch(/const PAGESPEED_TIMEOUT_MS = 30000;/);
    expect(hook).toMatch(/const psi = withDeadline\(controller\.signal, PAGESPEED_TIMEOUT_MS\)/);
  });

  it('DL-08: nenhum teto aborta o controle compartilhado', () => {
    // O único abort() sobre o controle compartilhado é o cancelamento do
    // visitante (start() abortando a medição anterior e cancel()). Nenhum
    // setTimeout pode chamá-lo.
    expect(hook).not.toMatch(/setTimeout\([^)]*controller\.abort/);
    expect(hook).not.toMatch(/setTimeout\([^)]*abort\.current/);
  });

  it('DL-09: estourar o teto do agêntico publica a falha "unreachable" e libera a fase', () => {
    // O aborto do prazo não emite evento (scanAgentic cala aborto), então quem
    // publica o motivo é o finally — e o allSettled só resolve depois dele.
    const bloco = hook.slice(hook.indexOf('const agentic = (async'), hook.indexOf('void Promise.allSettled'));
    expect(bloco).toMatch(/finally\s*\{[\s\S]*ag\.dispose\(\)[\s\S]*if \(!agenticAnswered && !cancelled\(\)\)[\s\S]*setAgenticFailure\('unreachable'\)/);
  });
});
