import { describe, it, expect } from 'vitest';
import { WHATSAPP_URL_FAB, WHATSAPP_URL_CTA, WHATSAPP_URL_HERO } from '../src/constants/links';

describe('FAB: Floating Action Button (CTA-06)', () => {
  it('FAB-01: exporta WHATSAPP_URL_FAB com wa.me e mensagem amigavel', () => {
    expect(WHATSAPP_URL_FAB).toContain('https://wa.me/5516997879837');
    expect(WHATSAPP_URL_FAB).toContain('text=');
    expect(decodeURIComponent(WHATSAPP_URL_FAB)).toContain('gostaria de saber mais sobre consultoria de IA');
  });

  it('FAB-02: mensagens de WhatsApp sao distintas por ponto de contato', () => {
    expect(WHATSAPP_URL_FAB).not.toBe(WHATSAPP_URL_CTA);
    expect(WHATSAPP_URL_FAB).not.toBe(WHATSAPP_URL_HERO);
  });
});
