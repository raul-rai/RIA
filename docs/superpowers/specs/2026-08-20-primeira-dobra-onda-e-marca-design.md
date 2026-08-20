# Primeira dobra — a onda vira argumento e a marca se apresenta

**Data:** 2026-08-20
**Decisões validadas com:** Raul (brainstorming)

---

## 1. Problema

A primeira dobra falha em três pontos ao mesmo tempo.

**O copy entrega a saída fácil.** "O Tsunami da IA está chegando!" é a frase que o mercado repete desde 2023, e o tempo verbal é o problema: *está chegando* concede ao leitor exatamente o conforto que a página quer tirar dele — "então ainda dá tempo". A exclamação enfraquece a autoridade de quem vende consultoria. E "você está rasgando dinheiro" acusa sem estabelecer por quê.

**A onda está tapada.** A cena 3D é a espinha narrativa do site inteiro — a travessia de seis dobras existe em função dela. Mas no scroll 0 o horizonte fica em `height * 0.54` (`projectPoint`, `src/lib/wave-scene.ts`) e a crista desenha a faixa dos ~45% aos ~65% da viewport. É exatamente ali que o painel de vidro do subtexto está pousado. O bloco de conteúdo, centrado verticalmente, cobre o pico da onda com uma caixa opaca.

**A marca não se explica.** `index.html` declara `<title>RIA — Revolução da Inteligência Artificial</title>`, mas o chip do canto superior mostra só `● RIA`. O visitante nunca descobre o que a sigla significa, e a expansão está a três palavras de distância.

## 2. Objetivo

A dobra passa a contar a tese em três tempos verticais, com a onda no meio fazendo o trabalho pesado:

| posição | papel |
|---|---|
| acima da onda | **o que mudou** — a afirmação contraintuitiva e a virada |
| a onda, no vão | **a mudança em si** — a alteração ambiental, animada, sem nada por cima |
| abaixo da onda | **o veredito** — quem sobrevive a uma alteração dessas, e o que fazer |

A onda deixa de ser fundo decorativo e vira o termo do meio de um argumento. E o chip da marca abre com a frase inteira antes de se recolher na sigla.

Critério de sucesso: entre a última linha do H1 e o topo do painel do subtexto existe uma faixa contínua de onda que **cobre a banda da crista**. O número que importa é a cobertura, não o tamanho — um vão gigante que não contenha o pico não serviria para nada.

Medido em 1280×900: 240px de vão, dos 41% aos 67% da viewport. O horizonte da cena fica em 54%, no meio exato do vão. Em 375×644 o CTA secundário fecha 39px acima da dobra.

## 3. Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Retórica do headline | **Negação + virada** ("não é o futuro / já é o presente") | Fecha a saída do "ainda dá tempo" no próprio H1, antes que o leitor role. |
| Enquadramento do subtexto | **Seleção natural, sem citar Darwin** | A ideia serve; a citação é apócrifa (é de Leon Megginson, 1963, não de Darwin) e virou clichê de LinkedIn. |
| Geometria do vão | **Extremos + espaçador `flex-1` com piso** | Em tela alta a onda engole toda a sobra; em tela baixa o vão recolhe sozinho e o CTA não sai da dobra. |
| Sigla da marca | **R.IA** (não R.AI) | `R`evolução da `I`nteligência `A`rtificial já entrega as iniciais na ordem. Bate com o `RIA` dos seis títulos de capítulo e do `<title>`. |
| Mecânica do colapso | **Largura medida → 0** | As iniciais deslizam e se encostam de verdade. `scaleX` não reflui os vizinhos, então as letras não se juntariam. |
| Repetição da animação | **Uma vez por carregamento** | Logo em loop compete com o conteúdo pela atenção o tempo todo. |

## 4. Copy

### 4.1 Grupo superior

```
◎ CONHECIMENTO RELEVANTE PARA TODO EMPRESÁRIO

A inteligência artificial não é o futuro.
Ela já é o presente — e o presente cobra.
```

A primeira linha em romano, a segunda na itálica de destaque — reusa a variante `isAccent` de `animatedText` que já existe em `src/pages/LandingPage.tsx`. Sem CSS novo.

O eyebrow não muda, e a substituição por `Estratégia para {segmento}` sob `?ref=` continua valendo.

### 4.2 Grupo inferior

```
Nenhuma mudança ambiental poupou o maior nem o mais forte — só quem
se adaptou primeiro. Hoje, adaptar-se é usar IA em TODOS OS SEUS PROJETOS.

[ QUERO ME ADAPTAR PRIMEIRO → ]    [ ENTENDA MELHOR ⌄ ]
```

