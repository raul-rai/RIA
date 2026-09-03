# Agente do n8n otimizado para conversão — Implementation Plan

> **For agentic workers:** este plano é executado contra uma instância n8n de PRODUÇÃO via as ferramentas `mcp__n8n-mcp__*`. Não há testes unitários de código: a verificação de cada task é feita por chamada de webhook (curl) e leitura de execução/Data Table. Passos usam checkbox (`- [ ]`).

**Goal:** Fazer o agente do n8n aproveitar o que o site já coleta e converter mais — gravar o lead do formulário (hoje descartado) em `ria_leads` + e-mail, dar ao agente o contexto real do site, e falhar rápido.

**Architecture:** Trabalho numa **cópia** (`v2`) do workflow `spPSvr1rXOouVZWq`, com webhook temporário `ria-agente-v2`. Um sub-workflow `[RIA] Registrar Lead` centraliza validação + escrita em `ria_leads` + notificação, usado por dois chamadores (o ramo `qualification` e a ferramenta do agente). No fim, cutover: desativa o antigo, repointa a v2 para `ria-agente`, ativa. A URL do site não muda.

**Tech Stack:** n8n (instância `libra-credito-n8n.usybav.easypanel.host`), nós LangChain (agent, OpenRouter, memoryBufferWindow), Data Tables, Gmail. Ferramentas `mcp__n8n-mcp__*`. `curl` (Bash) para os testes de webhook.

## Global Constraints

- **Só n8n.** O site (`src/`) não é alterado. O contrato de 3 ações do site é fixo: `sendMessage` (context sem `frontsMissing`), `intent` (com `agentReply`, index nullable), `qualification` (`qualification:{company,email,phone,revenue,aiBudget}`, index nullable).
- **Resposta ao site:** `sendMessage` → `{ output: string }` não vazio; `intent` → 200 sem `output`; `qualification` → 200 (o site não lê o corpo).
- **`registrar_lead` é o único escritor de `ria_leads`.** `sessionId` e contexto (índice, notaSite, frentes, origem) **nunca** vêm do modelo — chegam por expressão de quem chama.
- **Um e-mail por lead** (coluna `notificado`). Destino: `raul.pedro.mv@gmail.com`.
- **Guarda-corpos do agente:** nunca prometer resultado/ganho/economia/prazo/percentual; nunca fechar preço; nunca confirmar reunião; nunca inventar caso/número; nunca citar número fora do bloco de evidência do contexto; conversa gratuita é de **15 min**.
- **Validação:** e-mail por regex; telefone com 10 ou 11 dígitos após remover não-dígitos (as regras de `src/lib/qualification.ts`).
- **Não tocar no workflow ativo `spPSvr1rXOouVZWq`** até o cutover (Task 5). Todo o trabalho é na cópia `v2`.
- **Schema de Data Table é imutável** após a criação — acertar as colunas de primeira.
- Webhook base para teste: `https://libra-credito-n8n.usybav.easypanel.host/webhook/ria-agente-v2`.

---

### Task 1: Data Table `ria_leads`

**Objetivo:** registro estruturado dos leads, no mesmo projeto do workflow.

**Interfaces:**
- Produz: Data Table `ria_leads` com `tableId` (anotar para as tasks seguintes).

- [ ] **Passo 1: Descobrir o projeto do workflow**

Rodar `mcp__n8n-mcp__n8n_get_workflow` (id `spPSvr1rXOouVZWq`, mode `minimal`) e, se o projectId não vier, usar o projeto padrão das Data Tables existentes (`JBqlTYJZ0GOvmZb5`, onde já vivem as 7 tabelas da instância). Anotar o `projectId` alvo.

- [ ] **Passo 2: Criar a tabela**

`mcp__n8n-mcp__n8n_manage_datatable` action `createTable`, name `ria_leads`, `projectId` do passo 1, colunas:

```
sessionId (string), criadoEm (date), atualizadoEm (date),
empresa (string), email (string), telefone (string), faturamento (string),
budgetIA (string), dor (string), projetoIdealizado (string),
indiceVulnerabilidade (number), notaSite (number), frentesCobertas (number),
temSite (boolean), frentesFaltantes (string), origemIntent (string),
completo (boolean), notificado (boolean)
```

- [ ] **Passo 3: Verificar**

`n8n_manage_datatable` action `listTables` → confirmar que `ria_leads` existe com as 18 colunas e os tipos certos. Anotar o `tableId`.

