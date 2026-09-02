import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';

/**
 * Entrada de servidor — usada só pelo prerender do build (scripts/prerender.js).
 * Nunca vai para o bundle do navegador.
 *
 * POR QUE ISTO EXISTE
 *
 * Até ago/2026 o `dist/index.html` publicado tinha exatamente isto no corpo:
 *
 *     <body><div id="root"></div></body>
 *
 * Um SPA client-side puro. O problema não era teórico: a Frente 1 do catálogo
 * vende "site que o ChatGPT, o Gemini e o Perplexity conseguem ler e citar", e
 * GPTBot, PerplexityBot e ClaudeBot NÃO executam JavaScript. Desta página eles
 * enxergavam um título, uma meta description e dois blocos de JSON-LD — nada
 * dos seis capítulos, nada das frentes, nada dos casos. O produto principal era
 * refutado pela própria entrega.
 *
 * Agora o HTML sai do build já com o conteúdo dentro, e o React hidrata por
 * cima. O visitante não perde nada; o crawler passa a ter o que ler.
 */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
}

/**
 * As rotas que viram arquivo estático.
 *
 * Fonte única do prerender e do sitemap — se uma rota entrar aqui, ela ganha
 * HTML próprio E entra no sitemap.xml no mesmo build. É o que impede o caso
 * clássico de sitemap listando página que não existe (ou o contrário).
 *
 * `/onda` fica de fora de propósito: é uma página de estudo da cena 3D, sem
 * conteúdo indexável, e listá-la só diluiria o rastreamento.
 */
export const ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/privacidade', changefreq: 'yearly', priority: '0.3' },
] as const;

/**
 * Reexportado para o scripts/prerender.js montar o FAQPage JSON-LD a partir da
 * MESMA fonte que a página renderiza.
 *
 * O build SSR do Vite empacota tudo num arquivo só, então o script não
 * consegue importar 'content/offer' direto — precisa passar por aqui. O
 * incômodo tem valor: enquanto o schema e a tela lerem deste mesmo array, é
 * impossível repetir o defeito antigo, em que o FAQPage do index.html
 * prometia respostas que o comprador não encontrava em lugar nenhum da página.
 */
export { FAQ, OFFER_TERMS } from './content/offer';

/**
 * Reexportado pelo mesmo motivo que o FAQ: o prerender roda em Node e não
 * importa TypeScript direto.
 *
 * Antes o script declarava um objeto META próprio, com o title e a description
 * de cada rota escritos à mão. Eram os mesmos textos que as páginas precisam na
 * navegação client-side — e a home tinha um terceiro título ainda, escrito pelo
 * React na hidratação, que apagava o do prerender. Agora existe um lugar só.
 * Ver src/content/meta.ts.
 */
export { ROUTE_META, metaFor } from './content/meta';

/**
 * O resto do que o JSON-LD precisa, pela mesma ponte e pelo mesmo motivo.
 *
 * O bloco `ProfessionalService` do prerender copiava à mão o `jobTitle` do
 * consultor, com um comentário admitindo que a concordância era manual e que
 * divergir ali faria o schema afirmar um cargo que a tela não mostra. Não
 * precisa ser manual: `CONSULTANT` atravessa por aqui como todo o resto.
 *
 * `FRONTS` entra porque cada frente agora vira um `Service` próprio no schema.
 * São as MESMAS três que os cartões renderizam — uma frente cortada do catálogo
 * some do schema no mesmo build, em vez de continuar sendo oferecida a um motor
 * de busca depois de deixar de ser oferecida ao visitante.
 *
 * `SOCIAL_PROFILES` e `PHONE_E164` fecham o bloco de contato. Ver a nota em
 * constants/links.ts sobre por que o primeiro está vazio de propósito.
 */
export { FRONTS } from './content/fronts';
export { CONSULTANT } from './content/consultant';
export { SOCIAL_PROFILES, PHONE_E164 } from './constants/links';
