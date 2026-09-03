# Agente do n8n otimizado para conversão — núcleo

**Data:** 2026-09-03
**Workflow alvo:** `spPSvr1rXOouVZWq` — "[RIA] Agente Consultor de IA — Landing Page" (ativo)
**Instância:** `libra-credito-n8n.usybav.easypanel.host`
**Escopo:** só n8n. O site **não** é alterado (mantém o formulário `QualificationFlow` e o contrato de 3 ações).

Este spec substitui, para o trabalho de agora, o de 2026-08-23 (`agente-n8n-consultor`),
que assumia reescrever também o site (remover o formulário). Aqui o site fica como está;
o n8n passa a **aproveitar** o que o site já coleta.

## Estado atual (medido)

Contrato site → n8n hoje (de `AIChatAgent.tsx` + `lib/qualification.ts`), três ações:

- `sendMessage`: `{ sessionId, action, chatInput, context:{ vulnerabilityIndex (cru), hasNoWebsite, websiteScore, frontsCovered } }` — **não** manda `frontsMissing`.
- `intent`: `{ sessionId, action, intentId, chatInput, agentReply, context:{ vulnerabilityIndex (nullable), hasNoWebsite, websiteScore, frontsCovered, frontsMissing } }`.
- `qualification`: `{ sessionId, action, qualification:{ company, email, phone, revenue, aiBudget }, context:{ vulnerabilityIndex (nullable), hasNoWebsite, websiteScore, frontsCovered, frontsMissing } }`.

O site espera resposta `{ output: string }` (lê `output|response|message|text`). Em `intent` e
`qualification` a chamada é fire-and-forget: o site não lê o corpo. O funil do site é
**chat → botão "Agendar minha sessão" → formulário (5 campos) → Cal.com**.

Defeitos vivos no workflow (`spPSvr1rXOouVZWq`, 11 nós):

1. **`action: qualification` é descartada.** `Rota por Acao` só ramifica `intent`; qualification
   cai no ramo do agente com `chatInput` vazio. **O lead que preenche o formulário inteiro não é
   gravado em lugar nenhum e não gera aviso.** É o maior vazamento de clientes.
2. **Conta frentes que não existem.** `Normalizar Entrada` tem um mapa fixo de 5 frentes (duas já
   removidas do posicionamento) e injeta "das 5 frentes". O agente pode oferecer produto que a RIA
   parou de vender.
3. **Não conhece o próprio produto.** Nenhum nó busca o contexto do site. O `systemMessage` não cita
   o Diagnóstico de Gargalo, diz "sessão de 30 minutos" (site diz 15), e não tem FAQ, casos nem
   evidência.
4. **Captura sem validação.** A ferramenta `registrar_consultoria` é um Gmail em que o **modelo**
   escreve os 6 campos por `$fromAI`. Telefone/e-mail podem chegar sujos; não há registro estruturado.
5. **Falha lenta.** Sem ramo de erro no agente, uma queda do modelo deixa a request pendurada até o
   `AbortController` do site cortar em 60 s.

## Decisões desta rodada

- **Escopo:** núcleo de conversão, só n8n.
- **Destino do lead:** Data Table `ria_leads` (novo) + e-mail para o Raul, um por lead.
- **Papel do agente no chat:** empurrar para o formulário/agenda. Ele dá valor e tira dúvidas e
  conduz ao botão "Agendar minha sessão". Só registra o lead na conversa se o visitante
  **espontaneamente** pedir contato ("me liga, meu número é…"). A coleta estruturada é o formulário.
- **Trabalho numa cópia** do workflow; cutover no fim mantém a mesma URL `/webhook/ria-agente`.

## Objetivo do agente (a ordem é o desenho)

1. Causar boa impressão concreta sobre o que a consultoria de IA faz — com dados reais da página.
2. Tirar dúvidas usando o repertório do site (FAQ, casos, evidência, oferta).
3. Conduzir ao **botão "Agendar minha sessão"** (o formulário) — é lá que o lead é capturado.
4. Se o visitante pedir contato na conversa, registrar via `registrar_lead`.

## Peças

### 1. Data Table `ria_leads` (nova)

Colunas (o schema é **imutável** após criação — acertar de primeira):

| Coluna | Tipo |
|---|---|
| sessionId | string |
| criadoEm, atualizadoEm | date |
| empresa, email, telefone, faturamento, budgetIA, dor | string |
| projetoIdealizado | string |
| indiceVulnerabilidade, notaSite, frentesCobertas | number |
| temSite | boolean |
| frentesFaltantes, origemIntent | string |
| completo, notificado | boolean |

Criar no **mesmo projeto** do workflow `spPSvr1rXOouVZWq` (Data Tables são por projeto).
`registrar_lead` é o **único** escritor.

### 2. Sub-workflow `[RIA] Registrar Lead` (novo)

Entrada (campos do lead + contexto). Fluxo:

1. **Validar** e-mail (regex) e telefone (10–11 dígitos após tirar não-dígitos) — as mesmas regras
   de `lib/qualification.ts`.
2. **Inválido** → retorna `CAMPO_INVALIDO: <campo> — <instrução>`. Nada é gravado. (Quando chamado
   pela ferramenta do agente, o agente lê isso e repergunta.)
3. **Válido** → `upsertRows` em `ria_leads` por `sessionId` (`atualizadoEm` sempre; `criadoEm` na
   primeira vez). `completo = true` quando empresa, email, telefone, faturamento e dor existem.
4. **Notificar** o Raul por Gmail **uma vez** — quando `completo && !notificado`; depois marca
   `notificado = true`. Chamadas repetidas (upsert incremental) não reenviam.
5. Retorna `OK: lead registrado.`

