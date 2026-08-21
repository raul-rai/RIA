import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root')!;

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/**
 * Hidrata quando o HTML veio prerenderizado do build; monta do zero quando nao
 * veio (dev server, ou se o prerender falhar e o deploy sair com o shell vazio).
 *
 * A checagem e por conteudo, nao por flag: `firstElementChild` so existe se o
 * scripts/prerender.js injetou a arvore. Assim o `npm run dev` continua
 * funcionando exatamente como antes, sem branch de ambiente — e um prerender
 * quebrado degrada para o comportamento antigo em vez de dar tela branca.
 */
if (container.firstElementChild) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