---

### Task 2: Sub-workflow `[RIA] Registrar Lead`

**Objetivo:** validar, gravar (upsert por sessionId) e notificar uma vez. Único escritor de `ria_leads`.

**Interfaces:**
- Consome: `ria_leads.tableId` (Task 1); credencial Gmail `7G6z0TY8xhbILqa8` (a mesma que a ferramenta atual usa).
- Produz: workflow `[RIA] Registrar Lead` com `workflowId` (anotar); contrato de entrada:
  `{ sessionId, empresa, email, telefone, faturamento, budgetIA?, dor, projetoIdealizado?, indiceVulnerabilidade?, notaSite?, temSite?, frentesCobertas?, frentesFaltantes?, origemIntent? }`.
  Saída: `{ resultado: 'OK: lead registrado.' }` ou `{ resultado: 'CAMPO_INVALIDO: <campo> — <instrução>' }`.

- [ ] **Passo 1: Criar o workflow com o nó de gatilho e o validador**

`mcp__n8n-mcp__n8n_create_workflow`. Nós:

1. `Execute Workflow Trigger` (`n8n-nodes-base.executeWorkflowTrigger`) — entrada por `passthrough`/campos definidos.
2. `Validar` (`n8n-nodes-base.code`), jsCode:

```js
// Validacao dos campos que sujam o dado. Mesmas regras de lib/qualification.ts.
const j = $input.first().json;
const soDigitos = (s) => String(s || '').replace(/\D/g, '');
const email = String(j.email || '').trim();
const tel = soDigitos(j.telefone);

const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const telOk = tel.length === 10 || tel.length === 11;

let erro = null;
if (!emailOk) erro = 'CAMPO_INVALIDO: email — peca o e-mail novamente.';
else if (!telOk) erro = 'CAMPO_INVALIDO: telefone — peca o telefone com DDD, 10 ou 11 digitos.';

// Decisao Raul 2026-09-03: contato valido + empresa = lead quente, avisa na hora.
// faturamento e dor sao bonus, nao travam a notificacao.
const completo = Boolean(String(j.empresa||'').trim() && emailOk && telOk);

return [{ json: { ...j, email, telefone: tel, valido: !erro, erro, completo } }];
```

- [ ] **Passo 2: Ramificar válido/inválido e ler a linha existente**

3. `If Valido` (`n8n-nodes-base.if`) — condição `{{ $json.valido }}` é true.
4. Ramo **false** → `Responder Invalido` (`n8n-nodes-base.set`) devolve `{ resultado: {{ $json.erro }} }`.
5. Ramo **true** → `Ler Existente` (`n8n-nodes-base.dataTable`, operation `getRows`, tableId da Task 1, filter `sessionId == {{ $json.sessionId }}`, `alwaysOutputData: true`) para saber se já existe e se `notificado`.

- [ ] **Passo 3: Upsert na tabela**

6. `Montar Linha` (`code`) — monta o objeto de colunas: `atualizadoEm = new Date().toISOString()`; `criadoEm` preserva o existente ou usa agora; `notificado` preserva o existente (o passo de notificação decide); números só quando presentes (senão deixa vazio). Guarda `jaNotificado` = a linha existente tinha `notificado === true`.
7. `Upsert Lead` (`n8n-nodes-base.dataTable`, operation `upsertRows`, tableId, filter por `sessionId`, data = a linha do passo 6).

- [ ] **Passo 4: Notificar uma vez**

8. `If Notificar` (`if`) — `{{ $json.completo }}` true **E** `jaNotificado` false.
9. Ramo true → `Email Raul` (`n8n-nodes-base.gmail`, credencial `7G6z0TY8xhbILqa8`, para `raul.pedro.mv@gmail.com`), assunto `[RIA] Novo lead — {{empresa}}`, corpo com empresa, dor, faturamento, budgetIA, telefone, email, índice/notaSite/frentesFaltantes/origem. Depois `Marcar Notificado` (`dataTable updateRows`, filter sessionId, set `notificado = true`).
10. Reconvergir em `Responder OK` (`set`) → `{ resultado: 'OK: lead registrado.' }`.

- [ ] **Passo 5: Validar o workflow e anotar o id**

`mcp__n8n-mcp__n8n_validate_workflow` (id do novo workflow) → sem erros. Anotar `workflowId`.

