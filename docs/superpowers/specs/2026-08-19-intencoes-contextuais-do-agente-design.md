# Intenções contextuais do agente — o clique passa a carregar contexto

**Data:** 2026-08-19
**Branch de origem:** `feat/intencoes-contextuais-do-agente`
**Decisões validadas com:** Raul (brainstorming)

---

## 1. Problema

Os CTAs espalhados pela página apontam todos para o mesmo lugar — o capítulo 5, onde vive o agente — e não fazem nada além de rolar a tela (`goToCta` em `src/pages/LandingPage.tsx`). O visitante que marcou quatro das cinco frentes, auditou o site e leu os casos chega no chat e recebe exatamente a mesma saudação genérica do visitante que caiu de paraquedas no hero. Ele então precisa digitar do zero aquilo que a própria página já sabe sobre ele.

O contexto **já viaja** no payload do chat (`vulnerabilityIndex`, `hasNoWebsite`, `websiteScore`, `frontsCovered` em `AIChatAgent.tsx`). O que não viaja é a **intenção do clique**: de qual dobra o lead veio, o que ele acabou de ler, o que o fez levantar a mão.

Consequências:

1. A conversa começa fria mesmo quando o lead está quente.
2. O momento de maior tensão do site (a nota do site, o "não tenho site") se dissipa no caminho até o chat.
3. O agente pergunta o que a página já respondeu, o que lê como desatenção.

## 2. Objetivo

Cada botão que leva ao agente passa a **injetar uma mensagem na conversa** — escrita na voz do lead, preenchida com o estado real dele — e o agente responde na hora com uma abertura específica daquele contexto.

Critério de sucesso: um visitante que clica em "Montar minha pauta" com uma frente marcada chega ao chat com a conversa já aberta em "Marquei 1 de 5. Faltam Agente SDR, Automação, Sistema sob medida e Dados e decisão. Quero montar minha pauta." — e a resposta do agente já nomeia a primeira frente descoberta. Zero digitação para sair do zero.

## 3. Decisões estruturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Visibilidade da mensagem | **Aparece como fala do lead** | O balão do usuário surge escrito. O agente responde algo que está na tela — nada de "adivinhar" o que o visitante fez. |
| Quem responde a primeira | **Texto pronto no site; n8n assume da 2ª fala** | Latência zero no momento mais frágil do funil, e imune a webhook fora do ar. O primeiro contato não pode depender de infraestrutura de terceiro. |
| Granularidade | **Um template por botão, com lacunas** | Seis templates cobrem oito pontos de clique. O estado real entra nos slots. Manutenível e testável. |
| Reentrada | **Todo clique injeta, com travas** | O lead que volta com quatro frentes marcadas entrega o sinal mais rico que tem. As travas impedem os casos ruins. |

### 3.1 Escopo dos gatilhos

Entram nesta versão:

- Hero — "Pare de rasgar dinheiro"
- Diagnóstico — CTA do resultado
- Diagnóstico — CTA "não tenho site"
- Cinco Frentes — CTA individual por card (5 pontos, 1 template)
- Cinco Frentes — "Montar minha pauta"
- Credibilidade — CTA final

**Fora de escopo:** deep link por URL (`?intent=…`). Fica registrado como próximo passo natural para tráfego pago.

### 3.2 Ressalva registrada: os CTAs do diagnóstico

Hoje `PotentialDiagnostic` entrega o visitante nas Cinco Frentes (`onWantStrategy={goToFronts}`), não no agente — e isso foi construído de propósito no commit `bc90f48`: a tensão da nota é o que faz o catálogo ser lido.

Levá-los direto ao agente **ganha** o lead mais quente do site chegando ao chat com a dor fresca e **perde** o lead que ainda não sabe o que se compra. A alternativa considerada era manter a entrega nas Frentes e deixar o `fronts-agenda` levar tudo ao agente (ele já carrega a nota no contexto).

Decisão: seguir com os CTAs do diagnóstico apontando ao agente. A troca está explícita e é reversível — basta trocar o destino de dois `onClick`.

## 4. O catálogo de intenções

Seis templates. Cada um define **duas** falas: o que o lead diz e o que o agente responde instantaneamente. `{slots}` vêm do estado.

### 4.1 `hero-cold` — Hero, "Pare de rasgar dinheiro"

