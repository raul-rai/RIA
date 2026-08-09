# RIA — Elevação a padrão premium

**Data:** 2026-08-09
**Status:** aprovado, pronto para plano de implementação
**Escopo:** landing page RIA (`/`), rota `/onda` secundária

---

## 1. Contexto

A RIA vende consultoria de IA de ticket alto para empresas brasileiras de R$ 100k+/mês. A landing page usa a metáfora do tsunami para criar urgência e funila o visitante até um agente de IA que qualifica e entrega o lead no WhatsApp do consultor.

O site já foi reconstruído uma vez. O `.planning/` (abril/2026) descreve a **v1** — página de scroll convencional com Navbar, Hero, Services, TheChoice, About e FinalCTA. A **v2**, hoje em produção, é uma narrativa de 7 cenas com scroll sequestrado. Os 11 componentes órfãos em `src/components/` são os restos da v1.

A v2 já implementou boa parte do que o documento `outputs/RIA_Revisao_3_Personas.md` pedia: verticalização por `?ref=`, terminal de diagnóstico, chat qualificador e prova social em vídeo. **A ambição está correta; o acabamento ficou pela metade.**

### Estado atual verificado

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **falha** — 2 erros |
| `npx vitest run` | **falha** — 1 de 12 testes |
| `npm run build` | passa — 421 kB / 133 kB gzip, chunk único |
| Código morto | 11 componentes, 1.146 de 3.381 linhas (34%) |
| Assets mortos em `public/` | 4,0 MB |
| Tela vazia entre hero e CTA | 12,0 s desktop / 9,6 s mobile |
| `prefers-reduced-motion` | ausente no projeto inteiro |
| Analytics | inexistente |

---

## 2. Decisões tomadas

| # | Decisão | Alternativas descartadas | Razão |
|---|---|---|---|
| D-01 | **Estética: híbrido cinematográfico.** Cyberpunk vira cenário (onda, cidade, ao fundo); a camada de conteúdo é editorial e sóbria. | Refinar o cyberpunk atual; editorial silencioso puro | O ciano hoje está no fundo, no texto, nas bordas, nos ícones e nos botões ao mesmo tempo. Quando tudo brilha, nada brilha. Reservar o ciano preserva o espetáculo e devolve hierarquia. |
| D-02 | **Scroll: capítulos com snap.** Scroll nativo, `scroll-snap` por capítulo, onda dirigida pela posição real do scroll, CTA persistente. | Manter o scroll sequestrado; scroll livre clássico | Elimina 12 s de tela vazia, torna a onda responsiva ao gesto (mais impressionante, não menos), põe os 7 capítulos no DOM para indexação, e devolve navegação por teclado. |
| D-03 | **Prova viva sem teatro.** Demo interativa + casos com números reais + gravação real. Nada de HUD com dados fabricados. | HUD de agente ao vivo com dados sintéticos | Os agentes existem mas os dados são de cliente. Um prospect que descobre um feed falso invalida toda a proposta de valor. |
| D-04 | **Entrega em camadas com portão de validação.** Fundação → Motor → 1 capítulo para aprovação → rollout → prova viva. | Big-bang; fatia vertical primeiro | Site permanece publicável a cada merge (é usado em demos ao vivo). O portão limita o prejuízo de uma direção errada a um capítulo. |

> **Sobre o tamanho deste spec:** as quatro camadas não cabem num único plano de implementação. O primeiro plano cobre **Camada 0 + Camada 1**, que juntas formam uma entrega coerente e publicável (base limpa + motor novo, sem mudança estética). Camadas 2 e 3 ganham planos próprios, escritos depois do portão de validação — porque o que for aprendido no capítulo 1 vai mudar detalhes do rollout.
| D-05 | **Marca unificada no ciano `#00E5FF`.** Favicon e OG regenerados. | Manter azul `#2a42ec` como marca institucional | Favicon e OG são azuis e o site é ciano. O preview do WhatsApp não se parece com a página que abre depois. |
| D-06 | **Sem contador de vagas fake.** Só entra se for número real via n8n. | Escassez simulada (pedido da persona CMO) | Um visitante recorrente detecta o número congelado e a credibilidade da prova de IA cai junto. |

---

## 3. Camada 0 — Fundação

**Objetivo:** build verde e base limpa. Invisível ao visitante, zero risco, destrava as camadas seguintes.

### 3.1 Correções de build

- `tsconfig.json`: adicionar `"types": ["vite/client"]` — resolve `import.meta.env` em `PotentialDiagnostic.tsx:42`.
- `vitest.config.ts:7`: `reporter` → `reporters`.

### 3.2 Remoção de código morto

Apagar (zero referências, restos da v1):

