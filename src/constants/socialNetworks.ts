import { Instagram, Linkedin, Facebook, Youtube, Music2, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * As redes que o checklist do diagnostico oferece.
 *
 * Fonte unica: a lista vive aqui porque dois consumidores dependem dela e
 * discordar seria silencioso. O cartao a renderiza; o indice de
 * vulnerabilidade dimensiona o vetor de marcacoes por ela
 * (SOCIAL_COUNT em context/VulnerabilityContext.tsx). Acrescentar uma rede
 * aqui muda os dois lados de uma vez — e, por causa do pool fixo de pontos
 * documentado naquele arquivo, nao mexe no teto de protecao.
 */
export type SocialNetwork = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  { id: 'instagram', label: 'Instagram', Icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'youtube', label: 'YouTube', Icon: Youtube },
  { id: 'tiktok', label: 'TikTok', Icon: Music2 },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
];
