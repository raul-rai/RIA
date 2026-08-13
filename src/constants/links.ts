// src/constants/links.ts
// Single source of truth for all external contact URLs.
// Phone: 5516997879837 = country code 55 + DDD 16 + mobile 997879837 (13 digits)

const WHATSAPP_PHONE = '5516997879837';

/** Hero CTA — first impression, short message */
export const WHATSAPP_URL_HERO = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita.'
)}`;

/** FinalCTA button — clear booking intent */
export const WHATSAPP_URL_CTA = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, quero agendar minha sessão estratégica de 30 minutos.'
)}`;

/** Floating FAB — subtle entry point for browsing visitors */
export const WHATSAPP_URL_FAB = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, estou visitando seu site e gostaria de saber mais sobre consultoria de IA.'
)}`;

/** Icon link — generic entry point (no pre-filled text) */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

/** Email — placeholder until real address is confirmed */
export const EMAIL = 'contato@ria.com.br'; // TODO: update when real email is defined

/** LinkedIn — placeholder until profile is created */
export const LINKEDIN_URL = '#'; // TODO: update when LinkedIn profile is created

/** WhatsApp com mensagem livre — usado pelo resultado do chat/diagnostico */
export const whatsappWithMessage = (message: string): string =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