`todos os seus projetos` mantém o `<strong>` que já está lá — é o único destaque do parágrafo e o gancho da oferta.

A primeira redação deste parágrafo tinha 39 palavras e ocupava **7,1 linhas** num celular de 375px de largura — sozinha, empurrava o CTA secundário para fora da dobra. Sete linhas de corpo num hero é gordura mesmo onde a dobra não aperta. A versão acima tem 24 palavras e 5,1 linhas.

### 4.3 O que não muda

Os headlines de `?ref=industria|servicos|varejo` permanecem na retórica atual. Ficam fora de escopo por decisão explícita; alinhá-los à forma "X não é Y — é Z" é trabalho separado.

## 5. Layout

`SceneHero` deixa de ser um bloco centrado e passa a `justify-between` sobre três filhos:

```
┌─ min-h: calc(100svh - 11rem)  [md: calc(100svh - 12rem)] ─┐
│  grupo topo    ── eyebrow + h1                            │
│  espaçador     ── flex-1, min-h 8svh [md: 18svh]          │
│  grupo base    ── subtexto + CTAs                         │
└───────────────────────────────────────────────────────────┘
```

As constantes de altura derivam do padding que `ChapterSection` já reserva (`pt-20 pb-24` no mobile = 11rem; `md:pt-28 md:pb-20` = 12rem). Não são números escolhidos: se aquele padding mudar, estes precisam mudar junto.

Em tela de até 600px de altura o `ChapterSection` já recolhe o padding para 8rem. O `calc` continua descontando 11rem — reserva a mais, nunca a menos, então o efeito é um `min-height` conservador demais e jamais um transbordo. Não vale uma variante só para isso.

O espaçador é `flex-1` com `min-height`, não uma altura fixa. É isso que resolve os dois extremos com a mesma regra — em monitor alto ele absorve toda a folga e o vão passa de 34% da tela; num celular de 640px ele encolhe até o piso de 8svh (~51px), e a soma do conteúdo com o padding fica abaixo da viewport.

O piso tem uma terceira faixa, por **altura** e não por largura: abaixo de 600px de viewport o piso vai a zero. O `md:` liga aos 768px de largura, e um celular deitado passa disso com 375px de altura sobrando — ali o piso de 18svh abria 68px numa tela que não tinha 68px para dar. É a mesma regra que `ChapterSection` e `EliteHUD` já aplicam, pelo mesmo motivo. Numa tela dessas não há folga para revelar onda nenhuma, e reservar espaço para uma revelação que não acontece só empurra o CTA para fora. O `flex-1` continua ali e reabre sozinho assim que houver sobra.

O espaçador é `aria-hidden` e não recebe conteúdo: é vazio proposital, e o leitor de tela salta direto do H1 para o subtexto.

A faixa do FAB do WhatsApp continua protegida pelo `pb-24` existente — o grupo base encosta no limite do padding, não na borda da tela.

## 6. `BrandMark` — componente novo

Substitui o `motion.div` inline do chip da marca em `src/pages/LandingPage.tsx`. Arquivo próprio: `src/components/BrandMark.tsx`.

### 6.1 Fases

| fase | duração | comportamento |
|---|---|---|
| digitação | ~2,2s | `Revolução da Inteligência Artificial` aparece caractere a caractere; o chip cresce em largura |
| pausa | 0,4s | a frase inteira fica legível |
| revelação | 0,8s | `R`, `I` e `A` escurecem e engrossam; o restante clareia |
| colapso | 0,9s | as três caudas fecham a largura até 0; as iniciais deslizam e se encostam |
| assentamento | 0,4s | o ponto ciano pulsante entra à esquerda → `● RIA` |

### 6.2 Estrutura

Seis spans `inline-block`, não trinta e cinco:

```
[R] [evolução da ] [I] [nteligência ] [A] [rtificial]
 ▲        ▲         ▲        ▲         ▲       ▲
 fica   colapsa    fica    colapsa    fica  colapsa
```

A largura de cada cauda é medida uma vez em `useLayoutEffect`, depois da digitação terminar, e animada de `Npx` até `0` junto com `opacity`. Medir em vez de estimar é o que faz o colapso funcionar com qualquer fonte e qualquer largura de tela.

A digitação corta a frase por índice de caractere e distribui esse índice entre os seis spans — os spans existem desde o primeiro frame, com o texto truncado. Assim a medição e o colapso não dependem de remontar a árvore.

