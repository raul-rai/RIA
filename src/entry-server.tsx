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
