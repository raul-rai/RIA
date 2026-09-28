# Foco em sites — o scanner vira o produto, o laudo ganha duas notas

**Data:** 2026-09-28
**Escopo:** posicionamento da landing inteira. Reescreve a ordem dos capítulos,
substitui a dobra das frentes, remove a parede de vídeos e acrescenta um segundo
instrumento de medição (Is Agentic) ao lado do Lighthouse.
**Fora de escopo:** o agente n8n (contrato e prompt), a agenda, a política de
privacidade, o rodapé de fontes, o servidor MCP, o prerender e o llms.txt. Todos
continuam funcionando como hoje; alguns recebem ajustes de texto, nenhum muda de
arquitetura.

## Origem

Diagnóstico do usuário: *"o projeto está muito disperso; vamos focar na criação /
otimização de sites apenas e manter o final com o agente"*. A dispersão é real e
mensurável no código de hoje:

- o produto de entrada anunciado (`content/offer.ts`) é o **Diagnóstico de
  Gargalo** — trinta dias medindo rotinas internas, que não tem relação com site;
- das seis dobras, **uma** fala de site (a do diagnóstico);
- a dobra das frentes oferece três coisas diferentes (site, SDR, automação),
  ou seja, um cardápio;
- a primeira dobra e a parede de vídeos vendem "IA importa", uma tese de mercado
  que serve a qualquer oferta e a nenhuma em particular.

Somado: o visitante atravessa dois blocos de prova de terceiros e um cardápio
antes de encontrar a única coisa que a página sabe fazer melhor que a
concorrência, que é medir o site dele na hora.

Decisões tomadas em brainstorming, ponto a ponto:

1. **Produto de entrada:** o scanner do site. Diagnóstico grátis e instantâneo,
   conversa de 15 min, e o produto pago é a criação/otimização.
2. **Is Agentic:** entra como **segunda nota, lado a lado** com a do Lighthouse.
   Sem média entre elas.
3. **Dobra das frentes:** vira **Criar ou otimizar**, dois cartões.
4. **Abertura:** o scanner vira o hero. A parede de vídeos sai.

## Princípio

Uma página, um verbo: **medir o site do visitante e consertá-lo**. Tudo que não
serve a esse verbo sai, mesmo bonito, mesmo caro de ter construído.

E uma regra que já rege este repositório e continua valendo aqui: **nenhum número
exibido é fabricado**. Os dois laudos publicam a fonte, o instrumento e a data;
o que não foi medido diz "não medido", nunca zero.

## Estrutura nova da página

| # | Capítulo | O que é |
|---|----------|---------|
| 0 | **Hero-scanner** | Manchete sobre site + campo de URL na primeira dobra |
| 1 | **O laudo** | Duas notas lado a lado, cada uma com sua fonte |
| 2 | **Criar ou otimizar** | Dois cartões; a escolha vira intenção do agente |
| 3 | **Prova e quem executa** | Cases + bio, com o case de site em destaque |
| 4 | **O agente e a agenda** | Inalterado |

`CTA_CHAPTER` passa de 5 para 4. `CHAPTERS` em `pages/LandingPage.tsx` perde o
item "Vozes do mercado" e renomeia os demais.

### Capítulo 0 — Hero-scanner

A primeira dobra deixa de fazer uma pergunta retórica sobre o futuro e passa a
oferecer uma medição. O campo de URL que hoje vive dentro de
`PotentialDiagnostic` sobe para cá.

- **Manchete (default):** "Quando alguém pergunta ao ChatGPT o que você vende, o
  seu site aparece?"
- **Campo:** URL, com o mesmo saneamento que o componente atual já faz.
- **CTA primário:** *Medir meu site* — dispara as duas medições e rola para o
  capítulo 1.
- **CTA secundário:** *Ainda não tenho site* — caminho já existente
  (`hasNoWebsite`), que leva direto ao agente com a intenção
  `diagnostic-no-website`.

As manchetes por segmento de campanha (`?ref=industria|servicos|varejo` em
`HEADLINES`) continuam existindo e são reescritas para falar de site. A mecânica
de entrada palavra a palavra (`HeroLine`, `WORD_STEP_S`, `.hero-word`) fica como
está: ela existe por causa do LCP e o motivo não mudou.

