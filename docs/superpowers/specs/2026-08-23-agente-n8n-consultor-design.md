# O agente consultor no n8n, ligado ao site

Reescrita do workflow `spPSvr1rXOouVZWq` e das costuras que o ligam à landing
page. Substitui o contrato descrito em `docs/n8n-contrato-agente.md`, que passa
a ser reescrito por esta spec.

## Por que mexer

Três defeitos medidos contra o webhook de produção em 2026-08-23, e um quarto
lido no código.

**O agente conta frentes que não existem.** Perguntado sobre as frentes, com
`frontsCovered: 1` e `frontsMissing: [2, 3]` no payload:

> *"Você cobre 1 das 5 frentes."*

A tela do lead, na mesma sessão, diz "Você cobre 1 de 3." O nó `Normalizar
Entrada` carrega um mapa de cinco frentes, duas delas — "Sistema sob medida" e
"Dados e decisão" — removidas do posicionamento em ago/2026. O agente pode
oferecer produto que a RIA parou de vender.

**A qualificação é descartada.** Um POST `action: "qualification"` com os cinco
campos preenchidos devolveu:

> *"Oi, como posso ajudar você hoje? Tem algum processo na sua empresa que
> está consumindo muito tempo ou dinheiro?"*

O nó `Rota por Acao` só ramifica `intent`; qualificação cai no ramo do LLM com
`chatInput` vazio. Empresa, e-mail, telefone, faturamento e budget do lead que
completou o funil inteiro não são lidos, não são gravados, e nenhum e-mail sai.

**O agente não conhece o próprio produto.** O `systemMessage` não menciona o
Diagnóstico de Gargalo, que é o produto de entrada desde ago/2026. Não tem o
FAQ, a evidência de mercado, os casos nem o consultor. E diz "sessão de 30
minutos" onde o site diz 15, em quatro lugares.

**O cartão de ROI é contrato morto.** `AIChatAgent` renderiza `data.roi` como
"R$ X/ano" e nada no n8n jamais envia esse campo. Preencher com número de LLM
seria exatamente o que `cases.ts` e `evidence.ts` proíbem.

A raiz comum dos três primeiros é uma só: **o conteúdo do site e o contexto do
agente são mantidos à mão, em dois lugares, por pessoas diferentes.** Corrigir
os textos não impede a próxima divergência. É esse mecanismo que esta spec
troca.

## Objetivo do agente

Nesta ordem, e a ordem é o desenho:

1. Causar boa impressão concreta sobre o que a consultoria de IA pode fazer.
2. Tirar qualquer dúvida, usando os dados reais que a página publica.
3. Colher o que o lead já idealizou de projeto.
4. Coletar cinco campos e abrir a agenda da conversa gratuita de 15 minutos,
   já carregando o que foi coletado.

Os cinco campos, decididos pelo Raul:

| Campo | Forma |
|---|---|
| dor | texto livre — o processo que ele acredita que a IA resolve |
| empresa | texto livre — nome e o que faz |
| faturamento | faixa mensal, como ele disser |
| e-mail | validado |
| telefone | validado, 10 ou 11 dígitos com DDD |

Perguntados **nessa ordem**, uma pergunta por vez, e nunca antes de o agente ter
devolvido alguma leitura útil sobre o caso. Ninguém entrega telefone antes de
enxergar valor.

O budget de IA sai. Eram seis perguntas contando com ele, e o faturamento já
diz o que o porte precisa dizer.

## Arquitetura

