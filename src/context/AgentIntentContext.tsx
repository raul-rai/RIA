import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { IntentId } from '../content/intents';
import type { FrontId } from '../content/fronts';
import { useVulnerability } from './VulnerabilityContext';
import { track } from '../lib/analytics';

/**
 * O canal entre o botao e o agente.
 *
 * Os CTAs vivem nas dobras 0, 2, 3 e 4; o agente vive na dobra 5 e esta sempre
 * montado. Este contexto carrega a intencao do clique de um lado ao outro.
 *
 * Nao mora no VulnerabilityContext de proposito: aquele responde "quao exposta
 * esta esta empresa", este responde "de onde veio este clique". Misturar faria
 * o provider do indice virar despachante de UI, e todo teste de vulnerabilidade
 * passaria a arrastar estado de chat.
 */

export interface AgentIntentRequest {
  id: IntentId;
  frontId?: FrontId;
  /**
   * Incrementa a cada pedido. Sem ele, pedir a mesma intencao duas vezes
   * produziria um objeto equivalente e o efeito do agente nao dispararia de
   * novo — a reentrada deixaria de funcionar justamente no caso que ela existe
   * para atender.
   */
  nonce: number;
}

export interface AgentIntentState {
  pending: AgentIntentRequest | null;
  requestIntent: (id: IntentId, frontId?: FrontId) => void;
  consume: () => void;
}

const AgentIntentContext = createContext<AgentIntentState | undefined>(undefined);

export function AgentIntentProvider({
  onReachAgent,
  children,
}: {
  /** Leva o visitante ate a dobra do agente. */
  onReachAgent: () => void;
  children: React.ReactNode;
}) {
  const { frontsChecked, websiteScore } = useVulnerability();
  const [pending, setPending] = useState<AgentIntentRequest | null>(null);
  const nonce = useRef(0);

  const requestIntent = useCallback(
    (id: IntentId, frontId?: FrontId) => {
      nonce.current += 1;
      track('agent_intent', {
        intent_id: id,
        front_id: frontId,
        fronts_covered: frontsChecked.filter(Boolean).length,
        website_score: websiteScore ?? undefined,
      });
      setPending({ id, frontId, nonce: nonce.current });
      onReachAgent();
    },
    [frontsChecked, websiteScore, onReachAgent]
  );

  const consume = useCallback(() => setPending(null), []);

  const value = useMemo<AgentIntentState>(
    () => ({ pending, requestIntent, consume }),
    [pending, requestIntent, consume]
  );

  return <AgentIntentContext.Provider value={value}>{children}</AgentIntentContext.Provider>;
}

export function useAgentIntent(): AgentIntentState {
  const context = useContext(AgentIntentContext);
  if (!context) {
    throw new Error('useAgentIntent must be used within an AgentIntentProvider');
  }
  return context;
}
