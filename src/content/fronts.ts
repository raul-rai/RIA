// As seis frentes.
//
// Este arquivo e o catalogo do que a RIA vende. Ele existia so implicito, como
// checklist de "pilares de IA operacional" — o visitante marcava caixas sem
// nunca ler o que se compra. Aqui a lista passa a declarar a oferta.
//
// A frente 1 nao e uma escolha de ordem: ela e a mesma coisa que a dobra 2
// diagnostica. Ver resolveFirstFront em src/lib/fronts.ts.
//
// ORDEM (ago/2026): "Geracao de conteudo" entrou como frente 3, entre o SDR e a
// automacao. Nao e ordem alfabetica nem de tamanho de projeto: as tres
// primeiras sao a cadeia de aquisicao (ser achado -> responder -> alimentar), e
// as tres ultimas sao a operacao por tras dela. Mexer na posicao quebra essa
// leitura, e renumerar mexe tambem no campo `front` de content/cases.ts.

export type FrontId = 1 | 2 | 3 | 4 | 5 | 6;

export interface Front {
  id: FrontId;
  /** Nome da frente, como o visitante le no cartao. */
  label: string;
  /** O que ela entrega, numa linha. */
  promise: string;
  /** Etiqueta curta usada quando um caso aponta para esta frente. */
  tag: string;
  /**
   * A pergunta que o agente faz quando o lead escolhe esta frente no cartao.
   * Entra no meio de uma frase ("o que sua empresa faz, e {probe}?"), entao
   * comeca em minuscula e nao leva pontuacao final.
   */
  probe: string;
}

export const FRONTS: Front[] = [
  {
    id: 1,
    label: 'Presença digital pronta para IA',
    promise: 'Site que o ChatGPT, o Gemini e o Perplexity conseguem citar quando alguém procura o que você vende.',
    tag: 'Presença digital',
    probe: 'quando alguém procura o que você vende no ChatGPT, o que aparece hoje',
  },
  {
    id: 2,
    label: 'Agente SDR 24/7',
    promise: 'Responde, qualifica e agenda sozinho — inclusive às duas da manhã de domingo.',
    tag: 'Agente SDR',
    probe: 'quantos contatos chegam por semana, e em quanto tempo alguém responde',
  },
  {
    id: 3,
    label: 'Geração de conteúdo',
    promise: 'Publicação constante no seu tom, sem depender de alguém da equipe lembrar de escrever.',
    tag: 'Conteúdo',
    probe: 'quantas vezes por semana sua empresa publica alguma coisa hoje',
  },
  {
    id: 4,
    label: 'Automação de processos',
    promise: 'As rotinas repetitivas saem da mão da equipe e passam a rodar sem ninguém olhando.',
    tag: 'Automação',
    probe: 'qual rotina consome mais horas da equipe hoje',
  },
  {
    id: 5,
    label: 'Sistema sob medida',
    promise: 'O software que a sua operação precisa e que não existe pronto para comprar.',
    tag: 'Sistema sob medida',
    probe: 'qual controle da operação ainda vive numa planilha',
  },
  {
    id: 6,
    label: 'Dados e decisão',
    promise: 'Números que dizem o que fazer na segunda-feira, não o que aconteceu no mês passado.',
    tag: 'Dados e decisão',
    probe: 'qual número você olha antes de decidir a semana',
  },
];
