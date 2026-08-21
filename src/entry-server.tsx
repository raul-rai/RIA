import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';

/**
 * Entrada de servidor — usada so pelo prerender do build (scripts/prerender.js).
 * Nunca vai para o bundle do navegador.
 *
 * POR QUE ISTO EXISTE
 *
 * O `dist/index.html` desta versao tinha exatamente isto no corpo:
 *
 *     <body><div id="root"></div></body>
 *
 * Um SPA client-side puro, 7,6 KB no ar. O problema nao e teorico: a Frente 1
 * do catalogo vende "site que o ChatGPT, o Gemini e o Perplexity conseguem
 * citar", e GPTBot, PerplexityBot e ClaudeBot NAO executam JavaScript. Desta
 * pagina eles enxergavam um titulo, uma meta description e dois blocos de
 * JSON-LD — nada dos capitulos, nada das frentes, nada dos casos. E o cartao
 * de diagnostico logo acima pergunta ao visitante se o SITE DELE sobrevive aos
 * motores de IA. O produto principal era refutado pela propria entrega.
 *
 * Agora o HTML sai do build com o conteudo dentro e o React hidrata por cima.
 * O visitante nao perde nada; o crawler passa a ter o que ler.
 *
 * DIFERENCA PARA A VERSAO DE /v2
 *
 * La o prerender tambem GERA o <head> (title, canonical, OG, JSON-LD) a partir
 * de content/offer.ts. Aqui nao: o index.html desta versao ja traz o head
 * inteiro escrito a mao, e reescreve-lo mudaria o texto publicado. O prerender
 * daqui so injeta o corpo. Ver a nota no topo de scripts/prerender.js.
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
 * As rotas que viram arquivo estatico.
 *
 * Fonte unica do prerender e do sitemap — se uma rota entrar aqui, ela ganha
 * HTML proprio E entra no sitemap.xml no mesmo build. E o que impede o caso
 * classico de sitemap listando pagina que nao existe (ou o contrario).
 *
 * Esta versao tem uma rota so. `/onda` fica de fora de proposito: e uma pagina
 * de estudo da cena 3D, sem conteudo indexavel, e lista-la so diluiria o
 * rastreamento.
 */
export const ROUTES = [{ path: '/', changefreq: 'weekly', priority: '1.0' }] as const;
