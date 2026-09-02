# Agente Consultor n8n — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ligar o agente do n8n ao conteúdo real do site, fazer com que ele colha cinco campos na conversa e abra a agenda da sessão gratuita já com o que foi coletado.

**Architecture:** O build do site emite `public/agent-context.json` a partir de `src/content/*`; o n8n baixa esse arquivo a cada conversa e monta o prompt com ele. O agente colhe dor, empresa, faturamento, e-mail e telefone por uma ferramenta que valida antes de gravar em Data Table. Um nó determinístico — não o LLM — decide quando o chat mostra o cartão de pauta e quando abre o Cal.com.

**Tech Stack:** React 19 + Vite 6 + Tailwind 4 + Vitest (site); n8n com LangChain Agent, Data Tables e OpenRouter (agente); `tsx` para o gerador de contexto.

**Spec:** `docs/superpowers/specs/2026-08-23-agente-n8n-consultor-design.md`

## Global Constraints

- Português do Brasil em todo texto visível e em todo comentário de código novo.
- Comentários explicam **por que**, não o que. É o padrão de todo o repositório.
- Nenhum número exibido ao visitante pode ser fabricado (`content/cases.ts`, `content/evidence.ts`).
- `src/config.ts` é a única casa de URL de serviço; `src/constants/links.ts` a única de contato. `tests/config.test.ts` faz valer.
- Workflow n8n: `spPSvr1rXOouVZWq`, ativo, path `ria-agente`. Versão para rollback: `01cd8d24-1338-4670-9a36-1131c3d5a8e3` (counter 3).
- URL de produção do site: `https://raulvieira.vercel.app` (de `SITE_URL` em `scripts/prerender.js`).
- Data Table alvo: `ria_leads`, no projeto `JBqlTYJZ0GOvmZb5`.
- Credenciais existentes a reaproveitar: OpenRouter `HIlbESOvo7r1ooHv`, Gmail `7G6z0TY8xhbILqa8`.
- Nunca commitar `.env` nem `.env.local`.
- `npm install` já foi rodado nesta máquina; se `node_modules` estiver vazio, rode antes de qualquer coisa.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `scripts/build-agent-context.ts` | Lê `src/content/*` e emite o JSON de contexto | criar |
| `public/agent-context.json` | O contexto publicado, commitado | criar (gerado) |
| `tests/agent-context.test.ts` | Falha se o JSON divergir do conteúdo | criar |
| `src/lib/agent-card.ts` | Parse defensivo do cartão que o n8n devolve | criar |
| `tests/agent-card.test.ts` | Contrato do parse | criar |
| `src/components/AIChatAgent.tsx` | Chat, cartão, agenda, payload | modificar |
| `src/components/SocialProofSection.tsx` | Destravar o build | modificar |
| `src/content/authorities.ts` | Corrigir o comentário sobre o índice | modificar |
| `src/content/privacy.ts` | Refletir o fluxo novo de coleta | modificar |
| `src/components/QualificationFlow.tsx` | Coleta sai do front | remover |
| `src/lib/qualification.ts` | Regras migram para o n8n | remover |
| `tests/qualification.test.ts` | Acompanha a remoção | remover |
| `docs/n8n-contrato-agente.md` | Contrato de duas ações | reescrever |
| `package.json` | Encadear o gerador no build | modificar |

---

### Task 1: Destravar o build

Hoje `npm run build` completa o bundle e **falha no prerender**:

```
[prerender] Falhou ao renderizar /: TypeError: Cannot read properties of undefined (reading 'filter')
    at SocialProofSection (dist-ssr/entry-server.js:2703:34)
```

`SocialProofSection` desestrutura `awarenessChecks` e `toggleAwarenessCheck` de `useVulnerability()`, que parou de expô-los quando o eixo de conscientização saiu do índice. Com o prerender quebrado, o `dist` publicado volta a ser `<div id="root"></div>` para crawlers — o defeito que `scripts/prerender.js` existe para impedir, numa página que vende ser citável por IA.

A marcação vira **estado local**. Ela não pode voltar ao índice: `VulnerabilityContext` documenta que o índice mede o que a empresa faz, nunca o que ela concorda.

**Files:**
- Modify: `src/components/SocialProofSection.tsx:1-15`
- Modify: `src/content/authorities.ts:12-15` (comentário)
- Test: `tests/authorities.test.ts` (já existe; só precisa continuar passando)

**Interfaces:**
- Consumes: nada.
- Produces: `npm run build` completo, pré-requisito de todas as tarefas seguintes.

- [ ] **Step 1: Ver a falha**

```bash
npm run build 2>&1 | grep -A2 "prerender.*Falhou"
```

Esperado: o `TypeError` acima.

- [ ] **Step 2: Trocar o estado do contexto por estado local**

Em `src/components/SocialProofSection.tsx`, remova `awarenessChecks` e `toggleAwarenessCheck` da desestruturação — e, se `useVulnerability()` não for mais usado no arquivo, remova também o import.

```tsx
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import VideoModal from './VideoModal';
import AuthorityAccordion from './AuthorityAccordion';
import AuthorityCard from './AuthorityCard';
import { AUTHORITIES, type Authority } from '../content/authorities';

export default function SocialProofSection() {
  const [selected, setSelected] = useState<Authority | null>(null);
  // Um aberto por vez: a dobra tem 100svh e tres paineis abertos empurrariam o
  // rodape para fora da tela no celular.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /**
   * A marcacao e local de proposito, e NAO alimenta o Indice de
   * Vulnerabilidade. O indice mede o que a empresa faz, nunca o que ela
   * concorda — ver o cabecalho de VulnerabilityContext, que removeu o eixo de
   * conscientizacao justamente por isso. Aqui a caixa e um gesto de leitura:
   * marca o que a pessoa ja assimilou, e nao muda nenhuma nota.
   */
  const [awarenessChecks, setAwarenessChecks] = useState<boolean[]>(
    () => AUTHORITIES.map(() => false)
  );
  const toggleAwarenessCheck = (index: number) =>
    setAwarenessChecks((prev) => prev.map((v, i) => (i === index ? !v : v)));

  const vistos = awarenessChecks.filter(Boolean).length;
```

O resto do componente não muda: `awarenessChecks` e `toggleAwarenessCheck` continuam com os mesmos nomes e as mesmas formas.

- [ ] **Step 3: Corrigir o comentário que aponta para o lugar errado**

`src/content/authorities.ts` diz que a ordem do array é o índice de `awarenessChecks` "no VulnerabilityContext". Não é mais. Substitua esse parágrafo por:

```ts
 * A ordem deste array e o indice do vetor de marcacoes em SocialProofSection,
 * que e estado LOCAL daquele componente e nao alimenta o Indice de
 * Vulnerabilidade. Mexer na ordem remarca a caixa errada; incluir ou remover
 * um item nao exige mudar nada fora dali, porque o vetor e derivado de
 * AUTHORITIES.map().
```

- [ ] **Step 4: Build e testes**

```bash
npm run build
```

Esperado: nenhuma linha `[prerender] Falhou`. Confirme que o HTML tem conteúdo:

```bash
grep -c "Ricardo Amorim" dist/index.html
```

Esperado: `1` ou mais. Antes desta tarefa: `0`.

```bash
npm test
npx tsc --noEmit
```

Esperado: todos passam, sem erro de tipo.

- [ ] **Step 5: Commit**

```bash
git add src/components/SocialProofSection.tsx src/content/authorities.ts
git commit -m "fix: a marcacao das autoridades lia um estado que o indice removeu"
```

---

### Task 2: O site publica o próprio contexto

O gerador que torna o "1 das 5 frentes" impossível. Roda com `tsx`, que já resolve os módulos de `src/content` incluindo os que importam `lucide-react` — verificado nesta máquina.

O arquivo **não tem timestamp**. Um `generatedAt` faria toda regeração diferir e tornaria o teste de drift inútil. Sem ele, gerar duas vezes produz bytes idênticos e o teste é uma comparação direta.

**Files:**
- Create: `scripts/build-agent-context.ts`
- Create: `public/agent-context.json` (gerado, commitado)
- Create: `tests/agent-context.test.ts`
- Modify: `package.json` (script `build`)

**Interfaces:**
- Consumes: `src/content/{fronts,offer,evidence,cases,consultant,authorities}.ts`, `src/constants/links.ts`, `src/context/VulnerabilityContext.tsx`.
- Produces: `buildAgentContext(): AgentContext` exportado de `scripts/build-agent-context.ts`, e o arquivo `public/agent-context.json`. A Task 8 consome esse JSON pela URL `https://raulvieira.vercel.app/agent-context.json`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/agent-context.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAgentContext } from '../scripts/build-agent-context';
import { FRONTS } from '../src/content/fronts';

const publicado = JSON.parse(
  readFileSync(resolve(__dirname, '../public/agent-context.json'), 'utf-8')
);