- [ ] **Passo 6: Verificar diretamente (sem o agente)**

`mcp__n8n-mcp__n8n_test_workflow` (ou execução manual) com input inválido (telefone `1199`) → saída `CAMPO_INVALIDO: telefone …`, e `n8n_manage_datatable getRows` mostra **nenhuma** linha nova. Depois input válido completo (sessionId `teste-t2-<rand>`) → `OK`, `getRows` mostra 1 linha `completo:true`, e chegou 1 e-mail. Reexecutar o mesmo sessionId → continua 1 linha, **sem** 2º e-mail (`notificado` segurou).

- [ ] **Passo 7: Commit do registro no ledger** (o workflow vive no n8n; registrar id no ledger de progresso).

---

### Task 3: Cópia `v2` + roteamento de entrada + ramo `qualification`

**Objetivo:** criar a cópia de trabalho e fazer o lead do formulário ser gravado. Fecha o maior vazamento.

**Interfaces:**
- Consome: `[RIA] Registrar Lead` (Task 2); workflow atual `spPSvr1rXOouVZWq` como base.
- Produz: workflow `[RIA] Agente v2 (conversao)` com webhook path `ria-agente-v2`, ativo; `workflowId` anotado.

- [ ] **Passo 1: Duplicar o workflow**

`n8n_get_workflow` (spPSvr1rXOouVZWq, mode `full`), criar via `n8n_create_workflow` como `[RIA] Agente v2 (conversao)`, trocar o `path` do Webhook para `ria-agente-v2`. Ativar.

- [ ] **Passo 2: Reescrever `Normalizar Entrada`**

Substituir o jsCode: remover o mapa fixo de 5 frentes e o texto "das 5"; ler `intentId`, `ref`; tratar `vulnerabilityIndex === 101` como "nao tem site" e `null` como "nao avaliado"; expor `action` cru (`intent`|`qualification`|`sendMessage`, com o rebaixamento de `intent` sem `agentReply` para `sendMessage`); montar `contextoDiagnostico` citando frentes por número (nomes virão do agent-context no prompt). Devolver também os campos de contexto crus (`indice`, `notaSite`, `temSite`, `frentesCobertas`, `frentesFaltantes`, `origemIntent`) para o ramo de qualification.

- [ ] **Passo 3: `Rota por Acao` com três saídas**

Trocar o `If` por um `Switch` (`n8n-nodes-base.switch`) em `{{ $json.action }}`: `intent` → (fluxo atual: Gravar na Memoria → Responder Sem Gerar); `qualification` → novo ramo (Passo 4); `sendMessage` (default) → Consultor RIA.

- [ ] **Passo 4: Ramo `qualification` → `registrar_lead`**

Nós novos:
1. `Mapear Qualification` (`code`) — lê `body.qualification` e `body.context`; mapeia os slugs `revenue`/`aiBudget` para rótulos legíveis (espelhando `REVENUE_OPTIONS`/`AI_BUDGET_OPTIONS` de `lib/qualification.ts`); monta o input do sub-workflow (`empresa=company`, `email`, `telefone=phone`, `faturamento=<label revenue>`, `budgetIA=<label aiBudget>`, `dor=''` se ausente, `sessionId`, e o contexto por expressão).
2. `Registrar (form)` (`n8n-nodes-base.executeWorkflow`, workflowId da Task 2) passando o input do nó anterior.
3. `Responder Qualification` (`respondToWebhook`) → 200 `{ ok: true }`.

Mapa de rótulos a embutir no `code`:
```js
const REVENUE = {'ate-100k':'Até R$ 100 mil/mês','100k-500k':'R$ 100 mil a R$ 500 mil/mês','500k-1m':'R$ 500 mil a R$ 1 milhão/mês','acima-1m':'Acima de R$ 1 milhão/mês'};
const AIBUD = {'nao-defini':'Ainda não defini','ate-1k':'Até R$ 1.000/mês','1k-5k':'R$ 1.000 a R$ 5.000/mês','acima-5k':'Acima de R$ 5.000/mês'};
```

- [ ] **Passo 5: Validar o workflow**

`n8n_validate_workflow` (v2) → sem erros de conexão/nó.

- [ ] **Passo 6: Verificar o ramo qualification (curl)**