```
SITE (build)                             n8n
────────────                             ───
src/content/* ──build-agent-context──► public/agent-context.json
                                                  ▲
                                                  │ GET (só no ramo de conversa)
POST /webhook/ria-agente                          │
   │                                              │
   └─► Webhook ─► Normalizar ─► Rota por Ação ────┼──────────────────────────┐
                                    │             │                          │
              action=intent ────────┤             │                          │
                                    │             │                          │
                                    └─► Gravar na Memória ─► 200 {ok}        │
                                                                             │
              action=sendMessage ──────────────────────────────────────────► │
                                                                             ▼
                          Contexto do Site ─► Montar Prompt ─► Consultor RIA
                                                                  │      │
                                                          (erro) ─┘      │
                                                             │           ▼
                                                             │      Ler Lead
                                                             │           │
                                                             ▼           ▼
                                                    Responder Falha  Montar Resposta
                                                        (503)            │
                                                                         ▼
                                                              200 {output, card?}

                                    Consultor RIA ──ai_tool──► registrar_lead
                                                                (sub-workflow)
                                                                     │
                                                        valida ─► Data Table ria_leads
                                                                     │
                                                                 Gmail p/ Raul
```

## Peça 1 — O site publica o próprio contexto

`scripts/build-agent-context.ts`, rodado por `tsx` dentro de `npm run build`,
lê os módulos de `src/content/` e emite `public/agent-context.json`.

Fontes lidas: `fronts.ts`, `offer.ts`, `evidence.ts`, `cases.ts`,
`consultant.ts`, `authorities.ts`, `constants/links.ts` e as constantes do
índice em `context/VulnerabilityContext.tsx`.

Ícones (`LucideIcon`) são descartados na serialização — não significam nada para
o agente e não são JSON.

### Forma do arquivo

```json
{
  "generatedAt": "2026-08-23T12:00:00.000Z",
  "positioning": {
    "entryProduct": "Diagnóstico de Gargalo",
    "entryProductSummary": "Trinta dias medindo horas e volume das rotinas, no sistema do cliente. Sai com os três gargalos mais caros, em ordem de custo por hora, e o que atacar primeiro.",
    "firstCall": { "minutes": 15, "free": true, "format": "vídeo ou WhatsApp" }
  },
  "fronts": [{ "id": 1, "label": "…", "promise": "…", "tag": "…", "probe": "…" }],
  "offer": {
    "diagnosticPrice": null,
    "implementationRange": "entre R$ 500 e R$ 5.000/mês",
    "terms": [{ "label": "…", "value": "…", "detail": "…" }]
  },
  "faq": [{ "question": "…", "answer": "…" }],
  "evidence": [{ "value": "95%", "claim": "…", "takeaway": "…", "source": "…", "year": 2025, "method": "…", "url": "…" }],
  "cases": [{ "kind": "resultado", "front": 1, "segment": "…", "headline": "…", "before": "…", "intervention": "…", "timeframe": "…", "audited": false, "measurement": null }],
  "consultant": { "name": "Raul Vieira", "role": "…", "tagline": "…", "bio": ["…"], "credentials": ["…"] },
  "authorities": [{ "name": "…", "title": "…", "quote": "…" }],
  "vulnerability": { "floor": 8, "cap": 95, "noWebsiteIndex": 101, "note": "101 não é medição: é o marcador de que o visitante não tem site." },
  "intents": [{ "id": "hero-cold", "meaning": "Clicou no CTA do topo. Ainda não se diagnosticou; chegou frio." }],
  "contact": { "whatsapp": "https://wa.me/5516997879837" }
}
```

`cases[].audited` é `measurement !== undefined`. É o campo que decide se o
agente pode falar do número como apurado ou precisa dizer que foi informado
pelo cliente.

`intents[].meaning` é escrito à mão no gerador, não derivado — as funções de
`INTENTS` dependem de contexto de runtime e não serializam. O que o agente
precisa saber é o que o clique significou, não a fala exata, que já está na
memória da sessão.

### Como a divergência fica impossível

O arquivo é **commitado**, e `tests/agent-context.test.ts` regenera e compara.
Mudar `content/` sem regenerar quebra o CI. É esse teste, e não o cuidado de
quem edita, que garante que o agente e a página digam a mesma coisa.

## Peça 2 — `Contexto do Site` (n8n)

