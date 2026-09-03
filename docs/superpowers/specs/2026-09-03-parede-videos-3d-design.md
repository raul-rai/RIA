# Parede de vídeos 3D — dobra "Vozes do mercado"

**Data:** 2026-09-03
**Arquivo alvo:** `src/components/SocialProofSection.tsx` (+ novo `VideoWall3D.tsx`, hook e módulo puro novos, `src/index.css`, conteúdo novo)
**Escopo:** apenas a dobra 1 (prova social / autoridades). Sem tocar hero, onda, ou outras dobras.

## Origem

Referência trazida pelo usuário: `https://threejs.org/examples/#css3d_youtube` — o
exemplo `CSS3DRenderer` do three.js, que posiciona **iframes reais** do YouTube no
espaço 3D via `transform: matrix3d(...)`. A ideia é uma "parede/órbita" de vídeos
na segunda dobra.

Decidido em brainstorming, ponto a ponto:

1. **Densidade:** hoje só há 3 vídeos de autoridade. A parede é preenchida com os
   3 vídeos **+ painéis de apoio** (frases das autoridades, veículos/logos,
   métricas) para dar volume sem inventar vídeo.
2. **Play:** ao clicar, o iframe entra **inline** no próprio painel, dentro do 3D
   (comportamento do exemplo).
3. **Navegação:** **arrasto livre + auto-giro** lento, com inércia ao soltar.
4. **Mobile:** a parede 3D aparece também no celular, mas o arrasto só gira quando
   **começa sobre um painel**; arrasto no fundo/laterais rola a página.
5. **Arquitetura:** **CSS 3D puro, sem three.js.** Réplica do mesmo efeito com
   `perspective` + `transform-style: preserve-3d` e um hook de órbita pequeno.

## Por que sem three.js

Duas coisas que o projeto protege de propósito, e que o `CSS3DRenderer` violaria:

- **Bundle.** O `DataWave3D` é um renderer Canvas 2D escrito na mão justamente para
  não ter lib 3D. O three + `CSS3DRenderer` somam ~40–50KB gz mesmo minimalista.
- **SSR/indexação.** A dobra é renderizada no servidor (`renderToString`) — é o
  produto da Frente 1, legível por crawler sem JS. O `CSS3DRenderer` constrói os
  painéis via JavaScript no cliente; o conteúdo dos painéis **não** sairia no HTML
  do prerender sem duplicação.

CSS 3D puro entrega o mesmo visual mantendo os painéis como DOM real
server-rendered e o bundle enxuto.

## Princípio

Profundidade e órbita reais via `perspective` + `transform` 3D num container
"rotor", dirigidos por um hook que escreve o ângulo em CSS custom properties
dentro de `requestAnimationFrame`. Tudo é **enhancement progressivo**: sem
JavaScript ou com `prefers-reduced-motion`, os painéis ficam numa arrumação plana,
legível e completa. Nenhuma dependência nova no bundle.

## Unidades

### 1. `orbit-wall.ts` — a matemática pura (novo)

`src/lib/orbit-wall.ts`

Módulo puro, sem DOM, testável isoladamente (na linha de `pointer-tilt.ts` e
`wave-scene.ts`).

- `layoutPanels(count, opts)` → posição de cada painel no arco: `rotateY` por
  índice e `translateZ` (raio), distribuindo `count` painéis num arco de abertura
  configurável. Retorna dados que o CSS consome por painel.
- `dragToAngle(startAngle, dxPx, sensitivity)` → mapeia deslocamento horizontal do
  ponteiro em delta de ângulo (graus).
- `stepAutoRotate(angle, dtMs, degPerSec)` → integra o giro automático.
- `applyInertia(velocityDegPerSec, dtMs, damping)` → decaimento da inércia ao
  soltar; devolve nova velocidade (e para abaixo de um limiar).
- `clampTilt(angleX)` → limita a inclinação vertical (a parede não vira de
  cabeça pra baixo).

Testável: dado `count` e abertura, as posições batem; `dragToAngle` é linear e
simétrico; `applyInertia` decai monotonicamente e zera no limiar.

### 2. `useOrbitWall` — o motor de eventos (novo)

`src/hooks/useOrbitWall.ts`

- Retorna um `ref` para o palco e escreve o ângulo atual em CSS custom properties
  (`--wall-rot-y`, `--wall-rot-x`) no container rotor. O CSS é quem aplica o
  `transform`; o JS nunca toca `style.transform` linha a linha.
- Loop `requestAnimationFrame` único (no máximo um frame pendente): aplica
  auto-giro, ou inércia após soltar, e escreve as CSS vars.