Contexto disponível: apenas o `?ref` de campanha.

> **Lead (com `ref`):** "Tenho uma {indústria} e quero parar de rasgar dinheiro. Por onde eu começo?"
> **Lead (sem `ref`):** "Quero parar de rasgar dinheiro. Por onde eu começo?"
>
> **Agente:** "Começa por saber onde está o vazamento. Me diz em uma frase o que sua empresa faz e onde o tempo da equipe está indo — eu volto com a frente que paga mais rápido."

O mapa de `ref` reaproveita o `REF_LABEL` já existente em `LandingPage.tsx` (`industria`, `servicos`, `varejo`). `ref` desconhecido degrada para a variante sem segmento.

### 4.2 `diagnostic-result` — CTA do resultado do diagnóstico

> **Lead:** "Meu site tirou {63}/100 no diagnóstico. Quero entender o que isso me custa."
>
> **Agente:** "{leitura da faixa}. A nota é sintoma — o custo está nas buscas e nas citações de IA que passam longe de você. Me diz o que sua empresa vende e pra quem."

A leitura da faixa é derivada do score dentro de `intents.ts`, com **os mesmos três cortes já usados na UI** do resultado (`< 50`, `< 80`, `>= 80` em `PotentialDiagnostic.tsx`). Não se lê o `leitura` que o webhook devolve: ele vive em estado local do componente do diagnóstico e puxá-lo até aqui acoplaria dois módulos por um texto de uma linha.

Se `websiteScore` for `null` no momento do clique (caso de borda: o CTA aparece antes da auditoria completar), a intenção degrada para a variante sem número: "Fiz o diagnóstico do meu site e quero entender o que ele me custa."

### 4.3 `diagnostic-no-website` — CTA "não tenho site"

> **Lead:** "Ainda não tenho site. Quero saber o que preciso pra existir na era da IA."
>
> **Agente:** o `NO_WEBSITE_GREETING` que já está escrito e afiado em `AIChatAgent.tsx`.

O texto sai do componente e passa a morar em `intents.ts`, com o `AIChatAgent` importando de lá para a saudação inicial. Uma fonte só.

### 4.4 `front-pick` — card individual das Cinco Frentes

Um template, cinco usos. Recebe a `Front` escolhida.

> **Lead:** "Quero falar sobre a frente {2}: {Agente SDR 24/7}."
>
> **Agente:** "{promise da frente} Pra dimensionar isso na sua operação: o que sua empresa faz, e {probe da frente}?"

Isso exige um campo novo em `src/content/fronts.ts`:

```ts
/** A pergunta que o agente faz quando o lead escolhe esta frente. */
probe: string;
```

Valores propostos:

| Frente | `probe` |
|---|---|
| 1 — Presença digital pronta para IA | quando alguém procura o que você vende no ChatGPT, o que aparece hoje |
| 2 — Agente SDR 24/7 | quantos contatos chegam por semana, e em quanto tempo alguém responde |
| 3 — Automação de processos | qual rotina consome mais horas da equipe hoje |
| 4 — Sistema sob medida | qual controle da operação ainda vive numa planilha |
| 5 — Dados e decisão | qual número você olha antes de decidir a semana |

### 4.5 `fronts-agenda` — "Montar minha pauta"

> **Lead (com marcadas):** "Marquei {1} de 5. Faltam {Agente SDR, Automação, Sistema sob medida e Dados e decisão}. Quero montar minha pauta."
> **Lead (zero marcadas):** "Não cubro nenhuma das cinco frentes. Quero montar minha pauta."
> **Lead (cinco marcadas):** "Marquei as cinco frentes. Quero saber o que ainda dá pra melhorar."
>
> **Agente:** "Pauta anotada. Começo pela {primeira frente descoberta} — {promise dela}. Me diz o que sua empresa faz que eu ordeno as {4} por retorno e já abro a agenda."

A lista de frentes faltantes usa vírgulas e um "e" final. Com cinco marcadas, a variante do agente muda para a leitura de otimização, sem citar frente descoberta.

### 4.6 `credibility` — CTA da dobra de prova

> **Lead:** "Vi os casos. Quero saber o que dá pra fazer na minha empresa."
>
> **Agente:** "Operações diferentes, método igual. Me conta o que sua empresa faz e onde dói mais — eu volto com qual dos casos se parece com o seu."