```
About.tsx  ExperienceRIA.tsx  FinalCTA.tsx  Footer.tsx  Hero.tsx
LeadDiagnostic.tsx  MicroProof.tsx  Navbar.tsx  Services.tsx
TheChoice.tsx  WhyNow.tsx
```

**Manter `src/constants/links.ts`.** É o padrão correto e hoje só é importado pelos componentes mortos. Passa a ser a fonte única do WhatsApp — `LandingPage.tsx:387` perde o `5516997879837` cravado.

Apagar de `public/`: `rio-realss.png` (3,3 MB), `cyberpunk_scene.png` (694 kB).

Remover de `package.json`: `@google/genai`, `express`, `@types/express`, `dotenv`, `autoprefixer`.

Remover de `vite.config.ts` o bloco `define` que injeta `process.env.GEMINI_API_KEY` no bundle do cliente. Nada usa Gemini; o `define` é um vazamento de chave à espera de alguém preencher a variável.

### 3.3 Configuração unificada

Criar `src/config.ts` como fonte única de endpoints:

```ts
export const config = {
  chatWebhook: import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL,
  diagnosticWebhook: import.meta.env.VITE_N8N_DIAGNOSTIC_WEBHOOK_URL,
} as const;
```

Elimina a URL fixa em `AIChatAgent.tsx:16` (que hoje aponta para `libra-credito-n8n.usybav.easypanel.host`, host de outro projeto). Atualizar `.env.example` com as duas chaves.

Comportamento quando a variável falta: o componente renderiza um estado de indisponibilidade explícito em vez de tentar `fetch` num `undefined`.

### 3.4 Higiene

- `package.json`: `name` de `react-example` para `ria-landing`, versão `1.0.0`.
- `README.md`: substituir o template do AI Studio por instruções reais.
- `npm run clean`: `rm -rf dist` não roda em PowerShell — trocar por `rimraf` ou script Node.
- Remover os 8 `console.log` de produção (dois deles logam a URL do webhook e as mensagens do usuário).
- `index.html`: remover o listener de `blur` que troca o título por "⚠️ O Tsunami não espera…". Ele sobrescreve o título dinâmico por capítulo e é um padrão que desgasta a marca junto ao público executivo.

### 3.5 Pendente de terceiros

Canonical, OG e JSON-LD em `index.html` usam `https://ria.com.br` como placeholder. **Bloqueado até o domínio real ser definido.** Se não houver domínio no momento da execução, a Camada 0 fecha sem este item e ele fica registrado como pendência.

### Critérios de aceite — Camada 0

- `npm run lint` sai com código 0
- `npm test` passa integralmente (hoje 11 de 12; `brand.test.ts` é reescrito na Camada 2, então na Camada 0 ele é ajustado para afirmar o que de fato existe)
- `npm run build` passa e o bundle encolhe
- Nenhuma ocorrência de `wa.me/55`, `easypanel.host` ou `libra-credito` fora de `config.ts` e `links.ts`
- O site continua funcionando exatamente como antes — nenhuma mudança visível

---

## 4. Camada 1 — Motor

**Objetivo:** substituir o avanço por temporizador por scroll real dirigido a gesto, e tornar o canvas digno de um site que vende performance.

### 4.1 Arquitetura

Fluxo atual:

```
wheel → setTimeout(800) → setShowContent(false) → setTimeout(1200)
      → setActiveScene(n) → re-render de LandingPage → prop waveProgress
      → useEffect → ref → lerp no rAF
```

Fluxo proposto:

```
scroll nativo → useScroll() → MotionValue scrollYProgress
                            → canvas rAF lê .get()        [zero re-render]

IntersectionObserver (só nas bordas) → setActiveChapter → HUD, fundo, title
```

`useScroll` vem do `motion`, já é dependência. MotionValue muda sem disparar re-render, então o canvas acompanha o scroll a 60 fps sem o React participar. O `setState` sobrevive apenas para o que muda em fronteira de capítulo.

### 4.2 Estrutura do documento

- `NarrativeScroll` deixa de ser um trocador de cenas e passa a ser um contêiner de rolagem.
- Cada capítulo é um `<section>` de `min-height: 100svh` (`svh`, não `vh` — corrige a barra de endereço do Safari mobile).
- `scroll-snap-type: y proximity` no contêiner, `scroll-snap-align: start` nos capítulos. **`proximity` e não `mandatory`**: se um capítulo for mais alto que a viewport, o snap desiste em vez de prender o usuário.
- `overscroll-behavior-y: contain`.
- `overflow: hidden` e `height: 100vh` saem do root em `LandingPage.tsx:401`.
- Os 7 capítulos passam a coexistir no DOM. Vídeos e imagens abaixo da dobra ganham `loading="lazy"`.

### 4.3 Canvas (`DataWave3D`)

