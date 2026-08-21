/**
 * Consentimento de medição (LGPD art. 7º, I).
 *
 * Até ago/2026 o Google Analytics era injetado no primeiro evento rastreado,
 * sem nenhuma pergunta — ou seja, tratamento de dado de navegação sem base
 * legal declarada, numa página sem política de privacidade. Este módulo é a
 * porta que faltava.
 *
 * Decisão de projeto: a ausência de resposta é tratada como NEGATIVA, nunca
 * como consentimento tácito. Silêncio não é consentimento na LGPD, e "opt-out"
 * de analytics é exatamente o padrão que a autoridade europeia já derrubou.
 */

export type ConsentState = 'granted' | 'denied';

const STORAGE_KEY = 'ria:consent:analytics';

/** Notifica a página quando a escolha muda, para o gtag ligar/desligar sem reload. */
const listeners = new Set<(state: ConsentState | null) => void>();

/**
 * Lê a escolha guardada. Devolve null quando o visitante ainda não decidiu —
 * e null NUNCA deve ser interpretado como permissão.
 *
 * localStorage pode lançar (modo privado do Safari, cookies bloqueados por
 * política corporativa). Nesses casos a leitura falha para null, o que
 * significa "não medir": o erro degrada para o lado seguro.
 */
export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'granted' || raw === 'denied' ? raw : null;
  } catch {
    return null;
  }
}

export function setConsent(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // Sem persistência a escolha vale só para esta sessão. É pior para a
    // experiência (a barra reaparece), mas nunca contra o visitante.
  }
  listeners.forEach((fn) => fn(state));
}

/** Permite ao visitante mudar de ideia — exigência do art. 8º, §5º. */
export function revokeConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* silêncio proposital */
  }
  listeners.forEach((fn) => fn(null));
}

export function onConsentChange(fn: (state: ConsentState | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** A única pergunta que o analytics precisa fazer. */
export function hasAnalyticsConsent(): boolean {
  return readConsent() === 'granted';
}
