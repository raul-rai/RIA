import { MotionConfig } from 'motion/react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OndaPage from './pages/OndaPage';
import PrivacyPage from './pages/PrivacyPage';
import ConsentBar from './components/ConsentBar';

/**
 * `prefers-reduced-motion` para a página inteira.
 *
 * Até ago/2026 a preferência do sistema chegava a exatamente um lugar: o canvas
 * da onda, por `prefersReducedMotion()` em lib/canvas-quality.ts. As ~28
 * animações de entrada do motion — cada `initial`/`whileInView` com `y`, `x` ou
 * `scale` espalhado pelos capítulos — ignoravam a preferência por completo.
 * Quem liga "reduzir movimento" no sistema operacional pede isso porque o
 * movimento causa náusea ou tontura; entregar a página inteira deslizando é
 * ignorar um pedido médico.
 *
 * Uma linha aqui alcança todas de uma vez, porque o motion lê esta
 * configuração pelo contexto: não há como uma animação nova nascer fora dela.
 * Era o defeito de fundo — a preferência estava sendo tratada caso a caso, e
 * caso a caso sempre sobra um.
 *
 * `"user"` e não `"always"`: `always` desligaria o movimento para todo mundo,
 * inclusive para quem não pediu. `user` obedece a mídia do sistema e desarma
 * só as chaves POSICIONAIS (transform, width, height, top/left/right/bottom).
 * A opacidade continua animando — e isso é proposital: um fade não desloca
 * nada no campo visual, não é o que causa desconforto vestibular, e é o que
 * mantém a página com vida em vez de fazer tudo aparecer de estalo.
 *
 * O hero não depende disto. Ele saiu do motion no PERF-01 e hoje é CSS puro,
 * com a própria guarda em index.css — a primeira dobra pinta sem esperar o
 * JavaScript, então a preferência dela também precisa valer sem JavaScript.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onda" element={<OndaPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
      </Routes>
      {/* Fora do <Routes>: o aviso de medição vale para o site inteiro, não
          para uma rota. Ele se esconde sozinho quando não há analytics
          configurado ou quando o visitante já decidiu. */}
      <ConsentBar />
    </MotionConfig>
  );
}
