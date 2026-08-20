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

Critério de sucesso: num desktop de 900px de altura, entre a última linha do H1 e o topo do painel do subtexto existe uma faixa de ~34% da viewport onde só há onda em movimento; a crista fica inteiramente visível. Em um celular de 640px de altura útil o CTA secundário continua acima da dobra.

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
Toda mudança ambiental dessa escala terminou igual: não sobreviveu
o maior nem o mais forte — sobreviveu quem se adaptou primeiro.
Hoje, adaptar-se significa usar IA em TODOS OS SEUS PROJETOS.

[ QUERO ME ADAPTAR PRIMEIRO → ]    [ ENTENDA MELHOR ⌄ ]
```

`todos os seus projetos` mantém o `<strong>` que já está lá — é o único destaque do parágrafo e o gancho da oferta.

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

## 8. Verificação

1. `npm test` — a suíte inteira, com as asserções de intent atualizadas.
2. Desktop 1280×900: medir que a faixa entre o H1 e o painel do subtexto passa de 30% da viewport e que a crista aparece inteira dentro dela.
3. Mobile 375×640 e paisagem 812×375: o CTA "Entenda melhor" precisa estar visível sem rolagem.
4. `prefers-reduced-motion: reduce`: o chip precisa mostrar `● RIA` no primeiro frame, sem digitação.
5. Leitor de tela sobre o chip: deve anunciar `RIA — Revolução da Inteligência Artificial` uma única vez.