**Onde a medição roda.** O disparo acontece no hero; o resultado aparece no
capítulo 1. Enquanto mede, o capítulo 1 mostra o estado de progresso — as duas
notas chegam em tempos diferentes (Lighthouse ~10s, Is Agentic ~19s) e cada bloco
resolve sozinho, sem esperar o outro.

### Capítulo 1 — O laudo, duas notas

Duas colunas, cada uma um instrumento independente. **Não existe média entre
elas** e a tela não deve sugerir que exista: são coisas diferentes medidas por
gente diferente.

**Coluna A — Nota Google.** Fonte: Google Lighthouse via PageSpeed Insights.
Quatro dimensões, que são as quatro que o Lighthouse realmente devolve:
Performance, Acessibilidade, Boas práticas, SEO.

A quinta dimensão atual ("Navegação agêntica", três auditorias do Lighthouse) é
**removida**. O comentário no topo de `lib/agentic-readiness.ts` documenta que ela
nasceu para consertar um defeito pior (uma função degrau da nota de SEO
apresentada como instrumento independente). A correção foi honesta, mas as três
auditorias que sobraram — `is-crawlable`, `crawlable-anchors`, `robots-txt` —
medem se um crawler *chega* à página, não se um agente *consegue usá-la*. É
exatamente o que o segundo instrumento mede de verdade, e melhor.

**Coluna B — Nota agêntica.** Fonte: Is Agentic (Vercel Labs). Nota 0–100,
`score_label`, e os apontamentos separados nos dois níveis que a API devolve:
`essential` e `recommended`. Cada apontamento exibe `name`, `result`
(`failed` / `partial`) e o campo `details`, que é a evidência — é o `details` que
transforma o bloco de "nota" em "laudo", porque diz *o que* foi encontrado, não
só que algo falhou.

O bloco linka `report_url` (o laudo público deles) para quem quiser conferir. Isso
é a mesma política que o rodapé já aplica às evidências de mercado: quem publica
número publica a fonte clicável.

**Estados de falha.** Cada coluna resolve o seu, sem derrubar a outra:

| Situação | O que a tela diz |
|---|---|
| Lighthouse indisponível / cota | Bloco A: "não medido", com o motivo |
| Is Agentic 429 (10 scans/min por IP) | Bloco B: "fila cheia, tente em um minuto" |
| Is Agentic 503 / scan interrompido | Bloco B: "não medido" |
| URL inválida | Erro no campo do hero, nenhuma medição dispara |

Nenhum desses estados vira 0. Zero é reprovação e a tela lê como reprovação —
a regra já está escrita em `agentic-readiness.ts` e continua valendo.

### Capítulo 2 — Criar ou otimizar

Dois cartões substituem as três frentes:

1. **Site novo** — para quem não tem site, ou cujo site atual não tem salvação.
2. **Otimização** — para quem tem site e acabou de ver na nota onde dói.

Cada cartão leva ao agente com uma intenção própria. O agente deixa de perguntar
"qual frente?" e passa a perguntar "site novo ou consertar o atual?" — uma
pergunta que o visitante consegue responder porque acabou de ver a nota.

`content/fronts.ts` é reescrito: `FrontId = 1 | 2 | 3` vira `PathId = 'novo' |
'otimizar'`, e `Front` vira `Path` com os mesmos campos (`label`, `promise`,
`tag`, `probe`). `lib/fronts.ts` (`resolveFirstFront`) é substituído por uma
função que escolhe o caminho a partir da nota e do `hasNoWebsite`: sem site →
`novo`; com nota abaixo do corte → `otimizar`; com nota alta → `otimizar` com a
ressalva de que o gargalo provavelmente não está na vitrine.

### Capítulo 3 — Prova e quem executa

Estrutura mantida. Três mudanças:

- o case de **site** (hoje `front: 1`, "Design de interiores") vai para o topo e
  ganha destaque visual;
- a etiqueta de frente sai dos cartões — não há mais frentes a etiquetar;
- os outros dois cases **continuam na página**, em tamanho menor. Remover prova
  real e verificada para caber num posicionamento é o único tipo de "foco" que
  este repositório não aceita: são os únicos resultados medidos que existem.

A bio do consultor e os painéis de credibilidade ficam como estão.

### Capítulo 4 — O agente e a agenda

Inalterado em arquitetura. Muda o texto de duas coisas:

- a chamada acima do chat, que hoje vende o "Diagnóstico de Gargalo";
- as intenções de `content/intents.ts` (ver abaixo).

