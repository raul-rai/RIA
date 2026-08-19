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
export const PHOTO_ALT = 'Ilustracao de marca da RIA: retrato estilizado de Raul Vieira';

export const CONSULTANT = {
  name: 'Raul Vieira',
  role: 'Consultor de Inteligência Artificial',
  tagline: 'Engenharia de produção aplicada a IA.',
  bio: 'Engenheiro de produção formado pela UFSCar. A formação importa aqui por um motivo prático: antes de escolher modelo, alguém precisa saber onde está o gargalo. É o mesmo ofício de sempre — medir o processo, achar o ponto que trava, atacar o de maior custo por hora. A IA só mudou a ferramenta.',
  credentials: [
    'Engenheiro de Produção — Universidade Federal de São Carlos (UFSCar)',
    'Agentes de IA em produção qualificando leads em escala',
    'Automação de processos ponta a ponta com n8n',
    'Diagnóstico e otimização para busca generativa (GEO)',
  ],
};
