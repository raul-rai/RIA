# Contrato do webhook do agente

`VITE_N8N_CHAT_WEBHOOK_URL` recebe **três** formas de payload. As três chegam
com o mesmo `sessionId`, que identifica a conversa do começo ao fim.

## 1. `action: "sendMessage"` — o lead digitou

```json
{
  "sessionId": "…",
  "action": "sendMessage",
  "chatInput": "Somos uma metalúrgica com 40 funcionários.",
  "context": {
    "hasNoWebsite": false,
    "googleScore": 63,
    "agenticScore": 41,
    "path": "otimizar"
  }
}
```

> **Mudança de contrato — set/2026.** Saíram `vulnerabilityIndex`,
> `websiteScore`, `frontsCovered` e `frontsMissing`. Entraram `googleScore`,
> `agenticScore` e `path` (`"novo"` | `"otimizar"` | `null`). As duas notas são
> independentes e **não devem ser somadas nem promediadas** em nenhum ponto do
> workflow: são instrumentos diferentes (Google Lighthouse e Is Agentic).
> Qualquer template de prompt que ainda referencie `context.vulnerabilityIndex`,
> `context.websiteScore` ou `context.frontsCovered` passa a receber
> `undefined` — o workflow no n8n precisa ser atualizado no mesmo cutover.

O workflow responde normalmente. A resposta é lida de `output`, `response`,
`message` ou `text` — na raiz do objeto ou no primeiro item de um array.
Resposta vazia conta como falha e o lead recebe o desvio para o WhatsApp.

O mesmo objeto `context` acompanha os três payloads (`sendMessage`, `intent` e
`qualification`), com estes campos:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `hasNoWebsite` | `boolean` | O visitante declarou que ainda não tem site. Quando `true`, as duas notas vêm `null`. |
| `googleScore` | `number \| null` | Nota 0–100 do Google Lighthouse. |
| `agenticScore` | `number \| null` | Nota 0–100 de prontidão para agentes de IA (Is Agentic). |
| `path` | `"novo" \| "otimizar" \| null` | O caminho que o visitante escolheu no cartão — ou, se ele não escolheu, o que a nota do Google sugere (`resolvePath` em `src/lib/paths.ts`). `null` = o visitante não escolheu **e** a nota do Google é `null`: a sugestão sai só dela. Por isso `path: null` **pode chegar junto de um `agenticScore` medido** (o PageSpeed falhou e o Is Agentic respondeu): `null` aqui não quer dizer "nada foi medido", quer dizer "não há caminho a sugerir". Quem declarou não ter site (`hasNoWebsite: true`) recebe `"novo"` mesmo sem nota nenhuma. |

**`null` é sempre "não medido", nunca zero.** Uma medição pode falhar sozinha
(cota do PageSpeed, site que bloqueia o scanner), então é normal chegar
`googleScore: null` com `agenticScore: 55`, ou o contrário. Trate cada nota
isoladamente e nunca converta `null` em `0`: zero seria lido como site
reprovado, e não houve reprovação nenhuma. Não existe nota geral — nenhum campo
combina as duas.

## 2. `action: "intent"` — o lead clicou num CTA

```json
{
  "sessionId": "…",
  "action": "intent",
  "intentId": "path-pick",
  "chatInput": "Quero falar sobre o caminho Otimização.",
  "agentReply": "O site que já existe passa a carregar rápido, … Pra dimensionar isso: o que sua empresa faz, e qual desses pontos do laudo mais te preocupa?",
  "context": {
    "hasNoWebsite": false,
    "googleScore": 63,
    "agenticScore": 41,
    "path": "otimizar"
  }
}
```

**O workflow precisa tratar este caso gravando `chatInput` e `agentReply` na
memória da sessão e devolvendo 200 sem gerar resposta do LLM.**

As duas falas já estão na tela do lead — o site as escreveu localmente, para
que o primeiro contato não dependa de latência nem de o webhook estar de pé. O
que o n8n precisa é **lembrar** do que foi dito, para que a segunda fala da
conversa faça sentido. Se este caso for tratado como `sendMessage`, o LLM
produz uma resposta que o lead nunca viu, e a fala seguinte sai se referindo a
algo invisível.

`intentId` é um de: `report-result`, `sem-site`, `path-pick`,
`credibility`. Ele diz de qual dobra o lead veio e serve para o prompt do
agente ajustar o tom. (Mudança de set/2026: `diagnostic-result`,
`diagnostic-no-website`, `front-pick`, `fronts-agenda` e `hero-cold` deixaram de
existir; a última perdeu o botão que a disparava quando o hero virou o
formulário de medição.)

Em `path-pick`, `context.path` é o caminho que o lead acabou de clicar. Em
`report-result`, as falas do agente comentam as duas notas, cada uma na voz do
seu instrumento.

## 3. `action: "qualification"` — os cinco campos

Os cinco campos de `qualification` estão inalterados (ver
`src/lib/qualification.ts`). O `context` que os acompanha mudou junto com os
outros dois payloads:

```json
{
  "sessionId": "…",
  "action": "qualification",
  "qualification": {
    "company": "Nexa Interiores",
    "email": "contato@nexa.com.br",
    "phone": "16997879837",
    "revenue": "100k-500k",
    "aiBudget": "1k-5k"
  },
  "context": {
    "hasNoWebsite": false,
    "googleScore": 63,
    "agenticScore": 41,
    "path": "otimizar"
  }
}
```

## O que mudou no `agent-context.json` — set/2026

O contexto que o workflow baixa a cada conversa (`GET /agent-context.json`) mudou junto com o posicionamento. Um prompt que ainda leia os campos antigos recebe `undefined` (ou quebra, se acessar uma propriedade do que não existe):