## O Índice de Vulnerabilidade sai

`VulnerabilityContext` calcula hoje um índice cujo teto de proteção é 95 pontos,
assim distribuídos:

```
frentes cobertas   3 x 20 = 60
site (presença + saúde)   = 25
presença em redes (pool)  = 10
```

Com as frentes reduzidas a dois caminhos mutuamente exclusivos, **60 dos 95
pontos perdem base**: não faz sentido "cobrir" simultaneamente criar e otimizar.
Reponderar os pesos restantes seria inventar uma escala nova para manter um
número que a página não precisa mais — e o arquivo avisa, em nota própria, que
mexer no teto faz o índice "mentir por inflação".

Então o índice sai inteiro. O `EliteHUD` passa a exibir **as duas notas medidas**
em vez de um índice sintético. O contexto continua existindo, com o nome
`SiteScoreContext`, guardando: nota Google, nota agêntica, `hasNoWebsite` e o
caminho escolhido (`novo` / `otimizar`). É menos estado, todo ele medido.

`constants/socialNetworks.ts` e o pool de redes saem junto — eram entrada só do
índice.

## Integração com o Is Agentic

Três superfícies públicas, gratuitas e somente leitura. Duas interessam:

**1. Ler laudo pronto.** `GET https://is-agentic.com/api/v1/report?url=<url>`

- CORS liberado (`Access-Control-Allow-Origin: *`), então a chamada sai direto do
  navegador, sem proxy;
- 120 requisições por IP a cada 60s;
- devolve `score`, `score_label`, `scanned_at`, `score_breakdown`
  (`essential` / `recommended` / `bonus`) e `issues[]` com `id`, `name`,
  `result`, `tier`, `details`, `recommendation`;
- erros em RFC 9457 (`application/problem+json`) com `code` estável:
  `invalid_url` 400, `report_not_found` 404, `rate_limit_exceeded` 429,
  `report_temporarily_unavailable` 503.

**2. Disparar scan novo.** `GET https://is-agentic.com/api/scan/stream?target=<domínio>`

- é o que o CLI oficial usa; Server-Sent Events;
- **sem CORS** — o `OPTIONS` responde 204 sem `Access-Control-Allow-Origin`, logo
  o navegador não pode chamar. Precisa de uma função nossa;
- 10 scans por IP a cada 60s (`RateLimit-Policy: "site-scan";q=10;w=60`);
- medido em 2026-09-21 contra um domínio sem laudo: **19 segundos** do disparo ao
  `scan_archived`, ~113 checagens.

**A função nova: `api/agentic-scan.ts`.** Runtime edge, mesmo padrão do
`api/mcp.ts` que já existe. Recebe a URL, chama `/api/v1/report`; se houver laudo
pronto, devolve na hora; se vier `report_not_found`, abre o SSE de scan, consome
até `scan_archived` e então relê o relatório. Repassa `429` e `503` como estado de
"não medido" com motivo, nunca como nota.

A chamada de leitura pode sair do navegador, mas passa pela função também: um
caminho só é mais simples de instrumentar e de testar, e o custo é um hop.

**Decisão sobre o MCP deles:** não usamos. Eles expõem `https://is-agentic.com/mcp`
com três ferramentas de leitura, mas o cliente aqui é uma página, não um agente —
HTTP direto é o contrato certo. (O nosso `api/mcp.ts` continua existindo para o
lado oposto: agentes lendo a RIA.)

**Config.** A URL base entra em `src/config.ts`, que é a fonte única de endpoints
externos e tem teste (`tests/config.test.ts`) proibindo URL de serviço em
qualquer outro arquivo de `src/`.

## O que sai do código

Remoções (com os testes que vêm junto):

| Arquivo | Motivo |
|---|---|
| `components/SocialProofSection.tsx` | a dobra inteira sai |
| `components/VideoWall3D.tsx` | idem |
| `components/AuthorityCard.tsx` | idem |
| `components/AuthorityAccordion.tsx` | idem |
| `components/AwarenessCheck.tsx` | idem |
| `hooks/useOrbitWall.ts`, `lib/orbit-wall.ts` | só a parede usava |
| `content/authorities.ts` | só a parede usava |
| `content/proofPanels.ts` | painéis de apoio da parede |
| `components/VideoModal.tsx` | já está órfão hoje (nenhum import); sai junto com o resto do caminho de vídeo |
| `lib/youtube.ts` | sobram só `VideoWall3D` e o `VideoModal` órfão, ambos removidos aqui |
| `constants/socialNetworks.ts` | ver nota sobre a grade de redes, abaixo |
| `lib/agentic-readiness.ts` | a D5 vira o laudo do Is Agentic |
| `tests/authorities.test.ts`, `orbit-wall.test.ts`, `youtube.test.ts`, `proof-panels.test.ts`, `agentic-readiness.test.ts` | cobrem o que saiu |

