import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { IntentId } from '../content/intents';
import type { PathId } from '../content/paths';
import { useSiteScore } from './SiteScoreContext';
import { track } from '../lib/analytics';

/**
 * O canal entre o botao e o agente.
 *
 * Os CTAs vivem nas dobras 0, 2 e 3; o agente vive na dobra 4 e esta sempre
 * montado. Este contexto carrega a intencao do clique de um lado ao outro.
 *
 * Nao mora no SiteScoreContext de proposito: aquele responde "o que foi
 * medido neste site", este responde "de onde veio este clique". Misturar faria
 * o provider das notas virar despachante de UI, e todo teste das notas
 * passaria a arrastar estado de chat.
 */

export interface AgentIntentRequest {
  id: IntentId;
  /** O caminho clicado, quando o pedido nasce de um cartao de caminho. */
  pathId?: PathId;
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
  requestIntent: (id: IntentId, pathId?: PathId) => void;
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
  const { google, agentic, hasNoWebsite, path } = useSiteScore();
  const googleScore = google?.score;
  const agenticScore = agentic?.score;
  const [pending, setPending] = useState<AgentIntentRequest | null>(null);
  const nonce = useRef(0);

  const requestIntent = useCallback(
    (id: IntentId, pathId?: PathId) => {
      nonce.current += 1;
      // As duas notas seguem separadas tambem na telemetria: dois campos, nunca
      // um terceiro. Ausencia vai como undefined (o parametro some do evento),
      // nunca como 0.
      track('agent_intent', {
        intent_id: id,
        path_id: pathId ?? path ?? undefined,
        google_score: googleScore,
        agentic_score: agenticScore,
        has_no_website: hasNoWebsite,
      });
      setPending({ id, pathId, nonce: nonce.current });
      onReachAgent();
    },
    [googleScore, agenticScore, hasNoWebsite, path, onReachAgent]
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
