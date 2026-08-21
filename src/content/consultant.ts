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
  role: 'Engenheiro de Inteligência Artificial',
  tagline: 'Engenharia de produção aplicada a IA.',
  /**
   * A bio e uma LISTA de paragrafos, nao uma string.
   *
   * Era uma string so, e a secao imprimia tudo num <p> unico. O primeiro
   * paragrafo conta a formacao; o segundo explica por que ela importa para
   * quem esta comprando. Sao dois movimentos diferentes, e emenda-los num
   * bloco so fazia o segundo — que e o argumento de venda — chegar ja no
   * meio de uma parede de texto.
   */
  bio: [
    'Cursou Engenharia de Produção na UFSCar, onde a capacidade de dissecar processos e a mentalidade de otimização contínua foram bem lapidadas. E desde 2022 vem se especializando em Inteligência Artificial e suas aplicações.',
    'A formação importa aqui por um motivo prático: antes de escolher modelo, alguém precisa saber onde está o gargalo. É o mesmo ofício de sempre — medir o processo, achar o ponto que trava, atacar o de maior custo por hora. A IA só mudou a ferramenta.',
  ],
  credentials: [
    'Visão Estratégica e Alinhamento de Negócios',
    'Domínio Prático do Ecossistema de IA em constante evolução',
    'Governança, Dados e Conformidade (Compliance)',
    'Visão de Proprietário e Arquitetura de Soluções',
  ],
};
