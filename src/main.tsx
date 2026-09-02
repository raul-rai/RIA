import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';

/**
 * Fontes auto-hospedadas.
 *
 * Antes vinham de fonts.googleapis.com por um <link> no index.html. Duas
 * consequências, e as duas doíam:
 *
 * 1. PRIVACIDADE. Toda visita entregava o IP do visitante ao Google, num site
 *    que constrói uma barra de consentimento inteira para o Analytics e
 *    publica uma política dizendo exatamente para onde os dados vão — sem
 *    mencionar este. Aqui a transferência não passa a ser divulgada: ela deixa
 *    de existir.
 *
 * 2. LCP. Era uma requisição de TERCEIRO, render-blocking, no caminho crítico:
 *    dois preconnect, a folha do Google, e só então os woff2 de fonts.gstatic.
 *    Medido em 228 ms de latência só para a folha, antes de qualquer letra.
 *    Agora os arquivos saem do mesmo domínio, com o mesmo hash de cache do
 *    resto do bundle.
 *
 * Só os eixos de peso (`wght`), não os de tamanho óptico (`opsz`): o eixo
 * óptico do Inter custa +25 KB por arquivo e a diferença, nos tamanhos usados
 * aqui, não paga o caminho crítico. Cada arquivo traz unicode-range, então o
 * navegador baixa só o subconjunto latino.
 */
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/playfair-display/wght.css';
import '@fontsource-variable/playfair-display/wght-italic.css';

import './index.css';

const container = document.getElementById('root')!;

const tree = (
  <StrictMode>
    {/* basename acompanha o `base` do Vite: na home é '/', no build de
        avaliação é '/v2/'. Sem isso, dentro de /v2 o router acharia que a rota
        é '/v2' — que não existe — e renderizaria a página em branco. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/**
 * Hidrata quando o HTML veio prerenderizado do build; monta do zero quando não
 * veio (dev server, ou se o prerender falhar e o deploy sair com o shell vazio).
 *
 * A checagem é por conteúdo, não por flag: `firstElementChild` só existe se o
 * scripts/prerender.js injetou a árvore. Assim o `npm run dev` continua
 * funcionando exatamente como antes, sem branch de ambiente.
 */
if (container.firstElementChild) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
