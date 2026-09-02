// Metadados por rota — <title> e description.
//
// Fonte única. Três consumidores dependem destes textos, e divergir entre eles
// é silencioso:
//
//   scripts/prerender.js  -> injeta no HTML publicado (chega via entry-server.tsx)
//   pages/LandingPage     -> restaura o título na navegação client-side
//   pages/PrivacyPage     -> idem
//
// A REGRESSÃO QUE ISTO ENCERRA
//
// O prerender escrevia na home o título "RIA — Antes de escolher a ferramenta
// de IA, alguém precisa achar o gargalo". Na hidratação, um efeito da
// LandingPage reescrevia `document.title` com o rótulo do capítulo ativo — e
// trocava de novo a cada rolagem:
//
//     document.title  ->  "RIA — A Ameaça Silenciosa"
//                         "RIA — Vozes do Mercado"  (depois de rolar)
//
// O Googlebot executa JavaScript e lê o título DEPOIS da execução. O título
// indexado era, portanto, o do capítulo 0 — sem "gargalo", sem "ferramenta de
// IA", sem nenhuma das palavras pelas quais a página quer ser encontrada. Todo
// o trabalho do prerender nesse campo era desfeito no primeiro frame.
//
// O título de capítulo não voltou em outro lugar de propósito: cada seção já
// se anuncia por `aria-label` (ver ChapterSection), que é o canal certo para
// isso e não disputa o <title> com o indexador.
//
// A navegação client-side continua precisando escrever o título — sair de `/`
// para `/privacidade` pelo rodapé não recarrega o documento, então sem essa
// escrita a política herdaria o título da home. A diferença é que agora as
// páginas escrevem o MESMO valor que o prerender injetou, lido daqui.

export interface RouteMeta {
  title: string;
  /** Até 160 caracteres — tests/seo.test.ts (SEO-01) tranca esse limite. */
  description: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'RIA — Antes de escolher a ferramenta de IA, alguém precisa achar o gargalo',
    description:
      '95% dos projetos de IA em empresas não devolvem nada — quase sempre por automatizar a rotina errada. Diagnóstico de gargalo por engenheiro de produção.',
  },
  '/privacidade': {
    title: 'RIA — Política de Privacidade',
    description:
      'Como a RIA trata os dados coletados no site: o que é coletado, para onde vai, com que base legal e como pedir exclusão.',
  },
};

/**
 * Metadados de uma rota. Rota desconhecida cai na home — é o que o prerender já
 * fazia, e degradar para o título certo do site é melhor que degradar para
 * `undefined` no <title>.
 */
export function metaFor(path: string): RouteMeta {
  return ROUTE_META[path] ?? ROUTE_META['/'];
}
