// As frentes de implementação.
//
// MUDANÇA DE POSICIONAMENTO (ago/2026): eram cinco. "Site + SDR + automação +
// software sob medida + BI" é o cardápio de uma agência, não de um engenheiro —
// e as duas frentes cortadas (Sistema sob medida, Dados e decisão) eram
// justamente as mais expostas à comoditização por IA.
//
// O produto de entrada deixou de ser o cardápio e passou a ser o DIAGNÓSTICO
// (ver content/diagnostic-offer.ts). As três frentes abaixo são o que se
// implementa DEPOIS do diagnóstico dizer qual delas paga primeiro. Elas não
// competem entre si na página: são consequência, não menu.
//
// A frente 1 não é uma escolha de ordem: ela é a mesma coisa que a dobra do
// diagnóstico de site mede. Ver resolveFirstFront em src/lib/fronts.ts.

export type FrontId = 1 | 2 | 3;

export interface Front {
  id: FrontId;
  /** Nome da frente, como o visitante lê no cartão. */
  label: string;
  /** O que ela entrega, numa linha. */
  promise: string;
  /** Etiqueta curta usada quando um caso aponta para esta frente. */
  tag: string;
  /**
   * A pergunta que o agente faz quando o lead escolhe esta frente no cartão.
   * Entra no meio de uma frase ("o que sua empresa faz, e {probe}?"), então
   * começa em minúscula e não leva pontuação final.
   */
  probe: string;
}

export const FRONTS: Front[] = [
  {
    id: 1,
    label: 'Presença digital pronta para IA',
    promise: 'Site que o ChatGPT, o Gemini e o Perplexity conseguem ler e citar quando alguém procura o que você vende.',
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
    label: 'Automação de processos',
    promise: 'As rotinas repetitivas saem da mão da equipe e passam a rodar sem ninguém olhando.',
    tag: 'Automação',
    probe: 'qual rotina consome mais horas da equipe hoje',
  },
];