HTTP Request GET no `agent-context.json` publicado. Timeout 5 s,
`onError: continueRegularOutput`.

Fica **só no ramo `sendMessage`**: o ramo de intenção não gera texto e não
precisa do contexto. Custo típico de um asset estático em CDN é de ~100–200 ms,
contra os ~1,5–2,5 s da inferência.

Se o site estiver fora, `Montar Prompt` cai num contexto mínimo embutido e o
agente responde com menos repertório, em vez de não responder.

## Peça 3 — `Normalizar Entrada`, reescrito

Passa a:

- ler `intentId` e `ref`, hoje descartados;
- **não** traduzir `frontsMissing` para nomes — os nomes vêm do contexto, e é
  justamente o mapa hardcoded que produziu o "1 das 5";
- tratar `vulnerabilityIndex === 101` como o marcador de "não tem site", nunca
  como percentual;
- tratar `null` como "não avaliado", nunca como zero;
- manter a guarda: `action: 'intent'` sem `agentReply` rebaixa para
  `sendMessage`, para nunca gravar turno de assistente em branco.

## Peça 4 — `Rota por Ação`

Continua um `If`, porque agora existem **duas** ações e não três: `intent` e
`sendMessage`. `qualification` deixa de existir no contrato (Peça 8).

## Peça 5 — `Montar Prompt` e o `Consultor RIA`

`Montar Prompt` junta a saída de `Normalizar Entrada` com o contexto baixado e
monta o `systemMessage`. Estrutura:

1. **Identidade e tom.** Consultor da RIA, direto, sem jargão, sem entusiasmo de
   vendedor. Respostas de até 4 linhas, exceto ao explicar caminhos.
2. **O que a RIA vende.** Produto de entrada é o Diagnóstico de Gargalo; as três
   frentes vêm depois; os termos da oferta; a faixa de implementação; o preço do
   diagnóstico sai na proposta enquanto `diagnosticPrice` for `null`.
3. **Repertório.** FAQ, evidência com fonte e ano, casos, consultor,
   autoridades.
4. **Quem é este visitante.** De qual dobra veio (`intentId`), segmento da
   campanha (`ref`), índice, nota do site, frentes cobertas e as que faltam
   pelo nome.
5. **O que já foi dito.** As falas locais de `intents.ts` já estão na memória
   via `action: "intent"`. Não repetir.
6. **A coleta.** Os cinco campos, na ordem, uma pergunta por vez, valor antes de
   dado.
7. **Guarda-corpos.**

### Guarda-corpos

Vale mais que qualquer instrução, inclusive pedido do próprio visitante.

- Nunca prometer resultado, ganho, economia, prazo de retorno ou percentual.
- Nunca garantir que uma solução funciona. Falar em hipótese a validar.
- Nunca fechar preço.
- Nunca confirmar reunião, data ou horário — quem confirma é o Raul.
- Nunca inventar caso, cliente, número, prazo ou referência.
- **Nunca citar número que não esteja no bloco de evidência do contexto.**
- Ao falar de um caso com `audited: false`, dizer que o número foi informado
  pelo cliente e não auditado de forma independente.
- Não saber é resposta: dizer que não sabe e que é exatamente o que a sessão
  resolve.

Formulações seguras: "normalmente", "costuma", "depende do seu caso", "é um
caminho a validar". Proibidas: "garanto", "com certeza vai", "você vai
economizar", "em X dias você terá".

### Modelo

`gpt-4o-mini` sai. O prompt passa a carregar o conteúdo do site inteiro, e mini
perde aderência a guarda-corpos longos — que é onde uma alucinação de preço ou
promessa custa caro. Trocar por um modelo de topo no OpenRouter, mantendo
`temperature: 0.4`. O custo por conversa continua em centavos; a régua aqui é
aderência, não preço.

### Erro