### 6.3 Estado final

Idêntico ao chip de hoje: `glass-chip` + ponto `bg-accent animate-pulse` + `RIA` em `tracking-[0.35em] uppercase font-black`. A animação **chega** no design atual; nada mais no site muda por causa dela.

### 6.4 Acessibilidade

- Todo o bloco animado é `aria-hidden="true"`.
- Um `sr-only` irmão, estático desde o primeiro frame, lê `RIA — Revolução da Inteligência Artificial`.
- Com `prefers-reduced-motion`, o componente monta direto no estado final. Reusa `prefersReducedMotion()` de `src/lib/canvas-quality.ts` — a mesma função que a onda já consulta.
- O chip continua `hidden md:block`: no celular a frase completa não cabe, e o topo já pertence ao índice de vulnerabilidade.

## 7. Efeito colateral obrigatório

Trocar o CTA primário quebra uma corrente que existe hoje. `src/content/intents.ts` faz o lead "dizer" ao agente **"Quero parar de rasgar dinheiro. Por onde eu começo?"** — é o eco literal do botão. Com o botão em "Quero me adaptar primeiro", o chat abriria com uma frase que o visitante nunca leu, e a costura fica visível no momento mais frágil do funil.

Muda junto, no mesmo commit:

- `INTENTS['hero-cold'].userMessage` → `Quero me adaptar primeiro — antes do meu concorrente. Por onde eu começo?`
- a variante com segmento → `Tenho uma indústria e quero me adaptar primeiro — antes do meu concorrente. Por onde eu começo?`

A frase **abre com o texto literal do botão** e só então se completa. É essa repetição que faz o chat parecer continuação do clique, e não um formulário novo.
- as asserções que travam a string antiga em `tests/intents.test.ts` e `tests/agent-intent.test.ts`

`agentReply` de `hero-cold` ("Começa por saber onde está o vazamento…") continua coerente e não muda.

## 8. Verificação — resultados medidos

| # | o que | resultado |
|---|---|---|
| 1 | `tsc --noEmit` + `vitest run` | limpo; 124 testes, 14 arquivos |
| 2 | Console do navegador | sem erros |
| 3 | 1280×900 — vão | 240px, 26,6% da viewport, faixa 41%→67%, horizonte em 54% ✅ |
| 4 | 375×644 — dobra | CTA "Entenda melhor" fecha 39px acima da dobra ✅ |
| 5 | 812×375 — dobra | transborda 77px ⚠️ ver abaixo |
| 6 | `BrandMark` — estado final | chip 247px → 85px; caudas em width 0 / opacity 0; `letter-spacing` 3,85px (= 0,35em); texto visível `RIA` ✅ |
| 7 | `BrandMark` — acessibilidade | `sr-only` lê `RIA — Revolução da Inteligência Artificial`; bloco animado com `aria-hidden="true"` ✅ |

### O vão ficou em 26,6%, não nos ~34% estimados

A estimativa da primeira redação da spec não levava em conta que o headline novo é mais alto que o antigo. O que importa foi atingido: o vão vai de 41% a 67% e o horizonte da cena está em 54%, então a banda da crista cai inteira dentro dele. Aumentar o vão além disso exigiria cortar conteúdo sem ganho de cobertura.

### Celular deitado (812×375) continua transbordando

**Não é regressão desta mudança — é condição pré-existente.** Medido no mesmo navegador, reconstituindo o layout anterior no DOM:

| layout | transbordo em 812×375 |
|---|---|
| anterior | 68px |
| atual | 77px |

Os 9px de diferença vêm do headline novo ser mais alto que o antigo, não do vão: nessa faixa de altura o piso do espaçador já é zero. Numa viewport de 375px de altura não cabe eyebrow + H1 de duas linhas + subtexto + dois CTAs, com ou sem onda. Corrigir isso é trabalho separado — provavelmente encolher o H1 sob `max-height`.

### O que não foi verificado no navegador

`prefers-reduced-motion: reduce` foi conferido **por leitura do código**, não em execução. A ferramenta de navegador desta sessão não emula a preferência, e interceptar `matchMedia` não sobrevive ao recarregamento que remontaria o React. O caminho é direto — `useState(reduced ? FULL_LENGTH : 0)` e `useState(reduced ? 'done' : 'typing')`, com o `animate` das caudas já em `{ width: 0, opacity: 0 }` sem depender da medição — mas continua sem prova de execução.