- **DPR:** `canvas.width = w * dpr` com teto em 2, `ctx.scale(dpr, dpr)`. Resolve o borrado em retina.
- **LOD em 3 níveis** (`colunas × linhas` da malha), escolhido por `navigator.hardwareConcurrency` e largura de tela:
  - alto `45 × 55` (o atual) · médio `32 × 40` · baixo `24 × 30`, este último sem o `fill` dos quadriláteros
- **Sonda de FPS:** média móvel sobre 60 frames; abaixo de 45 fps por 2 s, rebaixa um nível. Nunca promove de volta, para não oscilar.
- **Pausa:** `document.visibilitychange` cancela o rAF. Hoje a animação roda com a aba oculta.
- **`prefers-reduced-motion: reduce`:** desliga o loop e a componente temporal do ruído; a onda continua respondendo ao scroll, redesenhando só quando o `scrollYProgress` muda. Movimento por intenção do usuário é aceitável; movimento ambiente em loop é o que incomoda.
- **Fallback:** se `getContext('2d')` retornar `null`, renderiza um gradiente CSS estático em vez de tela preta.

### 4.4 Navegação

- **CTA flutuante**, discreto, canto inferior. Aparece a partir do capítulo 2, some quando o capítulo do chat entra na viewport. Usa `links.ts`.
- Os dots viram navegação real: `<nav>` com `aria-current`, alvo de toque de 44 px, e `scrollIntoView({ behavior: 'smooth' })` — o salto sem transição de `NarrativeScroll.tsx:166` deixa de existir.
- Navegação por teclado passa a funcionar nativamente (PageUp/PageDown/Home/End/Tab). Adicionar skip link.
- `document.title` por capítulo continua, agora disparado pelo IntersectionObserver.

### Critérios de aceite — Camada 1

- Zero segundos de tela vazia entre capítulos
- A onda responde continuamente ao scroll, sem passo discreto
- React DevTools não acusa re-render de `LandingPage` durante o scroll
- 55+ fps sustentados no nível de LOD escolhido, medido pela própria sonda
- Com `prefers-reduced-motion`, nenhuma animação em loop permanece ativa
- Todos os 7 capítulos presentes no HTML renderizado
- CTA alcançável em 1 clique de qualquer capítulo

---

## 5. Camada 2 — Sistema visual

**Objetivo:** aplicar a direção D-01 sobre um contrato de tokens, capítulo a capítulo, com portão de validação.

### 5.1 Tokens (`src/index.css`, bloco `@theme`)

Escala tipográfica — 7 degraus fluidos, sem breakpoint manual:

```
--text-micro     9 → 11px    labels, tracking .2em
--text-caption  11 → 13px
--text-body     14 → 17px
--text-lead     17 → 22px
--text-h3       20 → 30px
--text-h2       28 → 56px
--text-display  34 → 76px
```

Aposenta `.heading-hero` e `.heading-section`, que hoje carregam 4 breakpoints escritos à mão cada.

Ritmo de espaçamento, base 8: `4 · 8 · 16 · 24 · 40 · 64 · 96 · 160`.

Papéis de cor:

```
--color-surface    #010408      fundo
--color-surface-2  #0A0D12      painéis elevados
--color-ink        #FFFFFF      títulos
--color-ink-2      white 72%    corpo
--color-ink-3      white 46%    secundário
--color-ink-4      white 26%    dicas
--color-line       white 8%     hairlines
--color-accent     #00E5FF      reservado
--color-action     #FFFFFF      CTA
```

Movimento: `--ease-out-expo: cubic-bezier(.16,1,.3,1)`, `--dur-fast: 200ms`, `--dur-base: 450ms`, `--dur-slow: 800ms`.

### 5.2 Regras de aplicação

1. `--color-accent` só em quatro lugares: a onda, filetes de 1px, o anel de foco, e o ponto de "agente conectado". **Nunca em texto de leitura.**
   - **O CTA primário é branco (`--color-action`), não ciano.** O ciano marca o próximo passo apenas no estado de `hover`/`focus` do botão — que é o padrão já existente em `LandingPage.tsx:149`. Assim a cor de destaque sinaliza ação sem competir com a onda pela atenção em repouso.
2. Um único elemento em destaque por tela. Hoje os 8 nós da rede de serviços brilham simultaneamente e nenhum vence.
3. Hover apenas em `translate`, `opacity` e `border`. O `scale-110` genérico sai.
4. `premium-glass` só em superfície de fato elevada. Hoje está em tudo, logo não eleva nada.
5. Máximo 2 pesos de fonte por bloco.

### 5.3 Marca

Regenerar `public/favicon.svg` e `public/og-image.png` em `#00E5FF` com a estética real do site. `scripts/generate-og.js` já existe e é reaproveitável — trocar as três paradas de gradiente `#2a42ec`.

### 5.4 Fontes