- **Ponteiro (desktop):** `pointerdown` inicia arrasto → acumula `dragToAngle`;
  `pointerup` converte a velocidade recente em inércia. Auto-giro pausa durante o
  arrasto e retoma depois que a inércia zera.
- **Gate de toque (mobile):** o palco recebe `touch-action: pan-y` (scroll
  vertical sempre livre). No `pointerdown`, só captura para órbita se
  `event.target.closest('.wall-panel')` existir **e** o primeiro movimento for
  predominantemente horizontal; caso contrário libera o gesto para o scroll da
  página. **É o ponto mais delicado — exige teste em aparelho real.**
- **Desarme por contrato:**
  - `prefers-reduced-motion: reduce` → não arma o loop; sem auto-giro, sem
    arrasto. A parede fica estática (ver CSS de repouso).
  - Pausa o `rAF` quando a dobra sai do viewport (IntersectionObserver) e quando
    `document.visibilityState === 'hidden'`.
- Cancela o frame pendente e remove listeners no unmount.

### 3. `VideoWall3D` — o componente de apresentação (novo)

`src/components/VideoWall3D.tsx`

- Estrutura: `.wall-stage` (perspectiva) → `.wall-rotor` (gira) → `<ul>` de
  `.wall-panel` (DOM real, server-rendered).
- Recebe `AUTHORITIES` (painéis de vídeo) e os painéis de apoio de `proofPanels.ts`,
  intercala numa ordem estável e posiciona cada um pelas CSS vars vindas do
  `layoutPanels`.
- **Painel de vídeo:** poster **local/gerado** (avatar + nome + botão play), nunca
  `i.ytimg.com`. `<button>` com `aria-label`. No clique, monta o iframe
  `youtube-nocookie` inline no painel. **Só um vídeo por vez:** ao abrir um, os
  demais voltam ao poster (iframe desmontado).
- **Painel de apoio:** card de vidro com frase + atribuição, ou logo de veículo,
  ou métrica. Sem interação além de leitura.
- Reduced-motion / sem JS: o CSS coloca os painéis numa grade plana legível
  (fallback), sem transform de órbita.

### 4. `playerSrc` compartilhado (extração)

`src/lib/youtube.ts` (novo) — extrai `playerSrc(videoUrl, startTime, endTime)` de
`VideoModal.tsx` para um lib comum. `VideoModal` e `VideoWall3D` passam a importar
daqui. Mesma lógica `youtube-nocookie`, mesmos parâmetros. Sem mudança de
comportamento no modal.

### 5. Conteúdo dos painéis de apoio (novo)

`src/content/proofPanels.ts` — tipos + dados dos painéis não-vídeo (frase +
atribuição, logo, métrica). Scaffold com placeholders derivados dos `bio` e do
`AUTHORITIES_DISCLAIMER` atuais, marcados para o usuário revisar/substituir.

### 6. Integração em `SocialProofSection`

`src/components/SocialProofSection.tsx`

- O bloco atual (grade desktop `hidden md:grid` + `AuthorityAccordion` no mobile)
  é substituído pelo `<VideoWall3D>`, que atende os dois breakpoints.
- O cabeçalho ("Vozes do mercado", h2, contador de vistos) e a nota de negativa
  de endosso (`AUTHORITIES_DISCLAIMER`) permanecem.
- O `VideoModal` deixa de ser o caminho de play desta dobra (o play agora é
  inline). Avaliar na implementação se o modal ainda é usado em outro lugar antes
  de remover o import; se não for, remover.

### 7. CSS

`src/index.css` — `.wall-stage` (`perspective`, `touch-action: pan-y`),
`.wall-rotor` (`transform-style: preserve-3d`, `transform` das CSS vars),
`.wall-panel` (posição via vars, `backface-visibility`), `.wall-video`,
`.wall-support`, e o fallback plano sob `prefers-reduced-motion` e sem as vars.

## Fora de escopo (YAGNI)

- Não adicionar novos vídeos de autoridade (decisão: 3 + apoio).
- Não portar o efeito para outras dobras.
- Não implementar zoom/foco de câmera além do play inline.
- Não usar thumbnails hospedadas pelo YouTube.

## Riscos assumidos

1. **Gate de arrasto no mobile** — a distinção "orbitar vs. rolar" é o ponto que
   mais precisa de calibração em toque real; pode exigir ajuste de limiar após
   teste em aparelho.
2. **Foco de teclado dentro de iframe cross-origin** — mesmo limite honesto já
   documentado no `VideoModal`: enquanto o foco está dentro do player, os eventos
   pertencem ao YouTube. Fora do iframe, tab/foco continuam corretos.