## 5. Arquitetura

Três módulos novos, cada um com uma responsabilidade e testável isoladamente.

### 5.1 `src/content/intents.ts` — o conteúdo

Funções puras. Zero import de React, zero `fetch`.

```ts
export type IntentId =
  | 'hero-cold'
  | 'diagnostic-result'
  | 'diagnostic-no-website'
  | 'front-pick'
  | 'fronts-agenda'
  | 'credibility';

export interface IntentContext {
  ref: string | null;
  websiteScore: number | null;
  hasNoWebsite: boolean;
  frontsChecked: boolean[];
  /** Presente só em `front-pick`. */
  front?: Front;
}

export interface IntentDefinition {
  id: IntentId;
  /** O que o lead "diz". */
  userMessage: (ctx: IntentContext) => string;
  /** O que o agente responde, instantâneo. */
  agentReply: (ctx: IntentContext) => string;
}

export const INTENTS: Record<IntentId, IntentDefinition>;
```

Ser função pura é o que permite testar a copy estado por estado sem montar componente.

`vulnerabilityIndex` fica **fora** do `IntentContext`: nenhum template o consome. Ele continua indo ao n8n no bloco `context` do payload, lido direto do `useVulnerability()` dentro do `AIChatAgent`. Campo que ninguém lê não entra na interface.

### 5.2 `src/context/AgentIntentContext.tsx` — o transporte

O botão está na dobra 1, 3 ou 4; o agente está na dobra 6, sempre montado. Este contexto é o canal entre eles.

```ts
export interface AgentIntentRequest {
  id: IntentId;
  frontId?: FrontId;
  /** Incrementa a cada pedido. Ver abaixo. */
  nonce: number;
}

export interface AgentIntentState {
  pending: AgentIntentRequest | null;
  requestIntent: (id: IntentId, frontId?: FrontId) => void;
  consume: () => void;
}
```

`requestIntent` faz três coisas numa chamada: registra o analytics, arma o `pending` e rola até o agente. O Provider recebe do `LandingPage` a função de scroll (`onReachAgent`).

**Por que o `nonce`:** sem ele, pedir a mesma intenção duas vezes (com um desvio no meio) não dispararia o `useEffect` do agente — mesmo `id`, mesmo valor. O `nonce` é o que faz a reentrada da seção 3 funcionar de fato.

**Por que contexto separado e não estender o `VulnerabilityContext`:** aquele contexto responde "quão exposta está esta empresa". Este responde "de onde veio este clique". Misturar faria o provider do índice virar despachante de UI, e todo teste de vulnerabilidade passaria a arrastar estado de chat.

O `VulnerabilityProvider` continua sendo o de fora; o `AgentIntentProvider` fica dentro dele, porque nada no cálculo do índice depende de intenção.

### 5.3 `src/lib/agent-intent.ts` — a decisão de injetar

```ts
export interface InjectionGuardInput {
  stage: 'chat' | 'qualifying' | 'booking';
  isTyping: boolean;
  messages: { role: 'user' | 'assistant'; content: string }[];
  candidateUserMessage: string;
}

export function shouldInject(input: InjectionGuardInput): boolean;
```

Três travas, cada uma evitando uma falha concreta:

| Trava | Falha que evita |
|---|---|
| `stage !== 'chat'` | O lead está digitando telefone na qualificação ou já com a agenda do Cal.com aberta. Um balão novo caindo aí derruba a conversão que já estava ganha. |
| `isTyping` | O agente está no meio de uma resposta. Injetar produz duas falas do bot fora de ordem. |
| Última mensagem de `user` idêntica à candidata | Clique duplo no mesmo botão vira mensagem duplicada. |

Em todos os casos bloqueados o **scroll acontece mesmo assim** — o lead pediu para ir ao agente e vai. Só a injeção é suprimida.

### 5.4 Alterações no `AIChatAgent`

Um `useEffect` observando `pending`:

1. Monta o `IntentContext` a partir do `useVulnerability()` mais o `?ref` da URL.
2. Gera `userMessage` e `agentReply`.
3. Chama `shouldInject`. Se falso, `consume()` e sai.
4. Empurra **os dois balões de uma vez** no histórico.
5. Dispara o POST ao n8n em *fire-and-forget* — sem `setIsTyping`, sem renderizar o retorno.
6. `consume()`.