| Saiu | Entrou |
| --- | --- |
| `fronts` (as três frentes) | `paths` — `novo` e `otimizar`, com os mesmos campos (`label`, `promise`, `tag`, `probe`); `id` agora é string |
| `authorities` e `authoritiesDisclaimer` (a parede de vídeos) | — |
| `vulnerability` (o índice de 8 a 100 e o marcador 101) | `measurement` — os dois instrumentos (Google Lighthouse e Is Agentic) e a nota de que as duas notas nunca são combinadas |
| `offer.diagnosticPrice` | `offer.price` (continua `null`: o valor sai na proposta) |
| `positioning.entryProduct` = "Diagnóstico de Gargalo" | `positioning.entryProduct` = a medição do site em duas notas |
| `intents`: `hero-cold`, `diagnostic-result`, `diagnostic-no-website`, `front-pick`, `fronts-agenda` | `intents`: `report-result`, `sem-site`, `path-pick`, `credibility` |

As ferramentas MCP (`/api/mcp`) acompanharam: `get_fronts` virou `get_paths`.

### O que entrou depois: a prova histórica vem marcada

O contexto é lido como descrição **atual** da empresa, e parte da prova (dois estudos, dois casos, a bio) sustentava a oferta anterior — agentes de vendas e automação. Nada foi removido: a página continua mostrando os três casos e as quatro fontes, e o agente precisa conhecer o mesmo conjunto que o lead vê. O que mudou é que cada item diz o que sustenta. **Um prompt que cite `evidence` e `cases` sem ler estes campos volta a vender o produto antigo.**

| Campo | Significado |
| --- | --- |
| `evidence[].offerRelation`, `cases[].offerRelation` | `"oferta-atual"`, `"parcial"` ou `"historico"`. Só `"oferta-atual"` pode ser usado como razão para contratar a RIA. |
| `evidence[].note`, `cases[].note` | O que o item não sustenta. `null` só em `"oferta-atual"`. |
| `evidence[].takeaway` | Agora `string \| null`. É `null` nas evidências históricas (MIT e HBR): a leitura delas era a ponte para a oferta anterior. O número, a fonte, o ano, o método e o link seguem íntegros. |
| `positioning.currentOffer` | O que se vende hoje, em uma frase. |
| `positioning.notOfferedToday` | O que aparece na prova mas não se vende (agente SDR; automação de atendimento e de processos). |
| `positioning.historicalProof` | Como ler `offerRelation`. |
| `consultant.methodNote` | A bio descreve o método de trabalho, não um produto à venda. |

## Falhas

Falha em `sendMessage` vira desvio visível para o WhatsApp. Falha em `intent`
é silenciosa por decisão de projeto: a conversa já está na tela e funcionando,
e o registro não pode custar a conversa ao lead.

---

## Verificação em produção — 2026-08-19

Conferência feita contra o webhook real, com `sessionId` sintético
`teste-claude-1787186808`. **O contrato da seção 2 não está implementado.**

### O que foi medido

Enviado o payload de intenção exatamente como o site o envia:

```json
{ "action": "intent", "intentId": "fronts-agenda",
  "chatInput": "Marquei 4 de 5. Falta Dados e decisão. Quero montar minha pauta.",
  "agentReply": "Pauta anotada. Começo pela Dados e decisão." }
```

Resposta recebida — HTTP 200 em 3,56 s:

```json
{ "output": "Entendi que você está buscando montar uma pauta e precisa de dados
  e decisões. Para isso, me conta: qual é o processo específico na sua empresa
  que está consumindo tempo ou dinheiro?" }
```

O workflow tratou a intenção como se fosse `sendMessage`: gerou resposta de
LLM em vez de apenas gravar as duas falas e devolver 200 vazio.

### Por que isso importa

O site **descarta** essa resposta — `postIntent` é fire-and-forget e não
renderiza o retorno. Então o lead não vê mensagem duplicada na tela. O dano é
outro, e é mais silencioso:

1. **As duas conversas divergem.** O lead leu na tela `"Pauta anotada. Começo
   pela Dados e decisão…"`. A memória do n8n guardou `"Entendi que você está
   buscando montar uma pauta…"`. A partir daí, o agente lembra de uma conversa
   que nunca aconteceu.
2. **Uma chamada de LLM desperdiçada por clique.** Custo e 3,5 s de
   processamento para produzir texto que ninguém lê. Com seis CTAs e reentrada
   liberada, um único visitante pode disparar várias.
3. **A pergunta se repete.** Segunda mensagem na mesma sessão (`"Somos uma
   transportadora com 40 caminhões."`) devolveu *"qual é a dor específica que
   você enfrenta nesse processo?"* — praticamente a mesma pergunta do turno
   fantasma, porque para o modelo ela ficou sem resposta.

### A correção, no workflow

No nó imediatamente após o Webhook, ramificar por `{{ $json.action }}`:

- **`intent`** → gravar `chatInput` como turno do **usuário** e `agentReply`
  como turno do **assistente** na memória da sessão (`sessionId`), e responder
  200 com corpo vazio. **Não** passar pelo nó do modelo.
- **`sendMessage`** → fluxo atual, inalterado.
- **`qualification`** → fluxo atual, inalterado.

O ponto que não pode ser perdido: o que entra na memória é o `agentReply` que
veio no payload, porque é esse texto que está na tela do lead. Deixar o modelo
escrever a fala do assistente aqui é exatamente o que produz a divergência.

### Como conferir depois de corrigir

Repetir o POST de intenção acima. O esperado é HTTP 200 com corpo vazio (ou
`{}`), em tempo de rede — sem os ~3,5 s de inferência. Se vier `output`
preenchido, a ramificação não pegou.
