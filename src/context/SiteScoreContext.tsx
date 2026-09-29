import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { AgenticReport } from '../lib/agentic-report';
import type { GoogleReport } from '../lib/lighthouse-report';
import type { PathId } from '../content/paths';
import { resolvePath } from '../lib/paths';

/**
 * O estado da medição.
 *
 * O QUE ISTO SUBSTITUI
 *
 * Havia aqui um "Índice de Vulnerabilidade": um número de 8 a 100 calculado a
 * partir de frentes marcadas (60 dos 95 pontos de proteção), saúde do site (25)
 * e presença em redes sociais (10). Com as três frentes virando dois caminhos
 * mutuamente exclusivos, 60 daqueles pontos perderam base — e reponderar os que
 * sobraram seria inventar uma escala nova para manter um número que a página
 * não precisa mais.
 *
 * O que ficou é o que foi MEDIDO: duas notas, cada uma com seu instrumento, mais
 * a declaração de "não tenho site". Nada aqui é calculado a partir do que o
 * visitante concorda ou marca.
 *
 * REGRA: as duas notas não se somam, não se promediam e não viram uma terceira.
 * tests/site-score.test.ts (SS-04) tranca isso na varredura de fonte.
 */

export interface SiteScoreState {
  google: GoogleReport | null;
  agentic: AgenticReport | null;
  hasNoWebsite: boolean;
  /** O endereço medido, para o agente poder citá-lo. */
  target: string | null;
  /** Caminho escolhido no cartão, ou o sugerido pela medição. */
  path: PathId | null;
  /** Houve alguma medição ou declaração? O HUD só aparece depois disso. */
  measured: boolean;
  setGoogle: (report: GoogleReport | null) => void;
  setAgentic: (report: AgenticReport | null) => void;
  setNoWebsite: (value: boolean) => void;
  setTarget: (target: string | null) => void;
  choosePath: (path: PathId) => void;
  reset: () => void;
}

/** Puro e exportado para o teste — a regra de sugestão mora em lib/paths.ts. */
export function derivePath(input: { hasNoWebsite: boolean; googleScore: number | null }): PathId | null {
  return resolvePath(input);
}

/** Puro e exportado para o teste. */
export function hasAnyMeasurement(input: {
  google: { score: number } | null;
  agentic: { score: number } | null;
  hasNoWebsite: boolean;
}): boolean {
  return input.hasNoWebsite || input.google !== null || input.agentic !== null;
}

/** Puro e exportado para o teste — a regra de escolha ao declarar "sem site". */
export function deriveChosenOnNoWebsite(value: boolean): PathId | null | undefined {
  // Quando o visitante declara que não tem site, descarta a escolha anterior
  // para que o caminho volte a ser derivado de hasNoWebsite (que será 'novo')
  return value ? null : undefined;
}

/** O que o provedor guarda. `chosen` é a escolha explícita do cartão de caminhos. */
export interface SiteScoreData {
  google: GoogleReport | null;
  agentic: AgenticReport | null;
  hasNoWebsite: boolean;
  target: string | null;
  chosen: PathId | null;
}

export const INITIAL_SITE_SCORE: SiteScoreData = {
  google: null,
  agentic: null,
  hasNoWebsite: false,
  target: null,
  chosen: null,
};

export type SiteScoreAction =
  | { type: 'setGoogle'; report: GoogleReport | null }
  | { type: 'setAgentic'; report: AgenticReport | null }
  | { type: 'setNoWebsite'; value: boolean }
  | { type: 'setTarget'; target: string | null }
  | { type: 'choosePath'; path: PathId }
  | { type: 'reset' };

/**
 * As transições do estado, puras: estado + ação -> estado.
 *
 * Existe separado do provedor porque o defeito que motivou a extração morava na
 * SEQUÊNCIA, não em nenhuma função isolada: `setNoWebsite(true)`, depois medir
 * uma URL, deixava `hasNoWebsite` preso em `true` ao lado de um `target`
 * medido. As funções puras acima passavam; a sequência nunca era exercitada.
 *
 * REGRAS: declarar "não tenho site" limpa notas e alvo e descarta a escolha de
 * caminho; declarar o contrário só desliga a declaração e não mexe em mais nada;
 * uma nota que chega prova que há site e também desliga a declaração.
 */
export function scoreReducer(state: SiteScoreData, action: SiteScoreAction): SiteScoreData {
  switch (action.type) {
    case 'setGoogle':
      return { ...state, google: action.report, hasNoWebsite: action.report ? false : state.hasNoWebsite };
    case 'setAgentic':
      return { ...state, agentic: action.report, hasNoWebsite: action.report ? false : state.hasNoWebsite };
    case 'setNoWebsite': {
      const chosen = deriveChosenOnNoWebsite(action.value);
      return {
        ...state,
        hasNoWebsite: action.value,
        ...(action.value ? { google: null, agentic: null, target: null } : {}),
        chosen: chosen !== undefined ? chosen : state.chosen,
      };
    }
    case 'setTarget':
      return { ...state, target: action.target };
    case 'choosePath':
      return { ...state, chosen: action.path };
    case 'reset':
      return INITIAL_SITE_SCORE;
  }
}

const SiteScore = createContext<SiteScoreState | undefined>(undefined);

export function SiteScoreProvider({ children }: { children: React.ReactNode }) {
  const [{ google, agentic, hasNoWebsite, target, chosen }, dispatch] = useReducer(
    scoreReducer,
    INITIAL_SITE_SCORE
  );

  const setGoogle = useCallback((report: GoogleReport | null) => dispatch({ type: 'setGoogle', report }), []);
  const setAgentic = useCallback((report: AgenticReport | null) => dispatch({ type: 'setAgentic', report }), []);
  const setNoWebsite = useCallback((value: boolean) => dispatch({ type: 'setNoWebsite', value }), []);
  const setTarget = useCallback((next: string | null) => dispatch({ type: 'setTarget', target: next }), []);
  const choosePath = useCallback((path: PathId) => dispatch({ type: 'choosePath', path }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const sugerido = useMemo(
    () => derivePath({ hasNoWebsite, googleScore: google?.score ?? null }),
    [hasNoWebsite, google]
  );

  const value: SiteScoreState = {
    google,
    agentic,
    hasNoWebsite,
    target,
    // A escolha explícita do visitante ganha da sugestão da medição: ele pode
    // ter site e ainda assim querer um novo, e a página não discute com ele.
    path: chosen ?? sugerido,
    measured: hasAnyMeasurement({ google, agentic, hasNoWebsite }),
    setGoogle,
    setAgentic,
    setNoWebsite,
    setTarget,
    choosePath,
    reset,
  };

  return <SiteScore.Provider value={value}>{children}</SiteScore.Provider>;
}

export function useSiteScore(): SiteScoreState {
  const context = useContext(SiteScore);
  if (!context) throw new Error('useSiteScore precisa de um SiteScoreProvider acima');
  return context;
}
