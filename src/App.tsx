import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
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
/**
 * Só o motor de animação que esta página usa.
 *
 * `motion.div` arrasta o motion INTEIRO para o bundle: drag, animação de
 * layout, projeção, pan — recursos que esta página não usa em lugar nenhum
 * (verificado: zero `drag`, zero `layout`, zero `layoutId`). `m` é o mesmo
 * componente sem essa bagagem, e `domAnimation` é o conjunto que traz o que
 * daqui se usa de fato: animação, saída, e os gestos de hover, toque, foco e
 * `whileInView`.
 *
 * `domAnimation` e não `domMax`: a diferença entre os dois é exatamente drag e
 * layout. E `features={domAnimation}` importado de forma ESTÁTICA, não pela
 * versão assíncrona que a documentação sugere — a assíncrona economiza mais,
 * mas cria uma SEGUNDA requisição da qual a visibilidade do conteúdo passa a
 * depender: doze elementos abaixo da dobra são servidos com `opacity: 0` e só
 * acendem pelo `whileInView`. Trocar bytes por um novo modo de falha em que a
 * página fica permanentemente em branco no meio não é uma troca boa.
 *
 * `strict` fecha a porta: com ele, um `motion.div` que volte a aparecer lança
 * erro em vez de silenciosamente arrastar a biblioteca inteira de novo.
 */
export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
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
    </LazyMotion>
  );
}