Inter e Playfair Display vêm hoje do Google Fonts por `<link>` bloqueante em `index.html:15`. Auto-hospedar subsets woff2 em `public/fonts/`, com `font-display: swap` e `<link rel="preload">`. Elimina duas conexões externas e o flash de fonte.

### 5.5 Portão de validação

Com os tokens no lugar, o **capítulo 1 (hero)** é reconstruído por completo na direção D-01 e submetido à aprovação do usuário **antes** de qualquer outro capítulo ser tocado.

### Critérios de aceite — Camada 2

- Nenhum valor tipográfico ou de espaçamento fora da escala em `src/`
- `--color-accent` ausente de qualquer regra de cor de texto corrido
- Favicon e OG na mesma cor do site
- Nenhuma requisição a `fonts.googleapis.com` na aba de rede
- Capítulo 1 aprovado pelo usuário antes do rollout

---

## 6. Camada 3 — Prova viva

### 6.1 Sem dependência externa

- **Transparência do agente:** o chat substitui o "digitando…" genérico pela latência real medida (`respondeu em 3,4 s`), e pelos passos do agente caso o n8n devolva essa metadata. Sem metadata, só a latência — honesta e suficiente.
- **Ramo de desqualificação:** hoje o único caminho do chat é o WhatsApp. Criar o desvio (conteúdo/newsletter) para quando o agente concluir que o lead está abaixo do corte. Era pedido explícito da persona CEO lean e é o que protege o tempo do consultor.
- **Robustez:** `AIChatAgent.tsx:163` faz `msg.data.roi.toLocaleString()` sem guarda — um payload do n8n sem `roi` derruba a tela. Validar a forma da resposta antes de renderizar.

### 6.2 Dependente de material do usuário

Encaixes construídos vazios e prontos para receber:

- casos com números reais (ex.: "3 SDRs → 1 agente, 40 dias")
- gravação de tela de um agente real trabalhando
- workflow n8n da demo interativa, onde o visitante manda uma tarefa e assiste à execução

### Critérios de aceite — Camada 3

- Nenhum número exibido no site é fabricado
- Resposta malformada do n8n não derruba a interface
- Lead desqualificado recebe um destino digno

---

## 7. Verificação

Cada camada fecha com evidência executada, não com afirmação.

| Verificação | Ferramenta |
|---|---|
| Tipos | `npm run lint` código 0 |
| Contrato de tokens | `tests/tokens.test.ts` — substitui `brand.test.ts`, afirma o contrato novo |
| Sem configuração cravada | `tests/config.test.ts` — varre `src/` por regex e falha se alguém cravar webhook ou telefone |
| SEO | `tests/seo.test.ts` existente, estendido para o domínio real |
| Fumaça ponta a ponta | Playwright: carrega, atravessa os 7 capítulos, exige zero erro de console e CTA alcançável |
| Orçamento de bundle | < 200 kB gzip após code splitting da rota `/onda` |
| Orçamento de canvas | 55+ fps sustentados, medido pela sonda de LOD |

`brand.test.ts` falha hoje porque exige `--color-cta: #2a42ec`, token que nunca foi criado (plano `02-03` não executado) e cuja cor D-05 aposenta. Será reescrito como `tokens.test.ts` afirmando o contrato da seção 5.1 — passa por estar correto, não por ter a asserção removida.

---

## 8. Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| A reescrita do motor faz o site perder a alma cinematográfica | **Alta** | Portão da fatia vertical: um capítulo pronto e aprovado antes dos outros seis |
| `scroll-snap` brigando com capítulos mais altos que a viewport | Média | `proximity` em vez de `mandatory` |
| 7 capítulos montados aumentam o DOM e o custo inicial | Média | Vídeos e imagens abaixo da dobra sob demanda; medição contra o orçamento de bundle |
| Camada 3 parada por falta de material | Baixa | Encaixes construídos vazios; camada não bloqueia as anteriores |
| Site é usado em demos ao vivo durante a obra | Média | Trabalho em branch; `main` sempre publicável; merge só com camada fechada |

---

## 9. Pendências

1. **Domínio real** — bloqueia o fechamento da seção 3.5.
2. **Hospedagem atual** — necessário para não quebrar o pipeline de deploy.
3. **Material da seção 6.2** — sem prazo, não bloqueia nada.
4. **Analytics** — inexistente hoje. Fora do escopo desta rodada, mas antes de ligar tráfego pago será impossível saber se qualquer decisão de conversão funcionou.

---

## 10. Fora de escopo

- Backend próprio para captura de leads — WhatsApp e n8n seguem sendo o canal
- CMS ou painel administrativo
- Blog ou conteúdo dinâmico
- Testes A/B — sem tráfego, não há como concluir nada
- Reescrita do agente n8n em si; esta rodada trata apenas do front-end e do contrato com o webhook