**A grade de redes sociais.** `SOCIAL_NETWORKS` não é usada só pelo índice: ela
desenha uma grade visível dentro de `PotentialDiagnostic` ("marque todas em que
sua empresa já publica"). Com o índice fora, essa grade vira uma pergunta sem
consequência — o visitante marca seis caixas e nada acontece com a nota. Ela sai
junto. Se um dia a presença em redes voltar, volta como coisa medida, não como
caixa a marcar.

**CSS e política de privacidade.** `src/index.css` tem regras dedicadas à parede
(`AuthorityCard`, rotor, perspectiva) que saem junto. E `content/privacy.ts` tem
um parágrafo inteiro sobre o YouTube — "só quando você abre um dos vídeos das
vozes do mercado" — que descreve um carregamento que deixa de existir. Política
de privacidade que descreve terceiro inexistente é erro de conformidade, não
sobra de texto: o parágrafo sai no mesmo commit que remove a parede.

Reescritas: `content/privacy.ts`, `content/fronts.ts`, `lib/fronts.ts`, `content/intents.ts`,
`content/offer.ts`, `content/meta.ts`, `context/VulnerabilityContext.tsx` (vira
`SiteScoreContext`), `components/FrontsSection.tsx` (vira `PathsSection`),
`components/PotentialDiagnostic.tsx`, `components/EliteHUD.tsx`,
`pages/LandingPage.tsx`.

Intocados: `AIChatAgent`, `BookingEmbed`, `SiteFooter`, `ConsentBar`,
`WhatsAppFab`, `DataWave3D`, `BrandMark`, `ChapterSection`, `api/mcp.ts`,
`scripts/prerender.js`, `scripts/build-agent-context.ts`, `PrivacyPage`.

A remoção da parede é grande e vale dizer em voz alta: `VideoWall3D` tem spec
própria (`2026-09-03-parede-videos-3d-design.md`) e três correções recentes no
histórico. Ela sai porque empresta autoridade a uma tese ("IA importa") que
deixou de ser a tese da página, não porque está mal feita. O commit que a remove
deve citar esta spec, para quem for ler o `git log` em seis meses entender que
foi decisão de posicionamento.

## A oferta

`content/offer.ts` deixa de vender o Diagnóstico de Gargalo e passa a vender o
que a página faz:

- **Como começa:** a medição, grátis e na hora, na própria página.
- **O produto:** criação de site, ou otimização do existente.
- **Investimento:** continua saindo na proposta enquanto `DIAGNOSTIC_PRICE` (que
  vira `PRICE`) for `null`. **A regra não muda:** não preencher com estimativa,
  porque o valor alimenta JSON-LD e preço errado em dado estruturado fica no
  cache do Google por semanas.
- **O que não acontece:** sem contrato de fidelidade. Mantido como está.

`SESSION_MINUTES = 15` continua sendo fonte única, **e o conflito que o arquivo
documenta continua aberto**: o evento do Cal.com em `VITE_BOOKING_URL` tem slug
`/30min`. Esta spec não resolve isso — só registra que segue pendente e que
alinhar o código não muda a duração no provedor.

O FAQ (`FAQ`, que alimenta o `FAQPage` JSON-LD e o bloco visível) é reescrito para
as perguntas que a nova oferta responde: "meu site aparece no ChatGPT?", "o que
torna um site legível por IA?", "quanto custa um site pronto para IA?". As
evidências de mercado em `content/evidence.ts` **ficam** — elas são o conteúdo
mais citável do site e alimentam o agente e o rodapé.

## O agente

`content/intents.ts` muda de vocabulário, não de arquitetura:

- `front-pick` vira `path-pick` (site novo / otimizar);
- `fronts-agenda` vira `paths-agenda`;
- `diagnostic-result` passa a receber **as duas notas** e a comentar as duas;
- `hero-cold` é reescrita: hoje ela diz "o vazamento está em três lugares: lead
  não respondido, rotina cara, decisão no achismo" — que é a tese antiga inteira;
- `NO_WEBSITE_GREETING` fica, com ajuste de texto.

`lib/intent-format.ts` perde `uncoveredFronts` (não há mais cobertura a apurar) e
mantém `scoreBand` e `formatList`.

`scripts/build-agent-context.ts` publica o novo posicionamento; como ele lê dos
arquivos de conteúdo, muda sozinho. As ferramentas do `api/mcp.ts` renomeiam
`get_fronts` → `get_paths` e atualizam as descrições.

## Consertar o nosso próprio site

O laudo do Is Agentic para `raulvieira.vercel.app` em 2026-09-07: **72/100**,
"Ready with a few material gaps" — essencial 59/80, recomendado 10,2/20.

Vender laudo agêntico com nota 72 é frágil. Os nove apontamentos entram no
escopo, e cada um é uma correção pequena e verificável:

| Apontamento | Nível | O que fazer |
|---|---|---|
| `agent-friendly-404` | essencial | 404 real já existe; falta corpo markdown apontando sitemap/llms.txt |
| `content-no-js` | essencial | hierarquia de títulos pula de H2 para H4 |
| `markdown-negotiation-vary` | essencial | `Accept: text/markdown` devolve HTML; falta `Vary: Accept` nas rotas negociadas |
| `trust-anchors` | recomendado | `/sobre`, `/contato`, `/privacidade` precisam de 500+ caracteres cada |
| `json-ld` | recomendado | `Person` sem `url` e `sameAs`/`jobTitle` |
| `agent-instruction` | recomendado | llms.txt sem seção "quando me usar" |
| `agentic-search-specific` | recomendado | recursos de dev não descobríveis por nome |
| `brand-search-accuracy` | recomendado | busca por "RIA" não devolve o domínio |
| `mcp-server` | recomendado | falta handshake vivo em `/.well-known/mcp` |

Os dois últimos de busca (`agentic-search-specific`, `brand-search-accuracy`)
dependem de indexação e reputação, não de código: entram como **verificação
posterior**, não como tarefa com data. Os outros sete são trabalho nosso.

Alvo: **≥ 90** no laudo público, conferido depois do deploy pela mesma API que a
página consome. É o único número desta spec que pode ser cobrado objetivamente.

## Critérios de aceite

1. A primeira dobra contém o campo de URL e mede sem rolagem.
2. O laudo mostra duas notas, cada uma com fonte nomeada e link de conferência,
   e **em nenhum momento** exibe média ou soma entre elas.
3. Falha de um instrumento não impede o outro de publicar sua nota.
4. Nenhum estado de falha vira `0`; todos dizem "não medido" com motivo.
5. Nenhuma referência a "três frentes", "Diagnóstico de Gargalo", autoridades ou
   índice de vulnerabilidade sobra em `src/`, `tests/`, `scripts/` ou no HTML
   publicado.
6. O agente abre a conversa coerente com o caminho escolhido (novo / otimizar).
7. `npm test` passa, incluindo os testes de SEO, pacote, primeira pintura e
   configuração, que trancam limites que esta mudança encosta.
8. O laudo do próprio site no Is Agentic sobe de 72 para ≥ 90.

## Riscos

**Dependência de terceiro no caminho crítico.** A dobra 1 agora depende de um
serviço externo que o projeto não controla, e a página inteira aponta para ela. O
serviço é gratuito hoje e a documentação não promete SLA. Mitigação: a coluna B
degrada para "não medido" sem derrubar a coluna A nem a conversão — o CTA para o
agente não depende de nota nenhuma.

**Limite de 10 scans/min por IP.** Na função edge, o IP visto pelo Is Agentic é o
da Vercel, não o do visitante — ou seja, o limite é **global para o site**, não
por visitante. Com tráfego de campanha isso satura. Mitigação nesta versão: cache
do laudo por URL (a leitura já é barata e eles arquivam o resultado), e o estado
"fila cheia" explícito. Se o tráfego crescer, reavaliar.

**Perda de trabalho feito.** A parede 3D e o índice de vulnerabilidade somam
várias semanas de construção. A decisão de removê-los é de posicionamento e está
registrada aqui para não ser relitigada por acidente.