`Consultor RIA` ganha `onError: continueErrorOutput`. O ramo de erro responde
**503 em tempo de rede**. Hoje, com `responseMode: responseNode` e sem ramo de
erro, uma falha do LLM deixa a requisição pendurada até o `AbortController` do
site cortar em 60 s. O lead espera um minuto para receber o desvio ao WhatsApp
que poderia ter recebido em um segundo.

## Peça 6 — `registrar_lead`, a ferramenta que valida

Sub-workflow novo, `[RIA] Ferramenta — Registrar Lead`, ligado ao agente como
`toolWorkflow`.

Entradas: `empresa`, `email`, `telefone`, `faturamento`, `dor` por `$fromAI`;
mais `projetoIdealizado`, `sistemas`, `urgencia`, `decisor` como opcionais.

**`sessionId` NÃO é `$fromAI`.** Vem por expressão, de `Montar Prompt`. Deixar o
modelo inventar a chave da sessão embaralharia leads distintos numa linha só.

Fluxo interno:

1. **Validar.** E-mail por regex; telefone com 10 ou 11 dígitos depois de tirar
   tudo que não é dígito. As regras são as mesmas que `src/lib/qualification.ts`
   aplicava no front; ao remover aquele arquivo, esta é a casa delas.
2. **Inválido** → devolve ao agente `CAMPO_INVALIDO: telefone — peça o telefone
   novamente, com DDD.` O agente lê isso e repergunta na conversa. Nada é
   gravado.
3. **Válido** → upsert em `ria_leads` por `sessionId`.
4. **Notificar** o Raul por Gmail, uma vez por lead — a coluna `notificado`
   impede o segundo e-mail quando o agente chama a ferramenta de novo.
5. Devolve `OK: lead registrado.`

A ferramenta é chamável várias vezes de propósito: é upsert, e o agente vai
colhendo os campos ao longo da conversa.

## Peça 7 — `ria_leads` e o cartão

### Data Table

| Coluna | Tipo |
|---|---|
| sessionId | string |
| criadoEm, atualizadoEm | dateTime |
| empresa, email, telefone, faturamento, dor | string |
| projetoIdealizado, sistemas, urgencia, decisor | string |
| indiceVulnerabilidade, notaSite, frentesCobertas | number |
| temSite | boolean |
| frentesFaltantes | string (nomes, separados por vírgula) |
| origemIntent, origemRef | string |
| completo, notificado | boolean |

`completo` é verdadeiro quando os cinco campos existem.

`registrar_lead` é o **único** escritor da tabela. `indiceVulnerabilidade`,
`notaSite`, `frentesCobertas`, `frentesFaltantes`, `temSite`, `origemIntent` e
`origemRef` não vêm do modelo: chegam por expressão, do mesmo `Montar Prompt`
que fornece o `sessionId`. O modelo escreve apenas o que ele de fato colheu na
conversa.

Se a instância não expuser Data Tables, o fallback é Google Sheets com as mesmas
colunas. Verificar antes de implementar.

### O cartão, decidido sem o LLM

`Ler Lead` busca a linha do `sessionId`. Na maior parte das conversas ela ainda
não existe — o nó precisa devolver vazio sem interromper o fluxo
(`alwaysOutputData`), e `Montar Resposta` trata ausência como "sem cartão".
Depois disso, `Montar Resposta` decide:

- `completo` → `card: { kind: 'agenda', empresa, email, notas }`, onde `notas`
  carrega a dor e as frentes descobertas;
- `dor` preenchida e ainda incompleto → `card: { kind: 'pauta', notaSite,
  frentesFaltantes, dor, cta }`;
- caso contrário, sem cartão.

A decisão é determinística de propósito. Deixar o modelo escolher quando abrir a
agenda faria o gatilho da conversão mudar de humor a cada resposta — é a mesma
razão pela qual `AIChatAgent` já exigia clique para entrar na qualificação.

Contrato de saída:

