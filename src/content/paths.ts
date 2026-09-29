// Os dois caminhos.
//
// MUDANÇA DE POSICIONAMENTO (set/2026): eram três frentes — presença digital,
// agente SDR e automação de processos. Três coisas diferentes numa página só é
// cardápio, e cardápio obriga o visitante a escolher antes de entender.
//
// Agora a página faz uma coisa: mede o site e conserta. Os dois caminhos abaixo
// não são um menu, são o resultado da medição. Quem não tem site vai para
// `novo`; quem tem, e acabou de ver a nota, vai para `otimizar`.
//
// Ver src/lib/paths.ts — a escolha chega pré-resolvida pelo laudo.

export type PathId = 'novo' | 'otimizar';

export interface SitePath {
  id: PathId;
  /** Como o visitante lê no cartão. */
  label: string;
  /** O que o caminho entrega, numa linha. */
  promise: string;
  /** Etiqueta curta, para quando um caso ou o agente cita o caminho. */
  tag: string;
  /**
   * A pergunta que o agente faz quando o lead escolhe este caminho. Entra no
   * meio de uma frase ("o que sua empresa faz, e {probe}?"), então começa em
   * minúscula e não leva pontuação final.
   */
  probe: string;
}

export const PATHS: SitePath[] = [
  {
    id: 'novo',
    label: 'Site novo',
    promise:
      'Um site construído desde o começo para ser rápido, encontrável e legível por ChatGPT, Gemini e Perplexity — não um modelo pronto com o seu logo em cima.',
    tag: 'Criação',
    probe: 'o que alguém precisa encontrar quando procura o que você vende',
  },
  {
    id: 'otimizar',
    label: 'Otimização',
    promise:
      'O site que já existe passa a carregar rápido, aparecer na busca e responder ao que os agentes de IA perguntam — corrigindo exatamente o que o laudo apontou.',
    tag: 'Otimização',
    probe: 'qual desses pontos do laudo mais te preocupa',
  },
];

export function pathById(id: PathId): SitePath {
  const found = PATHS.find((p) => p.id === id);
  // Impossível pela UI, mas o tipo permite chamada direta. Cair no primeiro é
  // melhor que devolver undefined para dentro de uma string de chat.
  return found ?? PATHS[0];
}
