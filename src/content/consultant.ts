// Dados do consultor.
//
// PHOTO_SRC aponta para o retrato usado na secao "Seu consultor".
// Decisao do Raul (14/08/2026): seguir com a arte gerada por IA em vez de uma
// fotografia. Se um dia entrar foto real, basta trocar o caminho aqui.
//
// O componente aceita null e cai num cartao tipografico — nao remova esse
// caminho, ele e o fallback se o arquivo sumir.
export const PHOTO_SRC: string | null = '/raul.pedro.webp';

/**
 * Texto alternativo. Descreve a imagem como ela e — uma ilustracao — em vez de
 * afirmar que e uma fotografia do consultor. Custa nada e evita a leitura de
 * "foto falsa" por quem percebe a origem da arte.
 */
export const PHOTO_ALT = 'Ilustracao de marca da RIA: retrato estilizado de Raul Pedro';

export const CONSULTANT = {
  name: 'Raul Pedro',
  role: 'Engenheiro & estrategista de IA',
  tagline: 'Liderando sua transição.',
  bio: 'Especialista em unir a precisão da Engenharia à vanguarda da IA para garantir escala e eficiência operacional.',
  credentials: [
    'Agentes de IA em produção qualificando leads em escala',
    'Automação de processos ponta a ponta com n8n',
    'Diagnóstico e otimização para busca generativa (GEO)',
  ],
};