```bash
curl -s -X POST https://libra-credito-n8n.usybav.easypanel.host/webhook/ria-agente-v2 \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"teste-t3-001","action":"qualification","qualification":{"company":"Metalurgica Teste","email":"teste@exemplo.com.br","phone":"(16) 99999-8888","revenue":"100k-500k","aiBudget":"1k-5k"},"context":{"vulnerabilityIndex":88,"hasNoWebsite":false,"websiteScore":63,"frontsCovered":1,"frontsMissing":[2,3]}}'
```
Esperado: 200. `n8n_manage_datatable getRows` (filter sessionId `teste-t3-001`) → 1 linha, `faturamento`="R$ 100 mil a R$ 500 mil/mês", `completo:true` (contato válido + empresa) — e **um** e-mail para o Raul (decisão 2026-09-03: form preenchido = lead quente, avisa na hora).

- [ ] **Passo 7: Intent continua intacto**

```bash
curl -s -X POST .../webhook/ria-agente-v2 -H 'Content-Type: application/json' \
 -d '{"sessionId":"teste-t3-int","action":"intent","intentId":"fronts-agenda","chatInput":"...","agentReply":"Pauta anotada.","context":{"vulnerabilityIndex":null,"hasNoWebsite":false,"websiteScore":null,"frontsCovered":1,"frontsMissing":[2,3]}}'
```
Esperado: 200 sem `output`, em tempo de rede.

---

### Task 4: Ramo de conversa — contexto do site, prompt, ferramenta, erro

**Objetivo:** o agente conhece o produto real, respeita os guarda-corpos, empurra pro agendar, e falha rápido.

**Interfaces:**
- Consome: v2 (Task 3); `agent-context.json` publicado; `[RIA] Registrar Lead` (Task 2).

- [ ] **Passo 1: `Contexto do Site` (HTTP GET) no ramo sendMessage**

Nó `n8n-nodes-base.httpRequest`, GET `https://raulvieira.vercel.app/agent-context.json`, timeout 5000, `onError: continueRegularOutput`. Entra entre a saída `sendMessage` do Switch e o `Consultor RIA` (via um `Montar Prompt` `code` que junta contexto + normalização; fallback mínimo embutido se o GET falhar).

- [ ] **Passo 2: Reescrever o `systemMessage` do `Consultor RIA`**

Novo `systemMessage` (define), com as seções do spec (§Peça 3d): identidade/tom; o que a RIA vende (Diagnóstico de Gargalo; frentes **do contexto**; oferta; implementação; **15 min**); repertório (FAQ/evidência/casos/consultor do contexto, injetados por `{{ $json.contextoSite }}`); quem é o visitante (`intentId`, `ref`, índice, nota, frentes); **meta de conversão** = conduzir ao botão "Agendar minha sessão" (não interrogar os 5 campos — o formulário faz isso; usar `registrar_lead` só se o visitante pedir contato); guarda-corpos (lista do spec, com formulações seguras/proibidas). O texto do visitante segue `={{ $json.chatInput }}`.

- [ ] **Passo 3: Trocar a ferramenta para `registrar_lead`**

Remover `registrar_consultoria` (gmailTool). Adicionar `registrar_lead` (`@n8n/n8n-nodes-langchain.toolWorkflowV2` ou `toolWorkflow`) apontando para o workflow da Task 2; campos do lead por `$fromAI`; `sessionId` e contexto por **expressão** (de `Montar Prompt`), nunca `$fromAI`. `toolDescription`: registrar o lead **apenas quando o visitante pedir para ser contatado** e tiver ao menos empresa, dor, telefone e e-mail.

- [ ] **Passo 4: Ramo de erro (503)**

`Consultor RIA` com `onError: continueErrorOutput`. Saída de erro → `Responder Falha` (`respondToWebhook`, responseCode 503, corpo `{ output: '' }`). O site já trata `!ok` com o handoff pro WhatsApp.

- [ ] **Passo 5: Modelo**

Ler o nó `OpenRouter Chat Model` (`n8n_get_workflow` filtered). Se estiver em um modelo fraco (mini), trocar por um de topo (ex.: um Claude/GPT de topo disponível no OpenRouter), `temperature: 0.4`. Se já for de topo, deixar.

- [ ] **Passo 6: Validar e verificar (curl) — as checagens de conversa**

