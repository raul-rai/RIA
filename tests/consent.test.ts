import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readConsent,
  setConsent,
  revokeConsent,
  hasAnalyticsConsent,
  onConsentChange,
} from '../src/lib/consent';

/**
 * Consentimento de medição (LGPD).
 *
 * O defeito que estes testes trancam: até ago/2026 o gtag.js era injetado no
 * primeiro evento rastreado, sem pergunta nenhuma, num site que não tinha
 * política de privacidade. Tratamento de dado sem base legal declarada.
 *
 * A regra que importa mais aqui é a CONSENT-02: silêncio não é consentimento.
 */

/** localStorage mínimo — o ambiente de teste do Vitest roda em node puro. */
function installStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  return store;
}

describe('consentimento de medição', () => {
  beforeEach(() => {
    installStorage();
  });

  it('CONSENT-01: começa sem decisão registrada', () => {
    expect(readConsent()).toBeNull();
  });

  it('CONSENT-02: ausência de resposta NUNCA vale como permissão', () => {
    // Silêncio não é consentimento (art. 8º). Se alguém um dia inverter o
    // default "para melhorar a taxa de opt-in", este teste quebra.
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('CONSENT-03: registra e lê as duas decisões', () => {
    setConsent('granted');
    expect(readConsent()).toBe('granted');
    expect(hasAnalyticsConsent()).toBe(true);

    setConsent('denied');
    expect(readConsent()).toBe('denied');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('CONSENT-04: a revogação é possível e volta ao estado indeciso (art. 8º, §5º)', () => {
    setConsent('granted');
    revokeConsent();
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('CONSENT-05: valor corrompido no storage não vira permissão', () => {
    localStorage.setItem('ria:consent:analytics', 'sim');
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('CONSENT-06: storage indisponível degrada para "não medir", não para "medir"', () => {
    // Safari em navegação privada e políticas corporativas fazem localStorage
    // lançar. O erro tem de cair do lado seguro.
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {},
    });
    expect(() => readConsent()).not.toThrow();
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('CONSENT-07: avisa quem escuta, para o gtag ligar sem recarregar a página', () => {
    const visto: (string | null)[] = [];
    const off = onConsentChange((s) => visto.push(s));
    setConsent('granted');
    setConsent('denied');
    revokeConsent();
    off();
    setConsent('granted'); // já removido, não deve ser notificado
    expect(visto).toEqual(['granted', 'denied', null]);
  });
});
