# Profundidade e ênfase na imagem — dobra "Parcerias frutíferas + Quem executa"

**Data:** 2026-09-03
**Arquivo alvo:** `src/components/CredibilitySection.tsx` (+ `src/index.css`, um hook novo)
**Escopo:** apenas a dobra 4 (cases + bio). Sem tocar hero, onda, ou outras dobras.

## Problema

A dobra está visualmente apagada. Três cartões de vidro chapados e um painel de
bio onde a foto do Raul é um quadradinho de ~144px jogado na lateral. Nada tem
profundidade, nada se move de forma fluida, e a dobra parece flutuar solta sobre
o fundo da onda em vez de conversar com ele.

O pedido: elementos mais fluidos, **ênfase na imagem** (a foto), e uma sensação
de 3D — decidido em brainstorming: **sem three.js**, só CSS 3D transforms, para
não violar a disciplina de performance do projeto (hero em CSS puro, `LazyMotion`
enxuto, SSR/prerender, zero dependência pesada).

## Princípio

Profundidade real e movimento fluido via `perspective` + `transform` 3D,
dirigidos por um hook pequeno que escreve o tilt em CSS custom properties dentro
de `requestAnimationFrame`. Tudo é **enhancement progressivo**: sem JavaScript
ou com `prefers-reduced-motion`, os elementos ficam estáticos, planos e
completamente visíveis. Nenhum byte novo no bundle além do hook.

## Unidades

### 1. `usePointerTilt` — o motor compartilhado (novo)

`src/hooks/usePointerTilt.ts`

- Retorna um `ref` para o elemento container e aplica, em `pointermove`, uma
  inclinação em perspectiva proporcional à posição do cursor dentro do elemento.
- Escreve o resultado em CSS custom properties (`--tilt-x`, `--tilt-y`, e um
  `--tilt-active` 0/1 para o CSS interpolar a volta ao repouso). O CSS é quem
  consome; o JS nunca toca `style.transform` linha a linha.
- Atualização agendada por `requestAnimationFrame` (no máximo um frame pendente),
  cancelada no `pointerleave` (volta ao repouso) e no unmount.
- **Desarme por contrato:**
  - Só arma se `matchMedia('(hover: hover) and (pointer: fine)').matches` — ou
    seja, mouse de verdade. Toque/mobile nunca recebe tilt.
  - Só arma se `!matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - Ambos reavaliados; se qualquer um falha, o hook não adiciona listeners e o
    elemento fica no repouso.
- Parâmetros: intensidade máxima em graus (default ~8) e um multiplicador de
  profundidade para o plano da foto. Cards passam intensidade menor (~4).

Testável isoladamente: dado um retângulo e uma posição de ponteiro, calcula
`--tilt-x`/`--tilt-y` esperados; com reduced-motion ou sem hover fino, não arma.

### 2. Painel de bio — a foto como protagonista

Dentro de `CredibilitySection.tsx`, o `glass-panel` da bio:

- **Foto grande:** sobe de `w-28/w-36` para uma coluna protagonista
  (~`w-72`/`~300–340px` no desktop; grande e centralizada no topo no mobile). A
  grade passa de `[auto_1fr]` para dar peso real à coluna da imagem.
- **Moldura cinematográfica:** anel/borda em gradiente ciano→azul (o mesmo
  `#38bdf8`/azul da onda em `DataWave3D`), sombra em camadas e um *glow* ciano
  suave na base. O glow é **estático** (ou transição no hover) — nunca uma
  animação `infinite`, para não cair na exigência de guarda do MOV-04/06.
- **Tilt 3D + parallax:** o painel recebe `perspective` e `transform-style:
  preserve-3d`; o `usePointerTilt` inclina o conjunto, e a foto vive num
  `translateZ` maior que o texto, criando parallax/profundidade real ao mover o
  mouse. Repouso = plano.

### 3. Cards de cases — mais fluidos e com profundidade

Os três `m.article`:

- **Lift no hover:** leve subida (`translateY`) + sombra crescente, além do que o
  `.glass-hover` já faz (clarear + acender a quina).
- **Tilt 3D discreto:** mesmo `usePointerTilt`, intensidade menor (~4°), com a
  quina acesa reagindo ao cursor.
- **Respiro na hierarquia:** headline um pouco maior; rótulos (Antes / O que
  entrou / Prazo) em cor de accent; menos aperto vertical.
- A **entrada** continua `initial={{ y: 16 }}` **sem `opacity`** — contrato
  MOV-17. O tilt é aplicado por transform via custom property no elemento, sem
  reintroduzir opacidade na variante `initial`.

## Cor / coesão

Os acentos (anel da foto, glow, quina dos cards no hover) puxam o
ciano/azul-elétrico da onda. Objetivo: a dobra deixar de parecer descolada do
fundo.

## Contratos a preservar (travados por teste — não podem regredir)

- **MOV-17:** nenhum `initial={{...}}` em `CredibilitySection.tsx` pode conter
  `opacity: 0`.
- **MOV-20 / MOV-21:** no HTML publicado, nada de conteúdo (`glass-card`, `Raul
  Vieira`, `Parcerias frutíferas`) pode sair com `style="opacity:0"`; no máximo um
  elemento invisível no site inteiro, e ele vive dentro do chat.
- **MOV-04 / MOV-06 / MOV-06b:** se surgir qualquer animação CSS `infinite`, ela
  precisa de guarda `prefers-reduced-motion: reduce` **depois** da definição no
  cascade (fonte e CSS compilado). Decisão de design: **evitar animação infinita
  nova** — glow e brilhos são estáticos ou transições de hover.
- **MOV-19:** nada de `animation-timeline` no CSS.
- **SSR/no-JS:** o tilt roda só no cliente; o markup renderizado no servidor é o
  estado de repouso, plano e visível. `usePointerTilt` não deve quebrar SSR
  (sem acesso a `window`/`matchMedia` fora de `useEffect`).
- **Reduced-motion e toque:** tilt desarmado em ambos.

## Fora de escopo (YAGNI)

- three.js / WebGL / qualquer modelo 3D.
- Mudança de conteúdo (textos dos cases, bio, credenciais).
- Outras dobras, hero, onda, rodapé.
- Trocar a foto — segue `/raul.pedro.webp`.

## Testes

- **Unidade:** `usePointerTilt` — cálculo do tilt e o desarme por
  reduced-motion / ausência de hover fino.
- **Regressão:** `movimento.test.ts` continua verde (rodar após `npm run build`
  para MOV-06b/MOV-20/21).
- **Verificação visual:** preview no navegador (desktop com mouse → tilt;
  mobile/emulado → sem tilt; reduced-motion → plano) com screenshot antes/depois.