`n8n_validate_workflow` (v2) sem erros. Depois:
```bash
# fronts reais (nao "5")
curl ... -d '{"sessionId":"t4-a","action":"sendMessage","chatInput":"quantas frentes de trabalho vocês têm e quais são?","context":{"vulnerabilityIndex":100,"hasNoWebsite":false,"websiteScore":null,"frontsCovered":0}}'
# produto
curl ... -d '{"sessionId":"t4-b","action":"sendMessage","chatInput":"o que exatamente vocês vendem?","context":{...}}'
# sessao 15 min
curl ... -d '{"sessionId":"t4-c","action":"sendMessage","chatInput":"quanto tempo dura a conversa gratuita?","context":{...}}'
# guarda-corpo
curl ... -d '{"sessionId":"t4-d","action":"sendMessage","chatInput":"quanto eu vou economizar com isso?","context":{...}}'
```
Esperado: (a) número/nomes reais das frentes do contexto, nunca "5"; (b) cita "Diagnóstico de Gargalo"; (c) "15 minutos"; (d) sem percentual/valor prometido. Cada resposta é `{ output: <texto não vazio> }`.

- [ ] **Passo 7: Falha rápida (503)**

Verificar o ramo de erro: com a credencial do modelo temporariamente inválida (ou simulando erro), o POST `sendMessage` volta **503 em < 2 s**. Reverter a credencial depois. Se não for seguro mexer na credencial, validar o caminho de erro por execução isolada e registrar como verificação parcial.

---

### Task 5: Cutover (gated — só com "pode virar" do Raul)

**Objetivo:** a v2 assume a URL de produção sem o site mudar.

- [ ] **Passo 1: Reconfirmar com o Raul** que os testes da v2 passaram e ele autoriza o cutover.

- [ ] **Passo 2: Desativar o antigo**

`mcp__n8n-mcp__n8n_update_partial_workflow` (ou update) em `spPSvr1rXOouVZWq` → `active: false`. (Não apagar — é o rollback.)

- [ ] **Passo 3: Repointar a v2**

Na v2, trocar o `path` do Webhook de `ria-agente-v2` para `ria-agente`. Salvar e garantir `active: true`.

- [ ] **Passo 4: Verificar em produção**

`curl` no `/webhook/ria-agente` (o mesmo que o site usa) com um `sendMessage` simples → `{ output }` não vazio. Um `qualification` de fumaça (sessionId `cutover-smoke`) → linha em `ria_leads`. Remover a linha de fumaça depois (`deleteRows`).

- [ ] **Passo 5: Rollback documentado**

Registrar no ledger: para reverter, reativar `spPSvr1rXOouVZWq` e desativar/repointar a v2. Um comando de cada lado.

---

## Self-Review

**Cobertura do spec:**
- `ria_leads` Data Table → Task 1. ✔
- Sub-workflow validação+upsert+notificação única → Task 2. ✔
- `action: qualification` processado → Task 3 (ramo + registrar_lead). ✔
- Contexto do site carregado → Task 4 Passo 1. ✔
- Prompt reescrito (produto, 15 min, frentes reais, guarda-corpos, empurrar pro form) → Task 4 Passo 2. ✔
- Ferramenta validada (registrar_lead) → Task 4 Passo 3. ✔
- Falha 503 → Task 4 Passo 4. ✔
- Modelo de topo → Task 4 Passo 5. ✔
- Cutover mantendo URL → Task 5. ✔
- As 8 checagens do spec → distribuídas em Task 2 P6, Task 3 P6/P7, Task 4 P6/P7. ✔

**Decisão resolvida (2026-09-03):** `completo = empresa + e-mail válido + telefone válido`.
Formulário preenchido com contato válido é lead quente e dispara o e-mail na hora; faturamento e dor
são bônus. Aplicado no validador da Task 2 e na expectativa da Task 3 Passo 6.

**Placeholders:** nenhum "TBD"; cada passo tem operação n8n concreta ou curl. Os textos longos
(systemMessage completo) são montados na execução a partir do spec §Peça 3d — o plano fixa a
estrutura e as regras exatas, não um blob final, porque parte do conteúdo vem do `agent-context.json`
em runtime.

**Consistência de tipos/nomes:** `registrar_lead` (Task 2) é consumido por Task 3 P4 e Task 4 P3 com
o mesmo contrato de entrada; `ria_leads.tableId` (Task 1) usado em Task 2 e nas verificações;
webhook `ria-agente-v2` em Tasks 3–4, repontado para `ria-agente` na Task 5.
