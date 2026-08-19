/**
 * A decisao de injetar a mensagem de um botao na conversa.
 *
 * Fica fora do componente porque cada trava evita uma falha concreta que
 * precisa de teste proprio — e nenhuma delas depende de React.
 */

export type AgentStage = 'chat' | 'qualifying' | 'booking';

export interface GuardMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InjectionGuardInput {
  stage: AgentStage;
  isTyping: boolean;
  messages: GuardMessage[];
  candidateUserMessage: string;
}

/**
 * Em todos os casos bloqueados o visitante ainda e levado ao agente pela
 * rolagem — ele pediu para ir e vai. So a injecao e suprimida.
 */
export function shouldInject(input: InjectionGuardInput): boolean {
  // Qualificacao ou agenda na tela: um balao novo caindo aqui derruba a
  // conversao que ja estava ganha.
  if (input.stage !== 'chat') return false;

  // Agente no meio de uma resposta: injetar produz duas falas do bot fora de
  // ordem.
  if (input.isTyping) return false;

  // Clique duplo no mesmo botao nao vira mensagem duplicada. So a ultima fala
  // do lead conta: repetir a mesma intencao depois de uma conversa inteira e
  // legitimo.
  const ultimaDoLead = [...input.messages].reverse().find((m) => m.role === 'user');
  if (ultimaDoLead?.content === input.candidateUserMessage) return false;

  return true;
}
