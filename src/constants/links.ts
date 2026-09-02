// src/constants/links.ts
// Single source of truth for all external contact URLs.
// Phone: 5516997879837 = country code 55 + DDD 16 + mobile 997879837 (13 digits)

import { SESSION_MINUTES } from '../content/offer';

const WHATSAPP_PHONE = '5516997879837';

/** Hero CTA — first impression, short message */
export const WHATSAPP_URL_HERO = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita.'
)}`;

/** FinalCTA button — clear booking intent */
export const WHATSAPP_URL_CTA = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  `Olá Raul, quero agendar minha sessão estratégica de ${SESSION_MINUTES} minutos.`
)}`;

/** Floating FAB — subtle entry point for browsing visitors */
export const WHATSAPP_URL_FAB = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, estou visitando seu site e gostaria de saber mais sobre consultoria de IA.'
)}`;

/** Icon link — generic entry point (no pre-filled text) */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

/**
 * E-mail de contato do controlador.
 *
 * `null` ENQUANTO NÃO HOUVER UM ENDEREÇO REAL, e isto não é preguiça: é a
 * correção de um defeito concreto.
 *
 * Aqui morava `'contato@ria.com.br'` com um `// TODO: update when real email is
 * defined`. Esse valor é lido por content/privacy.ts como CONTROLLER.email, e a
 * /privacidade o publicava como o canal de acesso, correção, exclusão e
 * revogação de consentimento — ou seja, o canal do art. 18 da LGPD, ao lado da
 * promessa de resposta em até 15 dias. Um pedido enviado para lá não chegava em
 * ninguém, e o domínio pode nem ser do Raul.
 *
 * Canal que não existe é pior que canal ausente: o titular acredita que exerceu
 * o direito dele. Com `null`, a página mostra só o WhatsApp — que funciona.
 *
 * PARA LIGAR: troque por um endereço que o Raul de fato leia. A página volta a
 * oferecer os dois canais sozinha, sem nenhuma outra mudança.
 */
export const EMAIL: string | null = null;

/**
 * Telefone do negócio, em E.164. Mesmo número dos links de WhatsApp acima —
 * declarado aqui porque o JSON-LD precisa dele num formato que `wa.me` não usa.
 *
 * Não publica nada de novo: este número já sai em toda a página, em cada botão
 * de WhatsApp. O que muda é que agora um motor de busca consegue LER que ele é
 * o telefone do negócio, em vez de inferir de uma URL.
 */
export const PHONE_E164 = `+${WHATSAPP_PHONE}`;

/**
 * Perfis públicos do negócio, para o `sameAs` do schema.org.
 *
 * VAZIO, e isso é uma medição — não uma pendência esquecida.
 *
 * Aqui morava `LINKEDIN_URL = '#'` com um `// TODO: update when LinkedIn
 * profile is created`, e nenhum arquivo do projeto o importava. Um placeholder
 * que não é usado por ninguém não é um link quebrado; é um lembrete disfarçado
 * de constante, e o custo dele apareceria no dia em que alguém o colasse num
 * `sameAs`.
 *
 * `sameAs` é a declaração "estas contas são a mesma entidade que este site".
 * Um Google que siga um `#`, ou um perfil que não é do Raul, não devolve erro
 * — ele associa a marca a outra coisa, em silêncio, e desfazer isso depois é
 * bem mais caro do que não afirmar nada agora. Enquanto o array estiver vazio,
 * o prerender OMITE a propriedade inteira, que é a leitura honesta de "não há
 * perfil verificado".
 *
 * PARA LIGAR: acrescente as URLs de perfil reais. O schema passa a declará-las
 * sozinho, sem nenhuma outra mudança.
 */
export const SOCIAL_PROFILES: string[] = [];

/** WhatsApp com mensagem livre — usado pelo resultado do chat/diagnostico */
export const whatsappWithMessage = (message: string): string =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