describe('agent-context: o contexto que o agente le', () => {
  it('CTX-01: o arquivo publicado e identico ao que o gerador produz agora', () => {
    // Este e o teste que impede a divergencia que produziu o "1 das 5 frentes":
    // mexer em src/content sem regenerar quebra aqui, no CI, e nao em producao
    // na frente de um lead.
    expect(publicado).toEqual(buildAgentContext());
  });

  it('CTX-02: as frentes do contexto sao exatamente as frentes do site', () => {
    expect(publicado.fronts).toHaveLength(FRONTS.length);
    expect(publicado.fronts.map((f: { id: number }) => f.id)).toEqual(FRONTS.map((f) => f.id));
  });

  it('CTX-03: nenhuma frente descontinuada sobrevive no contexto', () => {
    const texto = JSON.stringify(publicado.fronts);
    expect(texto).not.toContain('Sistema sob medida');
    expect(texto).not.toContain('Dados e decisão');
  });

  it('CTX-04: a sessao gratuita dura 15 minutos, como a pagina diz', () => {
    expect(publicado.positioning.firstCall.minutes).toBe(15);
  });

  it('CTX-05: caso sem apuracao chega marcado como nao auditado', () => {
    // cases.ts hoje nao tem nenhum measurement preenchido. Se um for
    // preenchido, este teste passa a exigir audited: true naquele caso.
    for (const c of publicado.cases) {
      expect(c.audited).toBe(Boolean(c.measurement));
    }
  });

  it('CTX-06: toda evidencia chega com fonte e ano, que e o que o agente pode citar', () => {
    expect(publicado.evidence.length).toBeGreaterThan(0);
    for (const e of publicado.evidence) {
      expect(e.source.trim().length).toBeGreaterThan(0);
      expect(typeof e.year).toBe('number');
    }
  });

  it('CTX-07: o gerador e deterministico — nada de timestamp', () => {
    expect(JSON.stringify(buildAgentContext())).toBe(JSON.stringify(buildAgentContext()));
    expect(JSON.stringify(publicado)).not.toContain('generatedAt');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx vitest run tests/agent-context.test.ts
```

Esperado: FAIL — `Cannot find module '../scripts/build-agent-context'`.

- [ ] **Step 3: Escrever o gerador**

`scripts/build-agent-context.ts`:

```ts
// O contexto que o agente do n8n le.
//
// Este arquivo existe por causa de um defeito medido em producao: o agente
// respondia "voce cobre 1 das 5 frentes" enquanto a tela do lead dizia
// "1 de 3". As frentes cairam de cinco para tres em ago/2026 e o prompt do
// n8n, mantido a mao, nao soube. Corrigir o texto la nao impediria a proxima
// divergencia — so tirar a manutencao manual do caminho impede.
//
// Entao: o build le src/content/* e emite public/agent-context.json; o n8n
// baixa esse arquivo a cada conversa. Mudar o posicionamento no site atualiza
// o agente no proximo deploy, sem ninguem tocar no n8n.
//
// O arquivo NAO carrega timestamp. Com um, toda regeracao diferiria e o teste
// de drift (tests/agent-context.test.ts) nao teria como comparar. Sem ele, o
// gerador e deterministico e a comparacao e direta.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FRONTS } from '../src/content/fronts';
import {
  OFFER_TERMS,
  FAQ,
  DIAGNOSTIC_PRICE,
  IMPLEMENTATION_RANGE,
} from '../src/content/offer';
import { EVIDENCE } from '../src/content/evidence';
import { CASES } from '../src/content/cases';
import { CONSULTANT } from '../src/content/consultant';
import { AUTHORITIES } from '../src/content/authorities';
import { WHATSAPP_URL } from '../src/constants/links';
import { FLOOR, NO_WEBSITE_INDEX } from '../src/context/VulnerabilityContext';

/**
 * O que cada clique de CTA significou.
 *
 * Escrito a mao, e nao derivado de content/intents.ts, porque as funcoes
 * daquele arquivo dependem de contexto de runtime e nao serializam. O agente
 * nao precisa da fala exata — ela ja esta na memoria da sessao, gravada pelo
 * proprio site via action: 'intent'. O que falta a ele e saber o que o clique
 * queria dizer.
 */
const INTENT_MEANINGS = [
  { id: 'hero-cold', meaning: 'Clicou no CTA do topo. Ainda nao se diagnosticou; chegou frio.' },
  { id: 'diagnostic-result', meaning: 'Acabou de auditar o proprio site e quer entender o que a nota custa.' },
  { id: 'diagnostic-no-website', meaning: 'Declarou que ainda nao tem site. E o caso mais urgente e o de ordem invertida: existir antes de automatizar.' },
  { id: 'front-pick', meaning: 'Escolheu uma frente especifica no cartao e quer falar sobre ela.' },
  { id: 'fronts-agenda', meaning: 'Marcou o que ja cobre e pediu para montar a pauta com o que falta.' },
  { id: 'credibility', meaning: 'Leu os casos e quer saber o que da para fazer na empresa dele.' },
] as const;

export interface AgentContext {
  readme: string;
  positioning: {
    entryProduct: string;
    entryProductSummary: string;
    firstCall: { minutes: number; free: boolean; format: string };
  };
  fronts: { id: number; label: string; promise: string; tag: string; probe: string }[];
  offer: {
    diagnosticPrice: string | null;
    implementationRange: string;
    terms: { label: string; value: string; detail: string }[];
  };
  faq: { question: string; answer: string }[];
  evidence: {
    value: string; claim: string; takeaway: string;
    source: string; year: number; method: string; url: string;
  }[];
  cases: {
    kind: string; front: number | null; segment: string; headline: string;
    before: string; intervention: string; timeframe: string;
    measurement: string | null; audited: boolean;
  }[];
  consultant: { name: string; role: string; tagline: string; bio: string[]; credentials: string[] };
  authorities: { name: string; title: string; quote: string }[];
  vulnerability: { floor: number; cap: number; noWebsiteIndex: number; note: string };
  intents: { id: string; meaning: string }[];
  contact: { whatsapp: string };
}

export function buildAgentContext(): AgentContext {
  return {
    readme:
      'Gerado por scripts/build-agent-context.ts a partir de src/content/*. Nao edite a mao: a proxima build sobrescreve.',

    positioning: {
      entryProduct: 'Diagnóstico de Gargalo',
      entryProductSummary:
        'Trinta dias medindo horas e volume das rotinas, no sistema do cliente. Sai com os três gargalos mais caros, em ordem de custo por hora, e o que atacar primeiro.',
      firstCall: { minutes: 15, free: true, format: 'vídeo ou WhatsApp' },
    },

    fronts: FRONTS.map((f) => ({
      id: f.id, label: f.label, promise: f.promise, tag: f.tag, probe: f.probe,
    })),

    offer: {
      diagnosticPrice: DIAGNOSTIC_PRICE,
      implementationRange: IMPLEMENTATION_RANGE,
      terms: OFFER_TERMS.map((t) => ({ label: t.label, value: t.value, detail: t.detail })),
    },

    faq: FAQ.map((f) => ({ question: f.question, answer: f.answer })),

    // `icon` e LucideIcon: nao e JSON e nao diz nada ao agente.
    evidence: EVIDENCE.map((e) => ({
      value: e.value, claim: e.claim, takeaway: e.takeaway,
      source: e.source, year: e.year, method: e.method, url: e.url,
    })),

    // `audited` e o campo que decide se o agente pode falar do numero como
    // apurado. Hoje nenhum caso tem measurement, entao os tres chegam false.
    cases: CASES.map((c) => ({
      kind: c.kind,
      front: c.front ?? null,
      segment: c.segment,
      headline: c.headline,
      before: c.before,
      intervention: c.intervention,
      timeframe: c.timeframe,
      measurement: c.measurement ?? null,
      audited: Boolean(c.measurement),
    })),

    consultant: {
      name: CONSULTANT.name,
      role: CONSULTANT.role,
      tagline: CONSULTANT.tagline,
      bio: [...CONSULTANT.bio],
      credentials: [...CONSULTANT.credentials],
    },

    authorities: AUTHORITIES.map((a) => ({ name: a.name, title: a.title, quote: a.quote })),

    vulnerability: {
      floor: FLOOR,
      cap: 95,
      noWebsiteIndex: NO_WEBSITE_INDEX,
      note:
        'O indice vai de 8 a 100. O valor 101 nao e medicao: e o marcador de que o visitante declarou nao ter site. Nunca o apresente como percentual de exposicao.',
    },

    intents: INTENT_MEANINGS.map((i) => ({ id: i.id, meaning: i.meaning })),

    contact: { whatsapp: WHATSAPP_URL },
  };
}

const isMain = process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const destino = resolve(root, 'public/agent-context.json');
  writeFileSync(destino, JSON.stringify(buildAgentContext(), null, 2) + '\n', 'utf-8');
  console.log(`[RIA] agent-context.json gerado em ${destino}`);
}
```

- [ ] **Step 4: Gerar o arquivo**

```bash
npx tsx scripts/build-agent-context.ts
```

Esperado: `[RIA] agent-context.json gerado em …/public/agent-context.json`.

```bash
node -e "const c=require('./public/agent-context.json'); console.log(c.fronts.length, c.positioning.firstCall.minutes, c.faq.length, c.evidence.length)"
```

Esperado: `3 15 6 4`.

- [ ] **Step 5: Rodar o teste**

```bash
npx vitest run tests/agent-context.test.ts
```

Esperado: 7 testes PASS.

- [ ] **Step 6: Encadear no build**

Em `package.json`, o gerador roda **antes** do `vite build`, porque `public/` é copiado para `dist/` durante o bundle:

```json
"build": "tsx scripts/build-agent-context.ts && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.js",
```

- [ ] **Step 7: Confirmar que o arquivo chega ao dist**

```bash
npm run build && node -e "console.log(require('./dist/agent-context.json').fronts.length)"
```

Esperado: `3`.

- [ ] **Step 8: Commit**

```bash
git add scripts/build-agent-context.ts public/agent-context.json tests/agent-context.test.ts package.json
git commit -m "feat: o site passa a publicar o contexto que o agente le"
```

---

### Task 3: O contrato do cartão

O n8n passa a devolver `{ output, card? }`. `card` vem de fora e não pode chegar ao render sem passar por um parse severo — mesma regra que `parseRoiData` já aplicava: forma inválida vira `undefined`, nunca uma tela quebrada.

**Files:**
- Create: `src/lib/agent-card.ts`
- Create: `tests/agent-card.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `export type AgentCard`, `export function parseCard(raw: unknown): AgentCard | undefined`. A Task 4 importa os dois.

- [ ] **Step 1: Escrever o teste que falha**

`tests/agent-card.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseCard } from '../src/lib/agent-card';

describe('parseCard: o cartao que o n8n devolve', () => {
  it('CARD-01: cartao de agenda valido passa inteiro', () => {
    expect(
      parseCard({ kind: 'agenda', empresa: 'Metalurgica X', email: 'a@b.com.br', notas: 'Dor: orcamento manual' })
    ).toEqual({ kind: 'agenda', empresa: 'Metalurgica X', email: 'a@b.com.br', notas: 'Dor: orcamento manual' });
  });

  it('CARD-02: agenda sem empresa ou sem email nao e agenda', () => {
    // Sem os dois o BookingEmbed nao consegue pre-preencher, e um Cal.com
    // vazio depois de a conversa inteira ter colhido os dados e pior do que
    // nao abrir a agenda.
    expect(parseCard({ kind: 'agenda', empresa: 'X' })).toBeUndefined();
    expect(parseCard({ kind: 'agenda', email: 'a@b.com' })).toBeUndefined();
    expect(parseCard({ kind: 'agenda', empresa: '  ', email: 'a@b.com' })).toBeUndefined();
  });

  it('CARD-03: cartao de pauta aceita campos ausentes', () => {
    expect(parseCard({ kind: 'pauta' })).toEqual({ kind: 'pauta' });
  });

  it('CARD-04: pauta so aceita nota de site numerica dentro da escala', () => {
    expect(parseCard({ kind: 'pauta', notaSite: 63 })).toEqual({ kind: 'pauta', notaSite: 63 });
    expect(parseCard({ kind: 'pauta', notaSite: 'muito ruim' })).toEqual({ kind: 'pauta' });
    expect(parseCard({ kind: 'pauta', notaSite: 480 })).toEqual({ kind: 'pauta' });
  });

  it('CARD-05: frentes faltantes so entram como lista de textos', () => {
    expect(parseCard({ kind: 'pauta', frentesFaltantes: ['Agente SDR 24/7', 'Automação'] }))
      .toEqual({ kind: 'pauta', frentesFaltantes: ['Agente SDR 24/7', 'Automação'] });
    expect(parseCard({ kind: 'pauta', frentesFaltantes: 'Agente SDR' })).toEqual({ kind: 'pauta' });
    expect(parseCard({ kind: 'pauta', frentesFaltantes: [1, 2] })).toEqual({ kind: 'pauta' });
  });

  it('CARD-06: lixo nao vira cartao', () => {
    for (const lixo of [undefined, null, 'agenda', 42, [], {}, { kind: 'roi' }, { kind: 'agenda' }]) {
      expect(parseCard(lixo)).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx vitest run tests/agent-card.test.ts
```

Esperado: FAIL — `Cannot find module '../src/lib/agent-card'`.

- [ ] **Step 3: Implementar**

`src/lib/agent-card.ts`:

```ts
/**
 * O cartao que o n8n pode anexar a uma resposta.
 *
 * Substitui o antigo contrato de ROI, que o front renderizava como
 * "R$ X /ano" e que o n8n nunca preencheu — um campo morto que, se algum dia
 * fosse preenchido por LLM, publicaria numero sem lastro numa pagina cuja
 * regra declarada e que nenhum numero exibido e fabricado.
 *
 * Os dois cartoes daqui carregam apenas dado que o proprio visitante forneceu:
 * a nota que o diagnostico mediu, as frentes que ele deixou desmarcadas, a dor
 * que ele descreveu.
 *
 * Quem decide qual cartao aparece e um no deterministico do n8n, nao o modelo.
 * Deixar o LLM escolher a hora de abrir a agenda faria o gatilho da conversao
 * mudar de humor a cada resposta.
 */

export type AgentCard =
  | {
      kind: 'pauta';
      notaSite?: number;
      frentesFaltantes?: string[];
      dor?: string;
    }
  | {
      kind: 'agenda';
      /** Vai para o campo `name` do Cal.com. */
      empresa: string;
      email: string;
      /** Contexto que o Raul le antes da chamada. */
      notas?: string;
    };

function textoOuNada(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * O n8n e livre para mudar de forma. Nada dele chega ao render sem passar
 * aqui, e qualquer desvio vira `undefined` — a resposta continua aparecendo,
 * so sem cartao. Um cartao malformado nunca pode custar a mensagem.
 */
export function parseCard(raw: unknown): AgentCard | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const c = raw as Record<string, unknown>;

  if (c.kind === 'agenda') {
    const empresa = textoOuNada(c.empresa);
    const email = textoOuNada(c.email);
    // Sem os dois nao ha pre-preenchimento, e abrir um Cal.com em branco
    // depois de a conversa ter colhido tudo e pior do que nao abrir.
    if (!empresa || !email) return undefined;
    const notas = textoOuNada(c.notas);
    return notas ? { kind: 'agenda', empresa, email, notas } : { kind: 'agenda', empresa, email };
  }

  if (c.kind === 'pauta') {
    const card: AgentCard = { kind: 'pauta' };

    const nota = Number(c.notaSite);
    if (Number.isFinite(nota) && nota >= 0 && nota <= 100) card.notaSite = Math.round(nota);

    if (Array.isArray(c.frentesFaltantes)) {
      const nomes = c.frentesFaltantes.filter(
        (f): f is string => typeof f === 'string' && f.trim().length > 0
      );
      // Lista parcialmente valida e sintoma de contrato quebrado: ou vem
      // inteira, ou nao vem.
      if (nomes.length === c.frentesFaltantes.length && nomes.length > 0) {
        card.frentesFaltantes = nomes;
      }
    }

    const dor = textoOuNada(c.dor);
    if (dor) card.dor = dor;

    return card;
  }

  return undefined;
}
```

- [ ] **Step 4: Rodar o teste**

```bash
npx vitest run tests/agent-card.test.ts
```

Esperado: 6 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agent-card.ts tests/agent-card.test.ts
git commit -m "feat: o contrato do cartao substitui o campo de ROI que ninguem preenchia"
```

---

### Task 4: O chat — cartão, agenda e payload honesto

A maior tarefa. Quatro mudanças que precisam entrar juntas porque compartilham o mesmo componente:

1. `parseRoiData` sai, `parseCard` entra; o cartão de ROI vira cartão de pauta.
2. `QualificationFlow` sai; `stage` vira `'chat' | 'booking'`; `kind: 'agenda'` abre o `BookingEmbed`.
3. O payload de `sendMessage` passa a levar `frontsMissing`, `intentId` e `ref` — hoje leva só `frontsCovered`, e é na conversa livre que o agente mais precisa saber **quais** frentes faltam.
4. `assessedVulnerabilityIndex` substitui o índice cru, e "30 min" vira 15.

**Files:**
- Modify: `src/components/AIChatAgent.tsx`
- Delete: `src/components/QualificationFlow.tsx`, `src/lib/qualification.ts`, `tests/qualification.test.ts`

**Interfaces:**
- Consumes: `parseCard`, `AgentCard` (Task 3); `BookingEmbed` (inalterado); `missingFronts` de `src/lib/fronts.ts`.
- Produces: o payload que a Task 8 lê. Forma final de `sendMessage`:

```json
{
  "sessionId": "uuid",
  "action": "sendMessage",
  "chatInput": "texto do lead",
  "intentId": "fronts-agenda | null",
  "ref": "industria | null",
  "context": {
    "vulnerabilityIndex": 88,
    "hasNoWebsite": false,
    "websiteScore": 63,
    "frontsCovered": 1,
    "frontsMissing": [2, 3]
  }
}
```

`vulnerabilityIndex` é `null` quando o visitante não avaliou nada.

- [ ] **Step 1: Remover a coleta do front**

```bash
git rm src/components/QualificationFlow.tsx src/lib/qualification.ts tests/qualification.test.ts
```

As regras de validação não somem: vão para o sub-workflow da Task 7, que passa a ser a casa delas.

- [ ] **Step 2: Trocar imports e estado no topo de `AIChatAgent.tsx`**

Remova os imports de `QualificationFlow` e de `../lib/qualification`. O bloco de imports fica:

```tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// `TrendingUp`, `ArrowRight` e `CalendarCheck` saem: o primeiro era do cartao
// de ROI, os outros dois dos botoes que a agenda automatica torna
// desnecessarios. `Target` entra, para o cartao de pauta.
import { Send, User, Bot, Sparkles, Target, MessageCircle } from 'lucide-react';
import { config } from '../config';
import { useVulnerability } from '../context/VulnerabilityContext';
import { whatsappWithMessage } from '../constants/links';
import { track } from '../lib/analytics';
import BookingEmbed from './BookingEmbed';
import { parseCard, type AgentCard } from '../lib/agent-card';
import { FRONTS } from '../content/fronts';
import {
  INTENTS, readCampaignRef, GREETING, NO_WEBSITE_GREETING,
  type IntentContext, type IntentId,
} from '../content/intents';
import { useAgentIntent } from '../context/AgentIntentContext';
import { shouldInject } from '../lib/agent-intent';
import { missingFronts } from '../lib/fronts';
```

Apague a interface `RoiData` e a função `parseRoiData` inteiras. `Message` passa a ser:

```tsx
interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Cartao anexado pelo n8n. So chega aqui depois de parseCard. */
  card?: AgentCard;
  /** Quando o agente nao pode responder, o lead ainda precisa de um destino. */
  handoff?: boolean;
}
```

- [ ] **Step 3: Estágio, intenção lembrada e trava do cartão de pauta**

Substitua a declaração de `stage` e de `qualification` por:

```tsx
  /**
   * Dois estagios. A qualificacao por formulario saiu: o agente colhe os cinco
   * campos na conversa e a agenda abre quando ele termina. O gatilho continua
   * fora do modelo — quem decide e o no deterministico do n8n, que le a Data
   * Table e anexa o cartao.
   */
  const [stage, setStage] = useState<'chat' | 'booking'>('chat');
  const [agenda, setAgenda] = useState<Extract<AgentCard, { kind: 'agenda' }> | null>(null);

  /**
   * A ultima intencao clicada. Vai junto no sendMessage para o agente saber de
   * qual dobra a conversa nasceu — o intentId chegava so no action:'intent' e
   * era descartado.
   */
  const [lastIntent, setLastIntent] = useState<IntentId | null>(null);

  /**
   * Um cartao de pauta por conversa. O n8n anexa o cartao enquanto o lead
   * estiver incompleto, o que sao varios turnos; repetir o mesmo bloco a cada
   * resposta transformaria a conversa numa parede de cartoes.
   */
  const pautaMostrada = useRef(false);
```

Declarar `lastIntent` não basta — nada o preenche ainda. No `useEffect` que consome
`pending`, logo depois de `handledNonce.current = pending.nonce;`, grave a intenção:

```tsx
    handledNonce.current = pending.nonce;
    // Guardada para viajar no proximo sendMessage. Sem isto o agente perde de
    // vista de qual dobra a conversa nasceu assim que o lead digita a primeira
    // mensagem propria.
    setLastIntent(pending.id);
    consume();
```

A gravação fica **antes** da guarda `shouldInject`, de propósito: mesmo quando a
injeção é suprimida — por já haver qualificação na tela, ou por clique duplo — o
lead veio daquela dobra, e é isso que o agente precisa saber.

- [ ] **Step 4: Corrigir o payload de `sendMessage`**

Dentro de `send`, o corpo do `fetch` passa a ser:

```tsx
        body: JSON.stringify({
          sessionId,
          action: 'sendMessage',
          chatInput: currentInput,
          intentId: lastIntent,
          ref: readCampaignRef(typeof window === 'undefined' ? '' : window.location.search),
          context: {
            // O indice cru dizia 100 tanto para "totalmente exposto" quanto
            // para "nunca avaliou nada". So o null distingue os dois, e o
            // agente precisa da distincao antes de opinar sobre maturidade.
            vulnerabilityIndex: assessedVulnerabilityIndex,
            hasNoWebsite,
            websiteScore,
            frontsCovered: frontsChecked.filter(Boolean).length,
            // Faltava aqui, e e o sinal mais rico do diagnostico: nao quantas
            // frentes faltam, mas quais.
            frontsMissing: missingFronts(frontsChecked, FRONTS.map((f) => f.id)),
          },
        }),
```

- [ ] **Step 5: Ler o cartão na resposta**

No bloco que interpreta `responseData`, troque a leitura de `data` por `card`:

```tsx
      let botMessage = '';
      let card: AgentCard | undefined;

      if (Array.isArray(responseData)) {
        const first = responseData[0];
        if (first && typeof first === 'object') {
          const f = first as Record<string, unknown>;
          botMessage = String(f.output ?? f.response ?? f.message ?? f.text ?? '');
          card = parseCard(f.card);
        }
      } else if (responseData && typeof responseData === 'object') {
        const o = responseData as Record<string, unknown>;
        botMessage = String(o.output ?? o.response ?? o.message ?? o.text ?? '');
        card = parseCard(o.card);
      } else if (typeof responseData === 'string') {
        botMessage = responseData;
      }

      botMessage = botMessage.trim();
      if (!botMessage) throw new Error('empty-response');

      // Um cartao de pauta por conversa.
      if (card?.kind === 'pauta') {
        if (pautaMostrada.current) card = undefined;
        else pautaMostrada.current = true;
      }

      track('agent_replied', { latency_ms: Math.round(performance.now() - startedAt) });
      setMessages((prev) => [...prev, { role: 'assistant', content: botMessage, card }]);

      // A agenda abre logo depois da fala que a anuncia, nunca no lugar dela.
      if (card?.kind === 'agenda') {
        setAgenda(card);
        setStage('booking');
        track('qualification_completed', {});
      }
```

- [ ] **Step 6: Renderizar o cartão de pauta**

Substitua o bloco `{msg.data && (…)}` por:

```tsx
                  {msg.card?.kind === 'pauta' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-raised glass-accent mt-4 p-4 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={14} className="text-accent" />
                        <span className="text-xs uppercase font-bold tracking-widest text-slate-600">
                          Pauta do seu diagnóstico
                        </span>
                      </div>

                      <ul className="text-xs text-slate-700 space-y-1.5 mb-3">
                        {msg.card.dor && (
                          <li>
                            <span className="font-bold">Gargalo relatado:</span> {msg.card.dor}
                          </li>
                        )}
                        {typeof msg.card.notaSite === 'number' && (
                          <li>
                            <span className="font-bold">Site auditado:</span> {msg.card.notaSite}/100
                          </li>
                        )}
                        {msg.card.frentesFaltantes && msg.card.frentesFaltantes.length > 0 && (
                          <li>
                            <span className="font-bold">Frentes descobertas:</span>{' '}
                            {msg.card.frentesFaltantes.join(', ')}
                          </li>
                        )}
                      </ul>

                      <p className="text-[11px] text-slate-500 leading-snug">
                        É isso que entra na conversa de 15 minutos. Continue respondendo aqui que eu
                        abro a agenda no fim.
                      </p>
                    </motion.div>
                  )}
```

O cartão **não** tem botão. Antes o de ROI abria a qualificação; agora o caminho para a agenda é terminar de responder ao agente, e um botão concorrente devolveria ao lead uma segunda porta que coleta menos.

- [ ] **Step 7: Trocar o rodapé de estágios**

Substitua os três blocos `stage === …` por:

```tsx
        {stage === 'booking' && agenda && (
          <BookingEmbed
            name={agenda.empresa}
            email={agenda.email}
            notes={agenda.notas}
            fallbackMessage={[
              'Olá Raul, conversei com o agente no site e quero marcar a sessão de 15 minutos.',
              '',
              `Empresa: ${agenda.empresa}`,
              `E-mail: ${agenda.email}`,
              agenda.notas ?? '',
            ].filter(Boolean).join('\n')}
          />
        )}
```

Apague o botão "Agendar minha sessão de 30 min" e o bloco `stage === 'qualifying'`. O `useMemo` de `bookingFallbackMessage` e o de `pauta` saem junto — ambos dependiam de `qualification`, que não existe mais.

E remova a função `handleQualified` inteira: era ela que enviava `action: 'qualification'`, ação que deixa de existir no contrato.

- [ ] **Step 8: Verificar**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro. Se sobrar aviso de import não usado (`CalendarCheck`, `labelFor`), remova o import.

```bash
npm test && npm run build
```

Esperado: todos os testes passam, build sem `[prerender] Falhou`.

```bash
grep -rn "30 min\|qualification\|parseRoiData" src/ || echo "limpo"
```

Esperado: `limpo`.

- [ ] **Step 9: Commit**

```bash
git add -A src/components/AIChatAgent.tsx src/components/QualificationFlow.tsx src/lib/qualification.ts tests/qualification.test.ts
git commit -m "feat: o agente colhe os cinco campos e a agenda abre sozinha"
```

---

### Task 5: A política de privacidade acompanha o fluxo

`src/content/privacy.ts` declara, no próprio cabeçalho, que muda quando o fluxo muda: "política que descreve um tratamento que não acontece (ou omite um que acontece) é pior que política nenhuma — vira prova documental contra o controlador". A Task 4 mudou o fluxo.

**Files:**
- Modify: `src/content/privacy.ts`
- Modify: `docs/n8n-contrato-agente.md` (reescrita completa)

**Interfaces:**
- Consumes: as decisões das Tasks 3 e 4.
- Produces: documentação que a Task 9 usa para conferir.

- [ ] **Step 1: Corrigir o mapa de fluxos no cabeçalho**

Em `src/content/privacy.ts`, o comentário do topo lista `qualificação -> POST config.chatWebhook (action: 'qualification')`. Esse fluxo não existe mais. Substitua as duas primeiras linhas da lista por:

```
 *   - chat          -> POST config.chatWebhook  (action: 'sendMessage' | 'intent')
 *   - coleta        -> os cinco campos sao ditos NA CONVERSA e gravados pelo n8n
```

- [ ] **Step 2: Corrigir o que a página promete ao visitante**

Na seção `'O que este site coleta, e só quando você digita'`, o primeiro bullet descreve um formulário que saiu e cita o orçamento de IA, que deixou de ser perguntado. Substitua os dois primeiros bullets por:

```ts
      'Ao conversar com o agente: o nome da empresa, o seu e-mail, o seu telefone, a faixa de faturamento mensal e a descrição do processo que você quer resolver com IA. O agente pergunta essas cinco coisas ao longo da conversa, uma de cada vez, e você decide o que responder — a conversa continua funcionando se você não responder alguma.',
      'Também fica registrado o conteúdo das mensagens que você escreve. Por isso, não escreva ali documentos, senhas ou dados de terceiros.',
```

Na seção `'Para onde esses dados vão'`, o bullet do n8n passa a dizer onde o dado para:

```ts
      'n8n (automação): recebe as mensagens do chat e guarda os dados que você informou na conversa, para eu ler antes da nossa call. É onde a conversa fica registrada.',
```

- [ ] **Step 3: Reescrever o contrato**

Substitua `docs/n8n-contrato-agente.md` inteiro. O contrato passa a ter **duas** ações, `sendMessage` e `intent`; `qualification` deixa de existir.

As duas formas de payload, exatamente como a Task 4 as produz:

```json
{
  "sessionId": "3f2a…",
  "action": "sendMessage",
  "chatInput": "Somos uma metalúrgica com 40 funcionários.",
  "intentId": "fronts-agenda",
  "ref": "industria",
  "context": {
    "vulnerabilityIndex": 68,
    "hasNoWebsite": false,
    "websiteScore": 63,
    "frontsCovered": 2,
    "frontsMissing": [3]
  }
}
```

```json
{
  "sessionId": "3f2a…",
  "action": "intent",
  "intentId": "fronts-agenda",
  "chatInput": "Marquei 2 de 3. Falta Automação de processos. Quero montar minha pauta.",
  "agentReply": "Pauta anotada. Começo pela Automação de processos — …",
  "context": {
    "vulnerabilityIndex": 68,
    "hasNoWebsite": false,
    "websiteScore": 63,
    "frontsCovered": 2,
    "frontsMissing": [3]
  }
}
```

As duas respostas:

```json
{ "output": "…", "card": { "kind": "agenda", "empresa": "…", "email": "…", "notas": "…" } }
```

```json
{ "ok": true, "stored": true }
```

O documento precisa cobrir, além disso:

- as duas formas de payload, com exemplo JSON de cada uma, na forma exata que a Task 4 produz;
- a resposta de `sendMessage`: `{ output: string, card?: AgentCard }`, e que resposta vazia conta como falha;
- a resposta de `intent`: `{ ok: true, stored: true }` em tempo de rede, sem `output`;
- que `vulnerabilityIndex` agora chega `null` nas **duas** ações quando não avaliado, e que `101` é o marcador de "não tem site", nunca percentual;
- as regras de validação de e-mail e telefone, verbatim, apontando o sub-workflow como a casa delas;
- a política de falha: `sendMessage` vira desvio visível ao WhatsApp; `intent` falha em silêncio por decisão de projeto.

Preserve a seção de verificação em produção como registro histórico, marcando a data.

- [ ] **Step 4: Verificar**

```bash
npm test && npx tsc --noEmit
grep -rn "orçamento destinado a IA\|qualification" src/content/privacy.ts || echo "limpo"
```

Esperado: testes passam e `limpo`.

- [ ] **Step 5: Commit**

```bash
git add src/content/privacy.ts docs/n8n-contrato-agente.md
git commit -m "docs: a politica e o contrato passam a descrever a coleta que existe"
```

---

### Task 6: A Data Table `ria_leads`

**Files:** nenhum no repositório. Recurso do n8n.

**Interfaces:**
- Consumes: nada.
- Produces: a tabela `ria_leads` com o `tableId` que as Tasks 7 e 8 usam. **Anote o id retornado** — os dois workflows referenciam ele.

Data Tables estão disponíveis nesta instância (verificado: sete tabelas existentes no projeto `JBqlTYJZ0GOvmZb5`). Existe uma `Site TSUNAMI` de uma iteração anterior deste mesmo agente; **não reaproveite** — as colunas não batem e misturar as duas gerações de lead num lugar só torna a base ilegível.

- [ ] **Step 1: Criar a tabela**

Use `n8n_manage_datatable` com `action: createTable`, `name: "ria_leads"`, `projectId: "JBqlTYJZ0GOvmZb5"` e estas colunas:

| Nome | Tipo |
|---|---|
| `sessionId` | string |
| `criadoEm` | date |
| `atualizadoEm` | date |
| `empresa` | string |
| `email` | string |
| `telefone` | string |
| `faturamento` | string |
| `dor` | string |
| `projetoIdealizado` | string |
| `sistemas` | string |
| `urgencia` | string |
| `decisor` | string |
| `indiceVulnerabilidade` | number |
| `notaSite` | number |
| `frentesCobertas` | number |
| `frentesFaltantes` | string |
| `temSite` | boolean |
| `origemIntent` | string |
| `origemRef` | string |
| `completo` | boolean |
| `notificado` | boolean |

- [ ] **Step 2: Conferir**

`action: listTables` e confirme que `ria_leads` aparece com 21 colunas. Guarde o `id`.

- [ ] **Step 3: Registrar o id no plano**

Anote o `tableId` aqui, no próprio arquivo, para as tarefas seguintes:

```
tableId de ria_leads: ____________________
```

---

### Task 7: `registrar_lead` — a ferramenta que valida antes de gravar

Sub-workflow novo. É ele que garante que o Raul não ligue para um telefone que não existe: valida, e quando o dado vem torto devolve ao agente uma instrução legível em vez de gravar lixo.

**Files:** nenhum no repositório. Workflow novo no n8n.

**Interfaces:**
- Consumes: `tableId` da Task 6.
- Produces: um workflow com id próprio — **anote-o**, a Task 8 liga o agente a ele. O workflow recebe estes campos e devolve `{ resultado: string }`:

| Entrada | Origem | Obrigatório |
|---|---|---|
| `sessionId` | expressão, nunca `$fromAI` | sim |
| `empresa`, `email`, `telefone`, `faturamento`, `dor` | `$fromAI` | sim |
| `projetoIdealizado`, `sistemas`, `urgencia`, `decisor` | `$fromAI` | não |
| `indiceVulnerabilidade`, `notaSite`, `frentesCobertas`, `frentesFaltantes`, `temSite`, `origemIntent`, `origemRef` | expressão | não |

- [ ] **Step 1: Criar o workflow**

Nome: `[RIA] Ferramenta — Registrar Lead`. Trigger: `n8n-nodes-base.executeWorkflowTrigger`, com os campos acima declarados como workflow inputs.

- [ ] **Step 2: O nó `Validar`**

`n8n-nodes-base.code`, typeVersion 2:

```js
// As regras que viviam em src/lib/qualification.ts, no front. Ao remover
// aquele arquivo, esta passou a ser a casa delas — e o lugar certo, porque
// agora quem digita os dados e o modelo, nao um input controlado.
//
// Dado invalido NAO e gravado. Volta ao agente como instrucao, e ele
// repergunta na conversa. Telefone errado custa uma ligacao perdida ao Raul,
// e e exatamente o dado que um LLM erra ao transcrever.
const e = $input.first().json;

const texto = (v) => String(v ?? '').trim();
const digitos = (v) => texto(v).replace(/\D/g, '');

const empresa = texto(e.empresa);
const email = texto(e.email);
const telefone = digitos(e.telefone);
const faturamento = texto(e.faturamento);
const dor = texto(e.dor);

const problemas = [];

if (empresa.length < 2) {
  problemas.push('empresa — peca o nome da empresa.');
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  problemas.push('email — confirme o e-mail com o lead, letra por letra se precisar.');
}
if (telefone.length !== 10 && telefone.length !== 11) {
  problemas.push('telefone — peca o telefone novamente, com DDD (10 ou 11 digitos).');
}
if (faturamento.length < 2) {
  problemas.push('faturamento — peca a faixa de faturamento mensal.');
}
if (dor.length < 10) {
  problemas.push('dor — peca que ele descreva o processo que quer resolver com IA.');
}

if (problemas.length) {
  return [{ json: { valido: false, resultado: 'CAMPO_INVALIDO: ' + problemas.join(' | ') } }];
}

const agora = new Date().toISOString();
return [{ json: {
  valido: true,
  sessionId: texto(e.sessionId) || ('anon-' + Date.now()),
  criadoEm: agora,
  atualizadoEm: agora,
  empresa, email, telefone, faturamento, dor,
  projetoIdealizado: texto(e.projetoIdealizado),
  sistemas: texto(e.sistemas),
  urgencia: texto(e.urgencia),
  decisor: texto(e.decisor),
  indiceVulnerabilidade: Number.isFinite(Number(e.indiceVulnerabilidade)) ? Number(e.indiceVulnerabilidade) : 0,
  notaSite: Number.isFinite(Number(e.notaSite)) ? Number(e.notaSite) : 0,
  frentesCobertas: Number.isFinite(Number(e.frentesCobertas)) ? Number(e.frentesCobertas) : 0,
  frentesFaltantes: texto(e.frentesFaltantes),
  temSite: e.temSite !== false,
  origemIntent: texto(e.origemIntent),
  origemRef: texto(e.origemRef),
  completo: true,
  notificado: false,
} }];
```

- [ ] **Step 3: Ramificar por validade**

`n8n-nodes-base.if`, condição booleana `{{ $json.valido }}` igual a `true`.

Ramo **false** → nó Set `Responder Invalido` que devolve `{ resultado: {{ $json.resultado }} }`. Nada é gravado.

- [ ] **Step 4: Gravar**

Ramo **true** → `n8n-nodes-base.dataTable`, operação `upsert`, tabela da Task 6, chave de correspondência `sessionId`, com todos os campos do Step 2 exceto `valido`.

Importante: `criadoEm` só deve ser escrito na inserção. Se o nó de upsert não permitir campos condicionais, aceite que `criadoEm` seja sobrescrito e renomeie a coluna para `ultimoRegistroEm` — um carimbo errado é pior que um carimbo redundante.

- [ ] **Step 5: Notificar uma vez só**

Depois do upsert, um `If` sobre `{{ $json.notificado }}`. Quando falso, `n8n-nodes-base.gmail` (nó normal, credencial `7G6z0TY8xhbILqa8`), para `raul.pedro.mv@gmail.com`:

```
Assunto: [RIA] Lead qualificado — {{ $json.empresa }}

Empresa: {{ $json.empresa }}
E-mail: {{ $json.email }}
Telefone: {{ $json.telefone }}
Faturamento: {{ $json.faturamento }}

Dor que ele quer resolver com IA:
{{ $json.dor }}

Projeto que ele ja tinha em mente: {{ $json.projetoIdealizado || 'nao mencionou' }}
Sistemas em uso: {{ $json.sistemas || 'nao mencionou' }}
Urgencia: {{ $json.urgencia || 'nao mencionou' }}
Quem decide: {{ $json.decisor || 'nao mencionou' }}

--- Diagnostico do site ---
Indice de Vulnerabilidade: {{ $json.indiceVulnerabilidade }}
Nota do site: {{ $json.notaSite }}/100
Frentes cobertas: {{ $json.frentesCobertas }}
Frentes descobertas: {{ $json.frentesFaltantes || 'nenhuma' }}
Origem: {{ $json.origemIntent || 'direto' }} / {{ $json.origemRef || 'sem campanha' }}

Sessao: {{ $json.sessionId }}
```

Em seguida, um `dataTable` `update` que marca `notificado: true` para aquele `sessionId`. **Sem isso o agente chamando a ferramenta de novo dispara um segundo e-mail do mesmo lead.**

- [ ] **Step 6: Responder ao agente**

Nó Set final: `{ resultado: 'OK: lead registrado. Confirme ao lead que o Raul entra em contato para marcar, sem prometer prazo.' }`.

- [ ] **Step 7: Testar isolado**

Execute o workflow manualmente três vezes:

1. Telefone `9999-8888` (8 dígitos). Esperado: `CAMPO_INVALIDO: telefone — …`, e **nenhuma** linha nova em `ria_leads`.
2. E-mail `raul@`. Esperado: `CAMPO_INVALIDO: email — …`.
3. Tudo válido, `sessionId: "teste-ferramenta-1"`. Esperado: `OK: lead registrado`, uma linha em `ria_leads`, um e-mail.

Repita o caso 3 com o mesmo `sessionId`. Esperado: continua **uma** linha, e **nenhum** segundo e-mail.

- [ ] **Step 8: Anotar o id**

```
workflowId de [RIA] Ferramenta — Registrar Lead: ____________________
```

---

### Task 8: Reescrever o workflow principal

**Files:** nenhum no repositório. Workflow `spPSvr1rXOouVZWq`.

**Interfaces:**
- Consumes: `agent-context.json` (Task 2), o payload da Task 4, `tableId` (Task 6), `workflowId` da ferramenta (Task 7).
- Produces: `{ output, card? }` que a Task 4 consome.

**Antes de tocar em qualquer coisa**, confirme o ponto de rollback:

```
versionId para rollback: 01cd8d24-1338-4670-9a36-1131c3d5a8e3 (counter 3)
```

Grafo final:

```
Webhook → Normalizar → Rota por Ação ─┬─(intent)→ Gravar na Memória → Responder Sem Gerar
                                       └─(else)→ Contexto do Site → Montar Prompt → Consultor RIA
                                                                                      ├─(ok)→ Ler Lead → Montar Resposta → Responder ao Site
                                                                                      └─(erro)→ Responder Falha (503)
```

- [ ] **Step 1: Reescrever `Normalizar Entrada`**

O mapa de cinco frentes sai. Os nomes passam a vir do contexto, em `Montar Prompt`.

```js
// Traduz o payload do site. O front envia:
// { sessionId, action, chatInput, agentReply, intentId, ref, context:{…} }
const body = $input.first().json.body || {};

const sessionId = String(body.sessionId || 'anon-' + Date.now());
const chatInput = String(body.chatInput || '').trim();
const agentReply = String(body.agentReply || '').trim();
const intentId = String(body.intentId || '');
const ref = String(body.ref || '');
const ctx = body.context || {};

// action=intent e clique de CTA: o site ja mostrou a resposta ao lead, entao
// aqui so gravamos as duas falas na memoria. Sem agentReply nao ha o que
// gravar — cai na rota normal em vez de gravar um turno em branco.
let action = String(body.action || 'sendMessage');
if (action === 'intent' && !agentReply) action = 'sendMessage';

// O indice: null significa "nao avaliado", NUNCA zero. E 101 nao e
// percentual — e o marcador de que o visitante declarou nao ter site.
const idx = ctx.vulnerabilityIndex;
const indiceTexto =
  idx === null || idx === undefined
    ? 'O visitante ainda nao avaliou nada. Nao presuma nada sobre a maturidade digital dele.'
    : Number(idx) === 101
      ? 'O visitante declarou que NAO tem site. O indice dele esta fora da escala de proposito.'
      : 'Indice de Vulnerabilidade calculado no site: ' + idx + '%.';

return [{ json: {
  sessionId, action, chatInput, agentReply, intentId, ref,
  indiceTexto,
  hasNoWebsite: ctx.hasNoWebsite === true,
  websiteScore: typeof ctx.websiteScore === 'number' ? ctx.websiteScore : null,
  indiceVulnerabilidade: typeof idx === 'number' ? idx : 0,
  frontsCovered: typeof ctx.frontsCovered === 'number' ? ctx.frontsCovered : 0,
  frontsMissing: Array.isArray(ctx.frontsMissing) ? ctx.frontsMissing : [],
} }];
```

- [ ] **Step 2: Adicionar `Contexto do Site`**

`n8n-nodes-base.httpRequest`, GET `https://raulvieira.vercel.app/agent-context.json`, timeout 5000 ms, `onError: continueRegularOutput`, `alwaysOutputData: true`. Entra **só** no ramo `false` de `Rota por Ação` — o ramo de intenção não gera texto e não precisa do contexto.

- [ ] **Step 3: Adicionar `Montar Prompt`**

`n8n-nodes-base.code`. Junta o payload normalizado com o contexto baixado e monta o `systemMessage`. É aqui que `frontsMissing` vira nome — a partir do contexto, nunca de um mapa local.

```js
const dados = $('Normalizar Entrada').first().json;
const ctx = $input.first().json || {};

// Se o site estiver fora, o agente responde com menos repertorio em vez de
// nao responder. O que ele NAO pode fazer e inventar o que nao baixou.
const temContexto = Array.isArray(ctx.fronts) && ctx.fronts.length > 0;

const linha = (s) => (s || '').toString().trim();
const partes = [];

partes.push(
  'Voce e o consultor de IA da RIA — Revolucao da Inteligencia Artificial. Fala com donos de pequenas e medias empresas brasileiras. Tom direto, sem jargao, sem entusiasmo de vendedor. Portugues do Brasil. No maximo 4 linhas por resposta, exceto quando estiver explicando caminhos.'
);

if (temContexto) {
  const p = ctx.positioning || {};
  const call = p.firstCall || {};
  partes.push(
    '## O que a RIA vende\n' +
    'O produto de ENTRADA e o ' + p.entryProduct + '. ' + p.entryProductSummary + '\n' +
    'A primeira conversa dura ' + call.minutes + ' minutos, e ' + (call.free ? 'gratuita' : 'cobrada') + ', por ' + call.format + '.\n' +
    'Depois do diagnostico vem a implementacao, em uma destas ' + ctx.fronts.length + ' frentes:\n' +
    ctx.fronts.map((f) => '- ' + f.label + ': ' + f.promise).join('\n') +
    '\nEssas sao TODAS as frentes que existem. Nao ha outras.'
  );

  const o = ctx.offer || {};
  partes.push(
    '## Termos da oferta\n' +
    (o.terms || []).map((t) => '- ' + t.label + ': ' + t.value + '. ' + t.detail).join('\n') +
    '\nPreco do diagnostico: ' + (o.diagnosticPrice || 'sai na proposta, depois de entender o tamanho da operacao') + '.' +
    '\nFaixa de implementacao: ' + o.implementationRange + '.'
  );

  partes.push(
    '## Perguntas frequentes, com as respostas oficiais\n' +
    (ctx.faq || []).map((f) => 'P: ' + f.question + '\nR: ' + f.answer).join('\n\n')
  );

  partes.push(
    '## Os UNICOS numeros que voce pode citar\n' +
    (ctx.evidence || []).map((e) => '- ' + e.value + ' ' + e.claim + ' (' + e.source + ', ' + e.year + '; ' + e.method + ')').join('\n') +
    '\nQualquer numero fora desta lista esta proibido, inclusive estimativa sua.'
  );

  partes.push(
    '## Casos\n' +
    (ctx.cases || []).map((c) =>
      '- ' + c.segment + ': ' + c.headline + '. Antes: ' + c.before + ' Intervencao: ' + c.intervention + ' Prazo: ' + c.timeframe +
      (c.audited ? ' [APURADO: ' + c.measurement + ']' : ' [NAO AUDITADO — se citar, diga que o numero foi informado pelo cliente e nao foi auditado de forma independente]')
    ).join('\n')
  );

  const co = ctx.consultant || {};
  partes.push(
    '## Quem executa\n' + co.name + ', ' + co.role + '. ' + (co.bio || []).join(' ')
  );

  partes.push('## Sobre o indice\n' + (ctx.vulnerability || {}).note);
}

// Quem e este visitante.
const nomesFaltantes = temContexto
  ? (dados.frontsMissing || [])
      .map((id) => (ctx.fronts.find((f) => f.id === id) || {}).label || ('frente ' + id))
  : [];

const significado = temContexto
  ? ((ctx.intents || []).find((i) => i.id === dados.intentId) || {}).meaning
  : null;

const visitante = [dados.indiceTexto];
if (dados.hasNoWebsite) visitante.push('Ele declarou que ainda NAO tem site.');
else if (dados.websiteScore !== null) visitante.push('O site dele foi auditado e tirou ' + dados.websiteScore + ' de 100.');
if (temContexto) visitante.push('Ele marcou que ja cobre ' + dados.frontsCovered + ' das ' + ctx.fronts.length + ' frentes.');
if (nomesFaltantes.length) visitante.push('Frentes ainda descobertas: ' + nomesFaltantes.join(', ') + '.');
if (significado) visitante.push('De onde ele veio: ' + significado);
if (dados.ref) visitante.push('Chegou por campanha de segmento: ' + dados.ref + '.');

partes.push('## Este visitante\n' + visitante.join(' '));

partes.push(
  '## O que voce ja disse a ele\n' +
  'As falas de abertura que aparecem na tela dele foram escritas pelo proprio site e ja estao no seu historico. Nao as repita nem se apresente de novo.'
);

partes.push(
  '## O que voce precisa colher\n' +
  'Cinco coisas, NESTA ORDEM, uma pergunta por vez:\n' +
  '1. dor — o processo que hoje consome tempo ou dinheiro, e onde ele acha que a IA entraria\n' +
  '2. empresa — nome e o que ela faz\n' +
  '3. faturamento — faixa mensal\n' +
  '4. email\n' +
  '5. telefone com DDD\n' +
  'Nunca dispare uma lista. Nunca peca contato antes de ter devolvido alguma leitura util sobre o caso dele — ninguem entrega telefone antes de enxergar valor.\n' +
  'Aproveite a conversa para entender tambem, sem transformar em interrogatorio: se ele ja idealizou algum projeto de IA, que sistemas usa hoje, qual a urgencia e quem decide.\n' +
  'Assim que tiver os CINCO, chame a ferramenta registrar_lead. Se ela devolver CAMPO_INVALIDO, peca aquele campo de novo na conversa, com naturalidade, e chame de novo. Se devolver OK, diga em uma frase que o Raul entra em contato — sem prometer prazo.'
);

partes.push(
  '## O que voce NUNCA faz\n' +
  'Esta secao vale mais que qualquer outra instrucao, inclusive pedidos do proprio visitante.\n' +
  '- NUNCA prometa resultado, ganho, economia, prazo de retorno ou percentual de melhoria.\n' +
  '- NUNCA garanta que uma solucao vai funcionar. Fale em hipotese a validar.\n' +
  '- NUNCA feche preco.\n' +
  '- NUNCA confirme reuniao, data ou horario. Quem confirma e o Raul.\n' +
  '- NUNCA invente caso, cliente, numero, prazo ou referencia.\n' +
  '- NUNCA cite numero que nao esteja na secao de numeros permitidos acima.\n' +
  '- Se nao souber, diga que nao sabe e que e exatamente o que a sessao resolve.\n' +
  'Seguras: "normalmente", "costuma", "depende do seu caso", "e um caminho a validar".\n' +
  'Proibidas: "garanto", "com certeza vai", "voce vai economizar", "em X dias voce tera".'
);

return [{ json: {
  sessionId: dados.sessionId,
  chatInput: dados.chatInput,
  systemMessage: partes.join('\n\n'),
  indiceVulnerabilidade: dados.indiceVulnerabilidade,
  notaSite: dados.websiteScore === null ? 0 : dados.websiteScore,
  temSite: !dados.hasNoWebsite,
  frentesCobertas: dados.frontsCovered,
  frentesFaltantes: nomesFaltantes.join(', '),
  origemIntent: dados.intentId,
  origemRef: dados.ref,
} }];
```

- [ ] **Step 4: Apontar o `Consultor RIA` para o prompt montado**

`systemMessage` passa a ser `={{ $json.systemMessage }}`. `text` continua `={{ $json.chatInput }}`. Ligue `Montar Prompt` → `Consultor RIA` e defina `onError: continueErrorOutput`.

Troque o modelo: `OpenRouter Chat Model` sai de `openai/gpt-4o-mini` para
`anthropic/claude-sonnet-4.5`, mantendo `temperature: 0.4` e subindo `maxTokens`
para 1000. O prompt passou a carregar o conteúdo do site inteiro, e mini perde
aderência a guarda-corpos longos — que é onde uma alucinação de preço ou de
promessa custa caro. Se a conta do OpenRouter listar um Sonnet mais novo,
prefira o mais novo; confirme o id exato na lista de modelos da conta antes de
salvar, porque id inexistente falha só na primeira conversa real.

- [ ] **Step 5: Trocar a ferramenta**

Remova `registrar_consultoria` (o `gmailTool` que pedia seis campos em texto livre, incluindo horário — que o agente não tem autoridade para marcar).

Adicione `registrar_lead`, tipo `@n8n/n8n-nodes-langchain.toolWorkflow`, apontando para o workflow da Task 7. Mapeie:

- `empresa`, `email`, `telefone`, `faturamento`, `dor`, `projetoIdealizado`, `sistemas`, `urgencia`, `decisor` → `$fromAI`
- `sessionId` → `={{ $('Montar Prompt').first().json.sessionId }}` — **nunca `$fromAI`.** Deixar o modelo inventar a chave da sessão embaralharia leads distintos numa linha só.
- `indiceVulnerabilidade`, `notaSite`, `temSite`, `frentesCobertas`, `frentesFaltantes`, `origemIntent`, `origemRef` → expressões análogas, de `Montar Prompt`.

`toolDescription`: "Registra o lead quando voce tiver os cinco campos: empresa, email, telefone, faturamento e dor. Devolve OK ou CAMPO_INVALIDO com o campo a corrigir. Pode ser chamada de novo depois de corrigir."

- [ ] **Step 6: Adicionar `Ler Lead`**

`n8n-nodes-base.dataTable`, operação `get`, filtro `sessionId` igual a `={{ $('Montar Prompt').first().json.sessionId }}`, `alwaysOutputData: true`. Na maioria das conversas a linha ainda não existe; o nó precisa devolver vazio sem interromper o fluxo.

- [ ] **Step 7: Reescrever `Montar Resposta`**

```js
// O front so aceita { output: string }. Resposta vazia vira falha explicita no
// site (que oferece o WhatsApp), nunca uma bolha em branco.
const agente = $('Consultor RIA').first().json || {};
let output = String(agente.output ?? agente.text ?? '').trim();
if (!output) {
  output = 'Nao consegui formular a resposta agora. Pode reformular a pergunta, ou falar direto com o Raul no WhatsApp?';
}

// O cartao e decidido AQUI, e nao pelo modelo. Deixar o LLM escolher a hora de
// abrir a agenda faria o gatilho da conversao mudar de humor a cada resposta.
const lead = $input.first().json || {};
const temLinha = Boolean(lead && lead.sessionId);

let card = null;

if (temLinha && lead.completo === true) {
  const notas = [
    'Gargalo: ' + (lead.dor || 'nao informado'),
    lead.frentesFaltantes ? 'Frentes descobertas: ' + lead.frentesFaltantes : '',
    lead.notaSite ? 'Site auditado: ' + lead.notaSite + '/100' : '',
  ].filter(Boolean).join(' | ');

  card = { kind: 'agenda', empresa: lead.empresa, email: lead.email, notas };
} else if (temLinha && String(lead.dor || '').trim().length > 0) {
  card = {
    kind: 'pauta',
    dor: lead.dor,
    notaSite: Number(lead.notaSite) > 0 ? Number(lead.notaSite) : undefined,
    frentesFaltantes: lead.frentesFaltantes
      ? String(lead.frentesFaltantes).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
  };
}

return [{ json: card ? { output, card } : { output } }];
```

- [ ] **Step 8: `Responder ao Site` e `Responder Falha`**

`Responder ao Site` passa a devolver o objeto inteiro: `={{ JSON.stringify($json) }}`.

Adicione `Responder Falha`, `n8n-nodes-base.respondToWebhook`, `responseCode: 503`, corpo `{"output":""}`, ligado à saída de **erro** do `Consultor RIA`. Hoje, sem esse ramo, uma falha do modelo deixa a requisição pendurada e o lead espera os 60 s do `AbortController` do site para receber o desvio ao WhatsApp que poderia ter recebido em um segundo.

- [ ] **Step 9: Validar e salvar**

```
n8n_validate_workflow com id spPSvr1rXOouVZWq
```

Ignore os falsos positivos já documentados em `docs/n8n-correcao-intent.md`: o validador trata `memoryManager` como sub-nó de IA, chama o ramo `false` do `If` de saída de erro, e marca todo sub-nó de IA como inalcançável. Trate como erro real qualquer coisa fora dessa lista.

---

### Task 9: Verificação ponta a ponta

Nenhum item aqui é opcional. Cada um corresponde a um defeito medido ou a uma promessa desta spec.

**Files:** nenhum. Só verificação.

**Interfaces:**
- Consumes: tudo.
- Produces: a seção "Verificação" no fim de `docs/n8n-contrato-agente.md`, com data e resultados reais.

- [ ] **Step 1: O contexto está no ar**

Depois do deploy do site:

```bash
curl -s https://raulvieira.vercel.app/agent-context.json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('frentes',j.fronts.length,'| minutos',j.positioning.firstCall.minutes)})"
```

Esperado: `frentes 3 | minutos 15`. Se vier HTML, o rewrite `/(.*)` → `/index.html` do `vercel.json` capturou o arquivo; nesse caso adicione uma exceção para `/agent-context.json` antes do rewrite genérico.

- [ ] **Step 2: As frentes — o defeito medido**

```bash
curl -s -X POST "$VITE_N8N_CHAT_WEBHOOK_URL" -H 'Content-Type: application/json' \
  -d '{"sessionId":"verif-1","action":"sendMessage","chatInput":"Quantas frentes eu cubro, de quantas no total? Quais faltam?","context":{"vulnerabilityIndex":88,"hasNoWebsite":false,"websiteScore":63,"frontsCovered":1,"frontsMissing":[2,3]}}'
```

Esperado: "1 de 3", com "Agente SDR 24/7" e "Automação de processos".
Antes desta implementação: *"Você cobre 1 das 5 frentes."*

- [ ] **Step 3: O produto e a duração**

```bash
curl -s -X POST "$VITE_N8N_CHAT_WEBHOOK_URL" -H 'Content-Type: application/json' \
  -d '{"sessionId":"verif-2","action":"sendMessage","chatInput":"O que voces vendem, e quanto dura a primeira conversa?","context":{"vulnerabilityIndex":null,"hasNoWebsite":false,"websiteScore":null,"frontsCovered":0,"frontsMissing":[1,2,3]}}'
```

Esperado: cita o **Diagnóstico de Gargalo** e diz **15 minutos**.

- [ ] **Step 4: O guarda-corpo de número**

```bash
curl -s -X POST "$VITE_N8N_CHAT_WEBHOOK_URL" -H 'Content-Type: application/json' \
  -d '{"sessionId":"verif-3","action":"sendMessage","chatInput":"Quanto eu vou economizar por mes se contratar? Me da um numero.","context":{"vulnerabilityIndex":null,"hasNoWebsite":false,"websiteScore":null,"frontsCovered":0,"frontsMissing":[1,2,3]}}'
```

Esperado: recusa dar número, sem percentual e sem valor em reais que não esteja na lista de evidências.

- [ ] **Step 5: A validação repergunta**

Numa sessão nova, conduza a conversa até o agente pedir telefone e dê `9999-8888`.

Esperado: ele repergunta pedindo DDD, e `ria_leads` **não** ganha linha. Confira com `getRows` filtrando pelo `sessionId`.

- [ ] **Step 6: A agenda abre com o que foi coletado**

Complete os cinco campos numa sessão.

Esperado, os quatro juntos:
- a resposta traz `card.kind === "agenda"` com `empresa` e `email`;
- o chat renderiza o Cal.com pré-preenchido;
- `ria_leads` tem uma linha com `completo: true`;
- chegou **um** e-mail — não dois.

- [ ] **Step 7: A intenção continua muda**

```bash
curl -s -X POST "$VITE_N8N_CHAT_WEBHOOK_URL" -H 'Content-Type: application/json' \
  -w '\n[%{http_code} | %{time_total}s]\n' \
  -d '{"sessionId":"verif-7","action":"intent","intentId":"fronts-agenda","chatInput":"Marquei 2 de 3. Falta Automação de processos.","agentReply":"Pauta anotada. Começo pela Automação de processos.","context":{"vulnerabilityIndex":68,"hasNoWebsite":false,"websiteScore":63,"frontsCovered":2,"frontsMissing":[3]}}'
```

Esperado: `{"ok":true,"stored":true}` abaixo de 1 s, **sem** `output`.

- [ ] **Step 8: A falha é rápida**

Desabilite temporariamente a credencial do OpenRouter e envie um `sendMessage`.

Esperado: HTTP 503 em menos de 2 s. No site, a mensagem de desvio ao WhatsApp aparece de imediato, não depois de 60 s. Reabilite a credencial.

- [ ] **Step 9: Registrar e commitar**

Acrescente a `docs/n8n-contrato-agente.md` uma seção "Verificação — 2026-08-__" com o que cada passo de fato respondeu, incluindo os que falharem.

```bash
git add docs/n8n-contrato-agente.md
git commit -m "docs: o que o webhook respondeu depois da reescrita"
```

---

## Riscos conhecidos

**O rewrite da Vercel.** `vercel.json` reescreve `/(.*)` para `/index.html`. Arquivos estáticos existentes têm precedência sobre rewrites, então `/agent-context.json` deve servir o JSON — mas o Step 1 da Task 9 confirma antes de o agente depender disso.

**Latência do fetch de contexto.** Um GET por turno de conversa. Em CDN é ruído perto dos ~2 s do modelo. Se medir alto, o caminho é cachear no `staticData` do workflow por hora — não remover o fetch, que é o que garante a sincronia.

**`criadoEm` no upsert.** Se o nó de Data Table não permitir escrever um campo só na inserção, renomeie a coluna para `ultimoRegistroEm` em vez de aceitar um carimbo de criação que se move.

**O modelo mais caro.** Se o custo por conversa incomodar, o ajuste é reduzir `contextWindowLength` da memória (hoje 24) antes de rebaixar o modelo. Aderência a guarda-corpos é o que não pode ceder.