As sugestões de primeira mensagem somem sozinhas: `showSuggestions` já depende de `messages.length === 1`.

### 5.5 Alterações nos componentes de CTA

Os CTAs que apontam ao agente passam a chamar `requestIntent(...)` e deixam de precisar do prop `onWantStrategy` — o scroll agora mora no `requestIntent`. Isso remove a possibilidade de alguém adicionar um botão que rola até o chat sem carregar intenção.

Componente a componente:

| Componente | Prop de navegação | Destino |
|---|---|---|
| `SceneHero` | perde `onStopWastingMoney`, **mantém** `onUnderstandMore` | "Entenda melhor" vai ao capítulo 1, não ao agente |
| `PotentialDiagnostic` | perde `onWantStrategy` **e** `onNoWebsite` | ambos passam a apontar ao agente (decisão 3.2) |
| `FiveFronts` | perde `onWantStrategy` | "Montar minha pauta" e os cards vão ao agente |
| `CredibilitySection` | perde `onWantStrategy` | CTA vai ao agente |

O `LandingPage` deixa de precisar do `goToFronts`, já que nenhum CTA aponta mais para o capítulo das frentes. `goToCta` passa a ser o `onReachAgent` do Provider.

**O card da frente** ganha um gesto novo que não pode brigar com o toggle. O card inteiro continua sendo "já cubro esta". O CTA vira um alvo explícito no rodapé — "Falar sobre esta frente →", com `stopPropagation` — e **só aparece nos cards não marcados**. Pedir uma frente que você acabou de declarar coberta não é um estado que precise existir.

## 6. Contrato com o n8n

O payload ganha uma ação própria:

```json
{
  "sessionId": "…",
  "action": "intent",
  "intentId": "fronts-agenda",
  "chatInput": "Marquei 1 de 5. Faltam Agente SDR, Automação, Sistema sob medida e Dados e decisão. Quero montar minha pauta.",
  "agentReply": "Pauta anotada. Começo pela Agente SDR 24/7 — …",
  "context": {
    "vulnerabilityIndex": 88,
    "hasNoWebsite": false,
    "websiteScore": 63,
    "frontsCovered": 1,
    "frontsMissing": [2, 3, 4, 5]
  }
}
```

**Dependência externa a este repositório:** o workflow n8n precisa tratar `action: "intent"` gravando as duas falas na memória da sessão e devolvendo **200 sem gerar resposta do LLM**.

Se reusássemos `action: "sendMessage"`, o LLM produziria uma resposta que o lead nunca viu, e a segunda fala sairia incoerente — "como eu disse antes" referindo-se a algo invisível. O agente precisa **lembrar** do que foi dito, não responder duas vezes.

`agentReply` vai no payload justamente para que a memória contenha o que está na tela do lead.

**Falha do webhook não aparece na tela.** O `catch` é silencioso, porque a conversa já está funcionando sem ele. Essa é a razão de a resposta de abertura ser local.

## 7. Analytics

Evento novo `agent_intent`, com `{ intent_id, fronts_covered, website_score }`, disparado no `requestIntent`. Os `cta_click` existentes continuam intactos — juntos, permitem medir qual porta de entrada converte.

Somar `agent_intent` à lista de eventos documentada em `.env.example`.

## 8. Testes

`tests/intents.test.ts`:

- os seis templates renderizam sem `undefined`, `NaN` ou `null` vazando no texto, em todos os estados de borda: zero e cinco frentes, sem site, sem `ref`, `ref` desconhecido, `websiteScore` nulo;
- singular/plural e a lista de frentes faltantes com vírgulas e "e" final corretos;
- `front-pick` cobre as cinco frentes e cada uma injeta seu próprio `probe`;
- as três faixas de leitura do score batem com os cortes da UI.

`tests/agent-intent.test.ts`:

- as três travas do `shouldInject`, uma a uma, mais o caso que passa.

`tests/fronts.test.ts` (existente): estender para exigir `probe` não vazio nas cinco frentes.

## 9. Fora de escopo

- Deep link por URL (`?intent=…`) — próximo passo natural para tráfego pago.
- Gatilhos comportamentais (exit intent, tempo parado) — nenhuma evidência de que sejam necessários.
- Fazer o n8n responder a primeira mensagem — decidido contra, por latência e por dependência de disponibilidade.