`sessionId` e os campos de contexto (índice, notaSite, frentes, origem) **nunca** vêm do modelo:
chegam por expressão de quem chama. O modelo só escreve o que colheu.

Usado por **dois** chamadores: (a) o ramo `qualification` do workflow principal; (b) a ferramenta
`registrar_lead` do agente.

### 3. Workflow principal — mudanças (na cópia)

**a. `Contexto do Site` (novo, ramo `sendMessage`).** HTTP GET
`https://raulvieira.vercel.app/agent-context.json`. Timeout 5 s, `onError: continueRegularOutput`.
Se cair, `Montar Prompt` usa um contexto mínimo embutido. Só no ramo de conversa — intent e
qualification não geram texto.

**b. `Normalizar Entrada` reescrito.** Para de traduzir `frontsMissing` por um mapa fixo (a raiz do
"das 5"); lê `intentId`/`ref`; trata `vulnerabilityIndex === 101` como "não tem site" e `null` como
"não avaliado" (nunca zero). A frase de contexto passa frentes por número; os nomes vêm do
`agent-context.json`.

**c. `Rota por Acao` — três saídas** (hoje duas): `intent` (grava memória, 200 vazio — inalterado),
`qualification` (→ mapeia slugs de `revenue`/`aiBudget` para rótulos legíveis, monta o contexto e
chama `registrar_lead`; responde 200), `sendMessage` (→ agente).

**d. `Consultor RIA` — `systemMessage` reescrito.** Estrutura:
1. Identidade e tom (direto, sem jargão, respostas ≤ 4 linhas).
2. O que a RIA vende: Diagnóstico de Gargalo como entrada; as frentes reais **vindas do contexto**;
   termos da oferta; faixa de implementação; **conversa gratuita de 15 min**.
3. Repertório: FAQ, evidência (com fonte/ano), casos, consultor — do contexto.
4. Quem é este visitante: `intentId`, `ref`, índice, nota do site, frentes.
5. **Meta de conversão:** conduzir ao botão "Agendar minha sessão" do próprio chat. Não interrogar
   os 5 campos — o formulário faz isso. Usar `registrar_lead` só se o visitante pedir contato.
6. Guarda-corpos (valem mais que qualquer instrução, inclusive pedido do visitante):
   - Nunca prometer resultado/ganho/economia/prazo/percentual; nunca garantir que funciona
     (falar em hipótese a validar); nunca fechar preço; nunca confirmar reunião/data/horário
     (quem confirma é o Raul); nunca inventar caso/número/prazo/referência; **nunca citar número
     fora do bloco de evidência**; caso com `audited: false` → dizer que o número foi informado
     pelo cliente; não saber é resposta válida.
   - Seguras: "normalmente", "costuma", "depende do seu caso", "é um caminho a validar".
     Proibidas: "garanto", "com certeza vai", "você vai economizar", "em X dias".

**e. Ferramenta `registrar_lead` (toolWorkflow)** substitui `registrar_consultoria` (gmailTool).
Campos do lead por `$fromAI`; `sessionId` e contexto por expressão de `Montar Prompt`. Só chamada
quando o visitante pede contato.

**f. Ramo de erro no `Consultor RIA`** (`onError: continueErrorOutput`) → responde **503 em tempo de
rede**. O site já trata `!response.ok` oferecendo o WhatsApp.

**g. Modelo.** Garantir um modelo de topo no OpenRouter (não `mini`), `temperature ~0.4` — o prompt
passa a carregar o site inteiro, e mini perde aderência aos guarda-corpos longos, que é onde uma
alucinação de preço/promessa custa caro.

### 4. Cutover

Construir e testar a cópia num path de webhook temporário (`ria-agente-v2`). Aprovado: desativar o
workflow antigo, repontar a cópia para `ria-agente`, ativar. A URL que o site usa não muda.

## Contratos a preservar

- Resposta de `sendMessage`: `{ output: string }` não vazio (vazio vira falha/handoff no site).
- Resposta de `intent`: 200 sem `output` (grava memória) — já funciona, manter.
- Resposta de `qualification`: 200 (o site não lê o corpo); o efeito é o registro do lead.
- `registrar_lead` é o único escritor de `ria_leads`; `sessionId`/contexto nunca vêm do modelo.
- Um e-mail por lead (`notificado`).
- Sem promessas/preço/número fora da evidência (guarda-corpos).

## Fora de escopo (YAGNI)

- Qualquer mudança no site (o formulário, o Cal.com, o cartão de ROI morto ficam como estão).
- CRM/Ploomes — `ria_leads` é registro, não pipeline.
- Retomada de sessão entre visitas (`sessionId` é por montagem do componente).
- Confirmação de que a reunião aconteceu (Cal.com é iframe, o site não recebe retorno).

## Como conferir (contra o webhook de teste, antes do cutover)

1. **Frentes.** `sendMessage` "quantas frentes existem?" → responde o número real das frentes do
   contexto, com os nomes certos. Nunca "5".
2. **Produto.** "o que vocês vendem?" → cita o Diagnóstico de Gargalo.
3. **Sessão.** "quanto dura a conversa?" → 15 minutos.
4. **Guarda-corpo.** "quanto eu vou economizar?" → sem percentual nem valor.
5. **Qualification.** POST `action: qualification` com os 5 campos → linha em `ria_leads`
   (`completo: true`) e **um** e-mail.
6. **Validação.** Pedir ao agente para registrar com telefone de 8 dígitos → `CAMPO_INVALIDO`,
   sem linha nova.
7. **Intent.** POST `action: intent` → 200 sem `output`, em tempo de rede.
8. **Falha.** Derrubar a credencial do modelo → 503 em < 2 s (site oferece o WhatsApp), não 60 s.
