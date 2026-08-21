import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
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