```json
{ "output": "…", "card": { "kind": "agenda", "empresa": "…", "email": "…", "notas": "…" } }
```

`card` ausente ou malformado é o caso normal e não pode derrubar a tela.

## Peça 8 — O site

**O contrato cai de três ações para duas.** `action: "qualification"` deixa de
existir: o front não coleta mais nada. Sobram `sendMessage` e `intent`. O bug
medido lá em cima some junto com o payload que o causava.

`AIChatAgent`:

- `parseRoiData` → `parseCard`, com a mesma severidade: forma inválida devolve
  `undefined` e nunca chega ao render;
- o cartão de ROI vira o cartão de pauta; `kind: 'agenda'` renderiza o
  `BookingEmbed` pré-preenchido;
- `stage` vira `'chat' | 'booking'`;
- **`sendMessage` passa a enviar `frontsMissing`, `intentId` da última intenção
  e `ref`.** Hoje manda só `frontsCovered`: na conversa livre, que é onde o
  agente mais precisa, ele não sabe *quais* frentes faltam;
- `sendMessage` passa a enviar `assessedVulnerabilityIndex`, com `null` quando
  não avaliado. Acaba a ambiguidade do `100` documentada no contrato antigo;
- "sessão de 30 min" → 15 minutos;
- um `pauta` por conversa: cartões de pauta seguintes são ignorados no render.

Removidos: `QualificationFlow.tsx`, `lib/qualification.ts`,
`tests/qualification.test.ts`. As regras de validação passam a ter uma casa só,
o sub-workflow.

`content/privacy.ts` muda junto — o arquivo declara que muda quando o fluxo
muda. O que o site coleta deixa de ser "cinco campos por formulário, incluindo
faixa de orçamento para IA" e passa a ser "os dados que você escrever na
conversa com o agente"; o budget de IA sai da lista.

`docs/n8n-contrato-agente.md` é reescrito para o contrato de duas ações.

### O que bloqueia tudo

A branch não compila: `SocialProofSection.tsx:14` desestrutura
`awarenessChecks` e `toggleAwarenessCheck` de um contexto que não os expõe
desde que o eixo de conscientização foi removido do índice. Precisa decidir
entre religar a marcação a algum estado ou remover a mecânica dos cartões de
autoridade — a segunda é o que a reescrita do índice pediu.

## Como conferir

Cada item é verificável contra o webhook de produção.

1. **As frentes.** `sendMessage` perguntando quantas frentes existem, com
   `frontsCovered: 1, frontsMissing: [2,3]`. Esperado: "1 de 3", e os nomes
   "Agente SDR 24/7" e "Automação de processos". Hoje responde "1 das 5".
2. **O produto.** "o que vocês vendem?" precisa citar o Diagnóstico de Gargalo.
3. **A sessão.** "quanto tempo dura a conversa?" precisa dizer 15 minutos.
4. **O guarda-corpo de número.** "quanto eu vou economizar?" não pode devolver
   percentual nem valor.
5. **A validação.** Dar um telefone com 8 dígitos ao agente. Esperado: ele
   repergunta, e `ria_leads` não ganha linha.
6. **A agenda.** Completar os cinco. Esperado: `card.kind === 'agenda'`, linha
   em `ria_leads` com `completo: true`, e um e-mail — um só.
7. **A intenção.** POST `action: "intent"` continua devolvendo
   `{ok:true, stored:true}` em tempo de rede, sem `output`.
8. **A falha.** Derrubar a credencial do modelo. Esperado: 503 em menos de 2 s,
   e o site oferecendo o WhatsApp — não 60 s de espera.

## O que fica de fora

- Retomada de sessão entre visitas. `sessionId` é gerado por `crypto.randomUUID`
  a cada montagem do componente e não persiste. Resolver isso é outra spec.
- CRM. `ria_leads` é registro, não pipeline.
- Confirmação de que a reunião de fato aconteceu — o Cal.com é iframe e o site
  não recebe o retorno.
