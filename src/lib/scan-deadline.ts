// Prazo proprio para uma das medicoes.
//
// As duas medicoes (PageSpeed e Is Agentic) compartilham o controle de
// cancelamento do visitante: "Ainda nao tenho site" ou uma nova medicao abortam
// as duas. Mas o PRAZO de cada uma e dela. Estourar o teto do Is Agentic nao pode
// derrubar o PageSpeed que ainda mede, e vice-versa — esse erro exato ja foi
// corrigido uma vez, quando o teto abortava o controle compartilhado.
//
// Por isso cada medicao ganha um sinal filho: aborta quando o PAI aborta (o
// cancelamento chega) ou quando o prazo estoura (so este filho morre). O pai
// nunca e tocado por aqui.

export interface Deadline {
  /** Sinal para o fetch/leitor da medicao. */
  signal: AbortSignal;
  /** Solta o timer e o ouvinte do pai. Sempre chamar ao fim da medicao. */
  dispose: () => void;
}

export function withDeadline(parent: AbortSignal, ms: number): Deadline {
  const own = new AbortController();
  const onParentAbort = () => own.abort();
  if (parent.aborted) own.abort();
  else parent.addEventListener('abort', onParentAbort);
  const timer = setTimeout(() => own.abort(), ms);
  return {
    signal: own.signal,
    dispose() {
      clearTimeout(timer);
      parent.removeEventListener('abort', onParentAbort);
    },
  };
}
