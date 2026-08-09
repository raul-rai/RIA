# RIA — Camada 0 (Fundação) + Camada 1 (Motor) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o build verde e a base limpa, e substituir o avanço de cenas por temporizador por um scroll nativo em que a onda 3D é dirigida pelo gesto do usuário — sem nenhuma mudança estética.

**Architecture:** O `NarrativeScroll` deixa de ser um trocador de cenas e some; os 7 capítulos passam a coexistir no documento com `scroll-snap`. O progresso da onda deixa de ser `useState` e passa a ser um `MotionValue` de `useScroll()`, lido diretamente dentro do `requestAnimationFrame` do canvas — o React sai do caminho quente. Um `IntersectionObserver` cuida apenas do que muda em fronteira de capítulo (HUD, fundo, `document.title`).

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, `motion` 12 (`useScroll`, `MotionValue`), Vitest 4, Playwright (novo, só para o smoke).

## Global Constraints

- Spec de referência: `docs/superpowers/specs/2026-08-09-ria-premium-design.md`. Em conflito, o spec vence.
- Branch de trabalho: `feat/premium-overhaul`. A `main` precisa continuar publicável — o site é usado em demos ao vivo.
- **Nenhuma mudança estética nesta rodada.** Cores, tipografia, espaçamentos e copy ficam exatamente como estão. Layout só muda no que for consequência inevitável do scroll nativo. A estética é a Camada 2.
- Cor de destaque continua `#00E5FF` (token `--color-accent`). Não introduzir `--color-cta` nem `#2a42ec` — a unificação de marca é decisão D-05, executada na Camada 2.
- Malha do canvas em qualidade alta permanece `45 × 55` (colunas × linhas), idêntica à atual. Os níveis inferiores são novos.
- `scroll-snap-type` é **`proximity`**, nunca `mandatory`.
- Alturas de capítulo usam `100svh`, nunca `100vh`.
- Todo texto visível ao usuário em português do Brasil.
- Comandos: `npm run lint` (tsc), `npm test` (vitest), `npm run build` (vite).
- Ao final de cada task os três comandos acima precisam sair com código 0 antes do commit.

---

## Estrutura de arquivos

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `src/config.ts` | Fonte única dos endpoints n8n vindos de env |
| `src/lib/canvas-quality.ts` | Funções puras: escolha de nível de LOD, teto de DPR, medidor de FPS |
| `src/hooks/useActiveChapter.ts` | `IntersectionObserver` → índice do capítulo visível |
| `src/components/ChapterSection.tsx` | Um capítulo: `100svh`, `scroll-snap-align`, ref para o observer |
| `src/components/FloatingCTA.tsx` | Botão persistente de WhatsApp |
| `src/components/ChapterNav.tsx` | Os dots, agora como `<nav>` acessível |
| `tests/config.test.ts` | Guarda contra endpoint/telefone cravado no código |
| `tests/canvas-quality.test.ts` | Unitários das funções puras do canvas |
| `e2e/smoke.spec.ts` | Smoke Playwright da travessia dos 7 capítulos |
| `playwright.config.ts` | Configuração do smoke |

**Modificados:** `tsconfig.json`, `vitest.config.ts`, `vite.config.ts`, `package.json`, `README.md`, `index.html`, `src/index.css`, `src/constants/links.ts`, `src/pages/LandingPage.tsx`, `src/pages/OndaPage.tsx`, `src/components/DataWave3D.tsx`, `src/components/AIChatAgent.tsx`, `src/components/PotentialDiagnostic.tsx`, `tests/brand.test.ts`, `.env.example`

**Apagados:** `src/components/NarrativeScroll.tsx` e os 11 componentes órfãos da v1.

---

## Task 1: Build verde

Hoje `npm run lint` e `npm test` falham. Nada mais pode ser verificado enquanto isso for verdade.

**Files:**
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts:7`
- Modify: `tests/brand.test.ts:8-10`

**Interfaces:**
- Consumes: nada
- Produces: `npm run lint` e `npm test` com código 0 — pré-requisito de toda task seguinte

- [ ] **Step 1: Rodar os comandos e registrar as falhas atuais**

```bash
npm run lint
```
Esperado: FALHA com exatamente dois erros —
`src/components/PotentialDiagnostic.tsx(42,38): error TS2339: Property 'env' does not exist on type 'ImportMeta'.`
e `vitest.config.ts(7,5): error TS2769: ... 'reporter' does not exist in type 'InlineConfig'. Did you mean to write 'reporters'?`

```bash
npm test
```
Esperado: FALHA, `Tests 1 failed | 11 passed (12)`, em `tests/brand.test.ts:9`.

- [ ] **Step 2: Ensinar o TypeScript sobre `import.meta.env`**

Em `tsconfig.json`, dentro de `compilerOptions`, logo após a linha `"lib"`, adicionar:

```json
    "types": ["vite/client"],
```

- [ ] **Step 3: Corrigir o nome da opção do Vitest**

`vitest.config.ts` inteiro passa a ser:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['verbose'],
  },
});
```

- [ ] **Step 4: Ajustar o teste de marca para afirmar o que existe**

`tests/brand.test.ts:8-10` procura `--color-cta: #2a42ec`, token que nunca foi criado e cuja cor a decisão D-05 aposenta. Substituir **apenas esse bloco `it`** por:

```ts
  it('BRAND-01: --color-accent token is defined in @theme', () => {
    expect(css).toContain('--color-accent: #00E5FF');
  });
```

O restante do arquivo (os dois testes de `og-image.png`) fica intacto. Este arquivo será reescrito como `tests/tokens.test.ts` na Camada 2 — aqui ele só deixa de mentir.

- [ ] **Step 5: Verificar que tudo passa**

```bash
npm run lint
```
Esperado: sem saída, código 0.

```bash
npm test
```
Esperado: `Tests 12 passed (12)`.

```bash
npm run build
```
Esperado: `✓ built in ...`.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json vitest.config.ts tests/brand.test.ts
git commit -m "fix: corrigir erros de tipo e teste de marca defasado"
```

---

## Task 2: Configuração única de endpoints

O webhook do chat está cravado em `AIChatAgent.tsx:16` apontando para `libra-credito-n8n.usybav.easypanel.host` (host de outro projeto), enquanto o diagnóstico lê de env. O telefone do WhatsApp está cravado em `LandingPage.tsx:387` apesar de `links.ts` existir para isso.

**Files:**
- Create: `src/config.ts`
- Create: `tests/config.test.ts`
- Modify: `src/constants/links.ts`
- Modify: `src/components/AIChatAgent.tsx:11-16`
- Modify: `src/components/PotentialDiagnostic.tsx:42-48`
- Modify: `src/pages/LandingPage.tsx:385-388`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nada
- Produces:
  - `config.chatWebhook: string` e `config.diagnosticWebhook: string` de `src/config.ts`
  - `whatsappWithMessage(message: string): string` de `src/constants/links.ts`

- [ ] **Step 1: Escrever o teste de guarda que falha**

Criar `tests/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const SRC = resolve(process.cwd(), 'src');
const ALLOWED_PHONE = resolve(SRC, 'constants', 'links.ts');
const ALLOWED_WEBHOOK = resolve(SRC, 'config.ts');

describe('CONFIG: endpoints e contatos nao ficam cravados no codigo', () => {
  it('CONFIG-01: o telefone do WhatsApp so aparece em constants/links.ts', () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => f !== ALLOWED_PHONE)
      .filter((f) => readFileSync(f, 'utf-8').includes('5516997879837'));
    expect(offenders).toEqual([]);
  });

  it('CONFIG-02: nenhuma URL de webhook aparece fora de config.ts', () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => f !== ALLOWED_WEBHOOK)
      .filter((f) => /https?:\/\/[^\s'"]*(webhook|easypanel)/i.test(readFileSync(f, 'utf-8')));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/config.test.ts
```
Esperado: FALHA nos dois testes — CONFIG-01 acusando `src/pages/LandingPage.tsx`, CONFIG-02 acusando `src/components/AIChatAgent.tsx`.

- [ ] **Step 3: Criar `src/config.ts`**

```ts
// src/config.ts
// Fonte unica dos endpoints externos. Nenhuma URL de servico deve existir
// em qualquer outro arquivo de src/ — tests/config.test.ts garante isso.

function readEnv(value: string | undefined, name: string): string {
  if (!value) {
    console.warn(`[RIA] Variavel de ambiente ausente: ${name}`);
    return '';
  }
  return value;
}

export const config = {
  chatWebhook: readEnv(
    import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL,
    'VITE_N8N_CHAT_WEBHOOK_URL'
  ),
  diagnosticWebhook: readEnv(
    import.meta.env.VITE_N8N_DIAGNOSTIC_WEBHOOK_URL,
    'VITE_N8N_DIAGNOSTIC_WEBHOOK_URL'
  ),
} as const;
```

- [ ] **Step 4: Adicionar o construtor de mensagem em `links.ts`**

Acrescentar ao final de `src/constants/links.ts`:

```ts
/** WhatsApp com mensagem livre — usado pelo resultado do chat/diagnostico */
export const whatsappWithMessage = (message: string): string =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
```

- [ ] **Step 5: Ligar o chat à configuração**

Em `src/components/AIChatAgent.tsx`, adicionar o import no topo:

```tsx
import { config } from '../config';
```

E trocar a assinatura da linha 16, que hoje é `({ webhookUrl = "https://libra-credito-n8n...", onComplete })`, por:

```tsx
export default function AIChatAgent({ webhookUrl = config.chatWebhook, onComplete }: AIChatAgentProps) {
```

- [ ] **Step 6: Ligar o diagnóstico à configuração**

Em `src/components/PotentialDiagnostic.tsx`, adicionar o import no topo:

```tsx
import { config } from '../config';
```

E substituir as linhas 42-48 (o bloco que lê `import.meta.env.VITE_N8N_WEBHOOK_URL` e testa por `"COLOQUE_A_URL"`) por:

```tsx
      const webhookUrl = config.diagnosticWebhook;

      if (!webhookUrl) {
        throw new Error('Diagnostico indisponivel no momento.');
      }
```

- [ ] **Step 7: Ligar o WhatsApp final a `links.ts`**

Em `src/pages/LandingPage.tsx`, adicionar o import:

```tsx
import { whatsappWithMessage } from '../constants/links';
```

E substituir o corpo de `handleFinalContact` (linhas 385-388) por:

```tsx
  const handleFinalContact = useCallback((data: any) => {
    const message = [
      'Ola! Realizei o diagnostico via chat RIA.',
      '',
      `Nome: ${data.name}`,
      `Faturamento: R$ ${data.revenue.toLocaleString()}/mes`,
      `ROI Projetado: R$ ${data.roi.toLocaleString()}/ano`,
      `Eficiencia: +${data.efficiency}%`,
      '',
      'Quero agendar minha sessao estrategica para escalar esses numeros.',
    ].join('\n');
    window.open(whatsappWithMessage(message), '_blank');
  }, []);
```

Isto também corrige um defeito real: a versão atual monta `%0A` e `%25` à mão sem passar por `encodeURIComponent`, então um nome contendo `&` ou `#` quebra a URL.

- [ ] **Step 8: Documentar as variáveis**

Substituir o conteúdo de `.env.example` por:

```
# Webhook do agente de chat (n8n)
VITE_N8N_CHAT_WEBHOOK_URL="https://exemplo.n8n.host/webhook/chat"

# Webhook do diagnostico de site (n8n)
VITE_N8N_DIAGNOSTIC_WEBHOOK_URL="https://exemplo.n8n.host/webhook/diagnostico"
```

- [ ] **Step 9: Migrar o `.env` local**

O `.env` local hoje tem `VITE_N8N_WEBHOOK_URL`. Renomeá-la para `VITE_N8N_DIAGNOSTIC_WEBHOOK_URL` e acrescentar `VITE_N8N_CHAT_WEBHOOK_URL` com o valor que estava cravado em `AIChatAgent.tsx:16`:

```
VITE_N8N_CHAT_WEBHOOK_URL="https://libra-credito-n8n.usybav.easypanel.host/webhook/n8n"
```

`.env` é ignorado pelo git — esta edição é local e não entra no commit.

- [ ] **Step 10: Verificar**

```bash
npx vitest run tests/config.test.ts
```
Esperado: 2 testes passando.

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

- [ ] **Step 11: Verificar no navegador que chat e diagnóstico ainda respondem**

```bash
npm run dev
```
Abrir `http://localhost:3000`, chegar ao capítulo do chat, enviar uma mensagem e confirmar que a resposta do n8n chega. Depois usar o diagnóstico com um domínio qualquer e confirmar que a varredura responde.

- [ ] **Step 12: Commit**

```bash
git add src/config.ts tests/config.test.ts src/constants/links.ts src/components/AIChatAgent.tsx src/components/PotentialDiagnostic.tsx src/pages/LandingPage.tsx .env.example
git commit -m "refactor: centralizar endpoints n8n e WhatsApp em configuracao unica"
```

---

## Task 3: Remover código e assets mortos

11 componentes sem nenhuma referência (1.146 das 3.381 linhas) e 4,0 MB de imagem que vai para o deploy sem ser usada.

**Files:**
- Delete: `src/components/{About,ExperienceRIA,FinalCTA,Footer,Hero,LeadDiagnostic,MicroProof,Navbar,Services,TheChoice,WhyNow}.tsx`
- Delete: `public/rio-realss.png`, `public/cyberpunk_scene.png`
- Modify: `package.json`, `vite.config.ts:10-12`

**Interfaces:**
- Consumes: nada
- Produces: `src/components/` contendo apenas os 9 componentes vivos

- [ ] **Step 1: Confirmar que os 11 estão mesmo órfãos**

```bash
for n in About ExperienceRIA FinalCTA Footer Hero LeadDiagnostic MicroProof Navbar Services TheChoice WhyNow; do echo -n "$n: "; grep -rl "from '.*$n'" src/ | grep -v "components/$n.tsx" | wc -l; done
```
Esperado: `0` para todos os onze. Se algum vier diferente de zero, **parar e reportar** em vez de apagar.

- [ ] **Step 2: Apagar os componentes**

```bash
git rm src/components/About.tsx src/components/ExperienceRIA.tsx src/components/FinalCTA.tsx src/components/Footer.tsx src/components/Hero.tsx src/components/LeadDiagnostic.tsx src/components/MicroProof.tsx src/components/Navbar.tsx src/components/Services.tsx src/components/TheChoice.tsx src/components/WhyNow.tsx
```

`src/constants/links.ts` **não** é apagado — era importado só por estes, mas a Task 2 o tornou a fonte do WhatsApp.

- [ ] **Step 3: Apagar os assets mortos**

```bash
git rm public/rio-realss.png public/cyberpunk_scene.png
```

Confirmar antes que nada os referencia:
```bash
grep -rn "rio-realss\|cyberpunk_scene" src/ index.html scripts/
```
Esperado: nenhuma saída.

- [ ] **Step 4: Remover as dependências mortas**

```bash
npm uninstall @google/genai express @types/express dotenv autoprefixer
```

`autoprefixer` sai porque o Tailwind 4 já faz prefixação via Lightning CSS. `@google/genai` sai porque nada no projeto usa Gemini.

- [ ] **Step 5: Remover a injeção da chave Gemini do bundle**

Em `vite.config.ts`, apagar o bloco inteiro:

```ts
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
```

Com ele some também o único uso de `loadEnv`, então a linha `const env = loadEnv(mode, '.', '');` sai junto e o import passa a ser `import { defineConfig } from 'vite';`. O arquivo final:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR desativado no AI Studio via DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
```

- [ ] **Step 6: Verificar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

**Sobre o tamanho do bundle:** ele **não** vai encolher, e isso é o comportamento correto. Os 11 componentes não eram importados por ninguém, então o Vite já os removia por tree-shaking — nunca estiveram no bundle. Os ganhos reais desta task são outros e devem ser medidos assim:

- `dist/` encolhe ~3,8 MB (as duas imagens saíram do deploy)
- `node_modules` perde 5 dependências
- a chave `GEMINI_API_KEY` deixa de poder vazar para o bundle do cliente
- 2.612 linhas a menos para manter

Quem reduz o JS é a Task 11, via code splitting, contra o orçamento de < 200 kB gzip.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: remover codigo, assets e dependencias mortos da v1"
```

Os `git rm` dos steps anteriores já colocaram as remoções no stage. **Não use `git add -A`** — há arquivos no working tree que não pertencem a este trabalho.

---

## Task 4: Higiene do repositório

**Files:**
- Modify: `package.json`, `README.md`, `index.html:129-137`, `scripts/optimize-images.js:12`
- Modify: `src/components/AIChatAgent.tsx`, `src/components/PotentialDiagnostic.tsx` (remoção de `console.log`)

**Interfaces:**
- Consumes: nada
- Produces: nada

- [ ] **Step 1: Corrigir identidade e script de limpeza do pacote**

Em `package.json`: `"name": "ria-landing"`, `"version": "1.0.0"`, e o script `clean` (hoje `rm -rf dist`, que não roda em PowerShell) passa a:

```json
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
```

- [ ] **Step 2: Remover os `console.log` de produção**

São 8 no total. Dois deles vazam dados: `PotentialDiagnostic.tsx:44` imprime a URL do webhook no console, e `AIChatAgent.tsx:46` imprime o texto digitado pelo visitante.

Apagar todas as chamadas `console.log` de `src/components/AIChatAgent.tsx` e `src/components/PotentialDiagnostic.tsx`. **Manter** os `console.error` dos blocos `catch` — eles servem a diagnóstico real.

Verificar:
```bash
grep -rn "console.log" src/
```
Esperado: nenhuma saída.

- [ ] **Step 3: Remover o listener de `blur` do título**

Em `index.html`, apagar o bloco `<script>` inteiro das linhas 129-137 (o que troca o título por `"⚠️ O Tsunami não espera..."`). Ele sobrescreve o título por capítulo definido em `LandingPage.tsx:379` e desgasta a marca junto ao público executivo.

- [ ] **Step 4: Corrigir a referência morta no script de imagens**

`scripts/optimize-images.js:12` lista `'rio-real.png'`, que não existe mais em `public/` (só o `.webp`). Trocar o array por `[]` acompanhado do comentário `// Sem PNGs pendentes de conversao no momento.`, mantendo o script disponível para uso futuro.

- [ ] **Step 5: Reescrever o README**

Substituir o template do AI Studio por:

```markdown
# RIA — Revolução da Inteligência Artificial

Landing page de conversão para consultoria de IA. React 19 + Vite 6 + Tailwind 4 + Motion.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencher os dois webhooks n8n
npm run dev
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm run lint` | Checagem de tipos (`tsc --noEmit`) |
| `npm test` | Testes de contrato (Vitest) |

## Estrutura

- `src/pages/LandingPage.tsx` — a narrativa de 7 capítulos
- `src/components/DataWave3D.tsx` — o tsunami em canvas, dirigido pelo scroll
- `src/config.ts` — endpoints n8n (única fonte)
- `src/constants/links.ts` — contatos (única fonte)
- `docs/superpowers/specs/` — decisões de design
```

- [ ] **Step 6: Verificar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: higiene de repositorio, logs e README"
```

---

## Task 5: Qualidade do canvas — DPR e fallback

O canvas hoje ignora `devicePixelRatio`, então a onda sai borrada em qualquer tela retina. E se `getContext('2d')` falhar, o visitante recebe um retângulo preto.

**Files:**
- Create: `src/lib/canvas-quality.ts`
- Create: `tests/canvas-quality.test.ts`
- Modify: `src/components/DataWave3D.tsx:16-30, 168-188`

**Interfaces:**
- Consumes: nada
- Produces: de `src/lib/canvas-quality.ts` —
  - `resolveDpr(raw: number): number`
  - `type QualityTier = 'high' | 'medium' | 'low'`
  - `interface TierSpec { cols: number; rows: number; fill: boolean }`
  - `TIERS: Record<QualityTier, TierSpec>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/canvas-quality.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveDpr, TIERS } from '../src/lib/canvas-quality';

describe('resolveDpr', () => {
  it('QUAL-01: limita o DPR em 2 para nao explodir a area de desenho', () => {
    expect(resolveDpr(3)).toBe(2);
    expect(resolveDpr(4)).toBe(2);
  });

  it('QUAL-02: preserva DPR entre 1 e 2', () => {
    expect(resolveDpr(1)).toBe(1);
    expect(resolveDpr(1.5)).toBe(1.5);
  });

  it('QUAL-03: cai para 1 diante de valor invalido', () => {
    expect(resolveDpr(0)).toBe(1);
    expect(resolveDpr(NaN)).toBe(1);
  });
});

describe('TIERS', () => {
  it('QUAL-04: o nivel alto preserva a malha atual de 45x55', () => {
    expect(TIERS.high).toEqual({ cols: 45, rows: 55, fill: true });
  });

  it('QUAL-05: os niveis decrescem em custo', () => {
    expect(TIERS.medium.cols).toBeLessThan(TIERS.high.cols);
    expect(TIERS.low.cols).toBeLessThan(TIERS.medium.cols);
    expect(TIERS.low.fill).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/canvas-quality.test.ts
```
Esperado: FALHA com `Failed to resolve import "../src/lib/canvas-quality"`.

- [ ] **Step 3: Criar o módulo**

Criar `src/lib/canvas-quality.ts`:

```ts
// Funcoes puras de qualidade do canvas. Sem dependencia de DOM para
// poderem ser testadas isoladamente.

export type QualityTier = 'high' | 'medium' | 'low';

export interface TierSpec {
  cols: number;
  rows: number;
  /** Se falso, pula o preenchimento dos quadrilateros e desenha so o arame. */
  fill: boolean;
}

export const TIERS: Record<QualityTier, TierSpec> = {
  high: { cols: 45, rows: 55, fill: true },
  medium: { cols: 32, rows: 40, fill: true },
  low: { cols: 24, rows: 30, fill: false },
};

/** Telas com DPR 3+ quadruplicam a area de desenho sem ganho visivel. */
export function resolveDpr(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, 2);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run tests/canvas-quality.test.ts
```
Esperado: 5 testes passando.

- [ ] **Step 5: Aplicar DPR no canvas**

Em `src/components/DataWave3D.tsx`, adicionar ao topo:

```tsx
import { resolveDpr, TIERS, type QualityTier } from '../lib/canvas-quality';
```

Substituir o bloco de dimensionamento (hoje linhas 22-26, `let width = window.innerWidth; ... canvas.height = height;`) por:

```tsx
    let width = window.innerWidth;
    let height = window.innerHeight;

    const applySize = () => {
      const dpr = resolveDpr(window.devicePixelRatio);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    applySize();
```

E substituir o `handleResize` (hoje linhas 168-171) por:

```tsx
    const handleResize = () => applySize();
```

O resto do loop continua usando `width` e `height` em pixels CSS — a transformação cuida da escala.

- [ ] **Step 6: Adicionar o fallback de contexto**

Substituir a linha 20 (`if (!ctx) return;`) por:

```tsx
    if (!ctx) {
      canvas.style.background =
        'radial-gradient(120% 80% at 50% 118%, rgba(0,229,255,0.28) 0%, rgba(0,229,255,0.05) 45%, transparent 72%)';
      return;
    }
```

- [ ] **Step 7: Verificar visualmente**

```bash
npm run dev
```
Numa tela retina (ou com o DevTools em DPR 2), confirmar que as linhas da onda estão nítidas e não mais serrilhadas. Redimensionar a janela e confirmar que continua nítida.

- [ ] **Step 8: Verificar e commitar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

```bash
git add src/lib/canvas-quality.ts tests/canvas-quality.test.ts src/components/DataWave3D.tsx
git commit -m "perf: canvas com devicePixelRatio e fallback de contexto"
```

---

## Task 6: Canvas adaptativo — LOD, pausa e movimento reduzido

A malha desenha ~2.400 quadriláteros por frame em qualquer aparelho, roda com a aba escondida, e não respeita `prefers-reduced-motion`.

**Files:**
- Modify: `src/lib/canvas-quality.ts`
- Modify: `tests/canvas-quality.test.ts`
- Modify: `src/components/DataWave3D.tsx`

**Interfaces:**
- Consumes: `TIERS`, `QualityTier`, `resolveDpr` da Task 5
- Produces: de `src/lib/canvas-quality.ts` —
  - `pickInitialTier(input: { cores: number; width: number }): QualityTier`
  - `downgrade(tier: QualityTier): QualityTier`
  - `createFpsMeter(sampleSize?: number): { tick(now: number): number | null }`
  - `prefersReducedMotion(): boolean`

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao final de `tests/canvas-quality.test.ts`:

```ts
import { pickInitialTier, downgrade, createFpsMeter } from '../src/lib/canvas-quality';

describe('pickInitialTier', () => {
  it('QUAL-06: telas estreitas comecam no nivel baixo', () => {
    expect(pickInitialTier({ cores: 16, width: 420 })).toBe('low');
  });

  it('QUAL-07: poucos nucleos comecam no nivel baixo', () => {
    expect(pickInitialTier({ cores: 2, width: 1920 })).toBe('low');
  });

  it('QUAL-08: maquina intermediaria comeca no medio', () => {
    expect(pickInitialTier({ cores: 8, width: 1440 })).toBe('medium');
  });

  it('QUAL-09: desktop potente comeca no alto', () => {
    expect(pickInitialTier({ cores: 16, width: 1920 })).toBe('high');
  });
});

describe('downgrade', () => {
  it('QUAL-10: desce um degrau por vez e para no baixo', () => {
    expect(downgrade('high')).toBe('medium');
    expect(downgrade('medium')).toBe('low');
    expect(downgrade('low')).toBe('low');
  });
});

describe('createFpsMeter', () => {
  it('QUAL-11: so devolve media ao completar a janela de amostras', () => {
    const meter = createFpsMeter(3);
    expect(meter.tick(0)).toBeNull();
    expect(meter.tick(16)).toBeNull();
    expect(meter.tick(32)).toBeNull();
    const avg = meter.tick(48);
    expect(avg).not.toBeNull();
    expect(avg!).toBeGreaterThan(55);
    expect(avg!).toBeLessThan(70);
  });

  it('QUAL-12: reinicia a janela apos entregar uma media', () => {
    const meter = createFpsMeter(2);
    meter.tick(0);
    meter.tick(16);
    expect(meter.tick(32)).not.toBeNull();
    expect(meter.tick(48)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/canvas-quality.test.ts
```
Esperado: FALHA com `pickInitialTier is not a function` (ou erro de import).

- [ ] **Step 3: Implementar as funções**

Acrescentar ao final de `src/lib/canvas-quality.ts`:

```ts
/** Escolha inicial conservadora: melhor comecar leve e ficar fluido. */
export function pickInitialTier(input: { cores: number; width: number }): QualityTier {
  if (input.width < 768 || input.cores <= 4) return 'low';
  if (input.cores <= 8) return 'medium';
  return 'high';
}

/** Desce um degrau. Nunca promove de volta, para nao oscilar. */
export function downgrade(tier: QualityTier): QualityTier {
  if (tier === 'high') return 'medium';
  if (tier === 'medium') return 'low';
  return 'low';
}

/**
 * Media de FPS por janela de amostras. Devolve null enquanto a janela
 * nao fecha, e a media (reiniciando a janela) quando fecha.
 */
export function createFpsMeter(sampleSize = 60) {
  const samples: number[] = [];
  let last = 0;

  return {
    tick(now: number): number | null {
      if (last === 0) {
        last = now;
        return null;
      }
      const dt = now - last;
      last = now;
      if (dt <= 0) return null;

      samples.push(1000 / dt);
      if (samples.length < sampleSize) return null;

      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      samples.length = 0;
      return avg;
    },
  };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run tests/canvas-quality.test.ts
```
Esperado: 12 testes passando.

- [ ] **Step 5: Tornar a malha do canvas dependente do nível**

Em `src/components/DataWave3D.tsx`, ampliar o import:

```tsx
import {
  resolveDpr, TIERS, downgrade, pickInitialTier, createFpsMeter, prefersReducedMotion,
  type QualityTier,
} from '../lib/canvas-quality';
```

Substituir as constantes fixas (hoje linhas 28-29, `const cols = 45; const rows = 55;`) e a construção de `points` por uma versão reconstruível:

```tsx
    const reduced = prefersReducedMotion();

    let tier: QualityTier = reduced
      ? 'low'
      : pickInitialTier({
          cores: navigator.hardwareConcurrency ?? 4,
          width: window.innerWidth,
        });

    let cols = TIERS[tier].cols;
    let rows = TIERS[tier].rows;
    let fillQuads = TIERS[tier].fill;

    const spacing = 150;

    let points: { x: number; y: number; z: number; px: number; py: number; scale: number }[] = [];

    const buildPoints = () => {
      cols = TIERS[tier].cols;
      rows = TIERS[tier].rows;
      fillQuads = TIERS[tier].fill;
      points = [];
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          points.push({
            x: (x - cols / 2) * spacing,
            z: z * spacing,
            y: 0,
            px: 0, py: 0, scale: 0,
          });
        }
      }
    };

    buildPoints();
```

Remover também a linha 31, `const totalDepth = rows * spacing;` — ela é calculada e nunca lida (o laço de desenho usa `rows * spacing * 0.8` diretamente).

- [ ] **Step 6: Honrar `fillQuads` no desenho**

No laço de desenho, envolver o preenchimento (hoje linhas 147-149, o `ctx.fillStyle`/`ctx.fill()`) em:

```tsx
          if (fillQuads) {
            ctx.fillStyle = `rgba(1, 4, 8, ${Math.min(1, depthAlpha * 1.5)})`;
            ctx.fill();
          }
```

- [ ] **Step 7: Rebaixar o nível quando os quadros caem**

**Fora de `render`**, no escopo do `useEffect` (logo depois de `buildPoints()`), declarar o medidor e o contador. Eles precisam sobreviver entre frames — declarados dentro de `render` seriam reiniciados 60 vezes por segundo e nunca acumulariam nada:

```tsx
    const fps = createFpsMeter(60);
    let badWindows = 0;
```

E **dentro** de `render`, depois do desenho e antes de reagendar o próximo frame:

```tsx
      const avg = fps.tick(performance.now());
      if (avg !== null) {
        if (avg < 45 && tier !== 'low') {
          badWindows++;
          if (badWindows >= 2) {
            tier = downgrade(tier);
            buildPoints();
            badWindows = 0;
          }
        } else {
          badWindows = 0;
        }
      }
```

Duas janelas consecutivas de 60 quadros abaixo de 45 fps equivalem a cerca de 2 s de sofrimento antes de rebaixar — tempo suficiente para não reagir a um engasgo isolado.

- [ ] **Step 8: Pausar com a aba escondida**

Substituir o agendamento inicial (hoje linha 166, `frameId = requestAnimationFrame(render);`) por:

```tsx
    let running = true;

    const start = () => {
      if (!running) {
        running = true;
        frameId = requestAnimationFrame(render);
      }
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    if (!reduced) {
      frameId = requestAnimationFrame(render);
    } else {
      render();
    }
```

Em movimento reduzido, `render()` roda uma vez e não se reagenda — o passo seguinte cuida de redesenhar quando o scroll mudar.

Dentro de `render`, envolver o reagendamento:

```tsx
      if (!reduced && running) {
        frameId = requestAnimationFrame(render);
      }
```

- [ ] **Step 9: Congelar o tempo em movimento reduzido**

Substituir o avanço temporal (hoje linha 57, `time += 0.012 + (currentScroll * 0.008);`) por:

```tsx
      if (!reduced) {
        time += 0.012 + currentScroll * 0.008;
      }
```

E o lerp (linha 53) por uma versão que salta direto ao alvo quando o movimento é reduzido:

```tsx
      currentScroll += reduced
        ? waveProgressRef.current - currentScroll
        : (waveProgressRef.current - currentScroll) * 0.04;
```

- [ ] **Step 10: Limpar tudo no unmount**

Substituir o `return` de limpeza (hoje linhas 174-177) por:

```tsx
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', handleResize);
    };
```

- [ ] **Step 11: Verificar os três comportamentos**

```bash
npm run dev
```
1. Abrir o DevTools em Performance e confirmar 55+ fps durante o scroll.
2. Trocar de aba por 10 s, voltar, e confirmar no Performance que não houve atividade de script durante a ausência.
3. Ativar "Emulate prefers-reduced-motion: reduce" no DevTools (Rendering), recarregar, e confirmar que a onda está imóvel mas ainda muda de forma ao rolar.

- [ ] **Step 12: Verificar e commitar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

```bash
git add src/lib/canvas-quality.ts tests/canvas-quality.test.ts src/components/DataWave3D.tsx
git commit -m "perf: LOD adaptativo, pausa em aba oculta e movimento reduzido no canvas"
```

---

## Task 7: Canvas dirigido por MotionValue

Hoje `waveProgress` é um `number` que vem de `useState`, então cada avanço re-renderiza a `LandingPage` inteira. E `OndaPage` chama `setState` 60 vezes por segundo — 60 re-renders por segundo para animar um número.

**Files:**
- Modify: `src/components/DataWave3D.tsx:1-20, 168-188`
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/pages/OndaPage.tsx`

**Interfaces:**
- Consumes: nada das tasks anteriores além do próprio componente
- Produces: `DataWave3D` passa a receber `progress: MotionValue<number>` no lugar de `waveProgress: number`

- [ ] **Step 1: Trocar a interface do componente**

Em `src/components/DataWave3D.tsx`, substituir o import e a interface do topo por:

```tsx
import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';

interface DataWave3DProps {
  /** Progresso 0 → 1. MotionValue para nao disparar re-render a cada frame. */
  progress: MotionValue<number>;
}

export default function DataWave3D({ progress }: DataWave3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
```

Apagar o `waveProgressRef` e o `useEffect` que o sincronizava (hoje linhas 9-14).

- [ ] **Step 2: Ler o MotionValue dentro do loop**

Trocar toda ocorrência de `waveProgressRef.current` no corpo de `render` por `progress.get()`.

O lerp da Task 6 passa a:

```tsx
      const target = progress.get();
      currentScroll += reduced ? target - currentScroll : (target - currentScroll) * 0.04;
```

- [ ] **Step 3: Redesenhar quando o scroll muda em movimento reduzido**

Ainda dentro do `useEffect`, logo antes do `return` de limpeza:

```tsx
    const unsubscribe = reduced ? progress.on('change', () => render()) : undefined;
```

E acrescentar `unsubscribe?.();` dentro da função de limpeza.

- [ ] **Step 4: Ajustar as dependências do efeito**

O array de dependências do `useEffect` principal passa de `[]` para `[progress]`.

- [ ] **Step 5: Alimentar o componente na LandingPage (ponte temporária)**

`useMotionValue` já vem importado na linha 2 de `src/pages/LandingPage.tsx` (o `MagneticButton` usa). Nenhuma mudança de import é necessária aqui.

Substituir o estado `waveProgress` (linha 359) e seu callback `handleWaveProgress` por um MotionValue:

```tsx
  const waveProgress = useMotionValue(0);

  const handleWaveProgress = useCallback((p: number) => {
    waveProgress.set(p);
  }, [waveProgress]);
```

E a renderização passa a `<DataWave3D progress={waveProgress} />`.

Esta ponte existe só até a Task 9, quando `useScroll` passa a ser a fonte. Ela já elimina um re-render por avanço de cena.

- [ ] **Step 6: Corrigir os 60 re-renders por segundo da OndaPage**

Substituir `src/pages/OndaPage.tsx` inteiro por:

```tsx
import { useEffect } from 'react';
import { useMotionValue } from 'motion/react';
import DataWave3D from '../components/DataWave3D';

export default function OndaPage() {
  // MotionValue em vez de state: a oscilacao nao precisa de re-render.
  const progress = useMotionValue(0.8);

  useEffect(() => {
    const start = Date.now();
    let frameId: number;

    const animate = () => {
      const elapsed = (Date.now() - start) / 1000;
      progress.set(0.8 + Math.sin(elapsed * 0.5) * 0.05);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [progress]);

  return (
    <div className="bg-[#000408] min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-30 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="fixed top-6 left-6 z-30 pointer-events-none">
        <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">RIA • Isolated Wave</span>
      </div>

      <DataWave3D progress={progress} />

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 text-white/20 text-[10px] uppercase tracking-widest font-medium pointer-events-none">
        Visão Pura da Alavancagem Digital
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verificar que nada re-renderiza à toa**

```bash
npm run dev
```
Com o React DevTools Profiler gravando ("Highlight updates when components render" ligado), abrir `/onda` e confirmar que **nenhum** componente pisca durante a oscilação. Depois abrir `/` e confirmar que a onda continua se comportando como antes.

- [ ] **Step 8: Verificar e commitar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

```bash
git add src/components/DataWave3D.tsx src/pages/LandingPage.tsx src/pages/OndaPage.tsx
git commit -m "perf: onda dirigida por MotionValue em vez de state"
```

---

## Task 8: Scroll nativo com snap por capítulo

O núcleo da Camada 1. `NarrativeScroll` intercepta `wheel`, `keydown` e `touch`, e esconde o conteúdo por 2,0 s a cada avanço.

**Files:**
- Create: `src/components/ChapterSection.tsx`
- Create: `src/hooks/useActiveChapter.ts`
- Modify: `src/index.css`
- Delete: `src/components/NarrativeScroll.tsx` (na Task 9, depois que a LandingPage parar de usá-lo)

**Interfaces:**
- Consumes: nada
- Produces:
  - `ChapterSection` — props `{ index: number; label: string; setRef: (el: HTMLElement | null) => void; children: React.ReactNode; className?: string }`
  - `useActiveChapter(count: number)` — devolve `{ active: number; setRef: (i: number) => (el: HTMLElement | null) => void }`

- [ ] **Step 1: Habilitar o snap no documento**

Em `src/index.css`, dentro de `@layer base`, acrescentar antes da regra de `body`:

```css
  html {
    scroll-snap-type: y proximity;
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
      scroll-snap-type: none;
    }
  }

  body {
    overscroll-behavior-y: contain;
  }
```

`proximity` e não `mandatory`: se um capítulo for mais alto que a viewport, o snap desiste em vez de prender o usuário. Sob movimento reduzido o snap sai de cena por completo.

- [ ] **Step 2: Criar o componente de capítulo**

Criar `src/components/ChapterSection.tsx`:

```tsx
import type { ReactNode } from 'react';

interface ChapterSectionProps {
  index: number;
  /** Rotulo acessivel do capitulo, lido por leitores de tela. */
  label: string;
  setRef: (el: HTMLElement | null) => void;
  children: ReactNode;
  className?: string;
}

export default function ChapterSection({
  index, label, setRef, children, className = '',
}: ChapterSectionProps) {
  return (
    <section
      id={`capitulo-${index}`}
      ref={setRef}
      aria-label={label}
      className={`relative w-full min-h-[100svh] flex items-center justify-center snap-start px-4 py-20 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Criar o hook de capítulo ativo**

Criar `src/hooks/useActiveChapter.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Observa os capitulos e devolve o indice do que ocupa a tela.
 * Dispara setState apenas em fronteira de capitulo — nunca durante o scroll.
 */
export function useActiveChapter(count: number) {
  const [active, setActive] = useState(0);
  const elements = useRef<(HTMLElement | null)[]>([]);

  const setRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      elements.current[index] = el;
    },
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = elements.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        });
      },
      {
        // Ativo = o capitulo cruza a linha do meio da tela. Usar rootMargin
        // em vez de threshold porque o intersectionRatio e calculado sobre a
        // caixa do elemento: um capitulo mais alto que 2x a viewport nunca
        // alcancaria threshold 0.5 e jamais viraria ativo.
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0,
      }
    );

    const observed = elements.current.filter((el): el is HTMLElement => el !== null);
    observed.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [count]);

  return { active, setRef };
}
```

**Por que `rootMargin` e não `threshold`:** o `IntersectionObserver` calcula a proporção visível sobre a caixa do **elemento observado**, não sobre a tela. Com `threshold: 0.5`, um capítulo mais alto que o dobro da viewport nunca alcançaria 50% de visibilidade e jamais viraria ativo — justamente o caso que o `proximity` foi escolhido para acomodar. Encolher o root a uma faixa central de altura zero transforma o critério em "o capítulo cruza a linha do meio da tela", que vale para qualquer altura.

- [ ] **Step 4: Verificar que compila**

```bash
npm run lint
```
Esperado: código 0. (Os arquivos ainda não são usados; a Task 9 os consome.)

- [ ] **Step 5: Commit**

```bash
git add src/components/ChapterSection.tsx src/hooks/useActiveChapter.ts src/index.css
git commit -m "feat: base de capitulos com scroll-snap nativo"
```

---

## Task 9: LandingPage reestruturada em capítulos

Troca do motor. Ao final desta task o `NarrativeScroll` deixa de existir.

**Files:**
- Modify: `src/pages/LandingPage.tsx:358-431`
- Modify: `src/components/PotentialDiagnostic.tsx:195`
- Modify: `src/components/SocialProofSection.tsx`, `src/components/ConsultantSection.tsx` (só `loading="lazy"`)
- Delete: `src/components/NarrativeScroll.tsx`

**Interfaces:**
- Consumes: `ChapterSection` e `useActiveChapter` da Task 8; `DataWave3D` com `progress` da Task 7
- Produces: `LandingPage` sem `NarrativeScroll`, com `scrollYProgress` de `useScroll()` alimentando a onda

- [ ] **Step 1: Trocar imports e o corpo do componente**

Em `src/pages/LandingPage.tsx`, ajustar os imports do topo:

```tsx
import { useCallback, useEffect } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'motion/react';
```

`useState` sai porque o novo `LandingPage` não guarda mais estado próprio — o capítulo ativo vem de `useActiveChapter`. `useMotionValue` e `useSpring` ficam porque `MagneticButton` depende deles. `useMotionTemplate`, que era importado e nunca usado, sai junto.

Remover `import NarrativeScroll from '../components/NarrativeScroll';` e acrescentar:

```tsx
import ChapterSection from '../components/ChapterSection';
import { useActiveChapter } from '../hooks/useActiveChapter';
```

- [ ] **Step 2: Substituir o componente `LandingPage` inteiro**

Do `export default function LandingPage()` até o fim do arquivo, substituir por:

```tsx
const CHAPTERS = [
  { label: 'A ameaça silenciosa', title: 'RIA — A Ameaça Silenciosa' },
  { label: 'O mercado está mudando', title: 'RIA — O Mercado está Mudando' },
  { label: 'Diagnóstico de saúde digital', title: 'RIA — Diagnóstico de Saúde Digital' },
  { label: 'Possibilidades infinitas', title: 'RIA — Possibilidades Infinitas' },
  { label: 'O momento é agora', title: 'RIA — O Momento é Agora' },
  { label: 'Seu consultor', title: 'RIA — Seu Consultor' },
  { label: 'Estratégia de defesa', title: 'RIA — Estratégia de Defesa' },
];

export default function LandingPage() {
  // A onda le direto do progresso do scroll — sem passar pelo React.
  const { scrollYProgress } = useScroll();
  const { active, setRef } = useActiveChapter(CHAPTERS.length);

  useEffect(() => {
    const chapter = CHAPTERS[active];
    if (chapter) document.title = chapter.title;
  }, [active]);

  const goToChapter = useCallback((index: number) => {
    document
      .getElementById(`capitulo-${index}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleFinalContact = useCallback((data: any) => {
    const message = [
      'Ola! Realizei o diagnostico via chat RIA.',
      '',
      `Nome: ${data.name}`,
      `Faturamento: R$ ${data.revenue.toLocaleString()}/mes`,
      `ROI Projetado: R$ ${data.roi.toLocaleString()}/ano`,
      `Eficiencia: +${data.efficiency}%`,
      '',
      'Quero agendar minha sessao estrategica para escalar esses numeros.',
    ].join('\n');
    window.open(whatsappWithMessage(message), '_blank');
  }, []);

  const chapterContent = [
    <SceneHero onStartDiagnostic={() => goToChapter(6)} />,
    <SocialProofSection />,
    <PotentialDiagnostic onWantStrategy={() => goToChapter(6)} />,
    <SceneServices />,
    <SceneStats />,
    <ConsultantSection onStrategyClick={() => goToChapter(6)} />,
    <SceneCTA onFinalContact={handleFinalContact} />,
  ];

  return (
    <div className="bg-[#010408] text-white font-sans selection:bg-accent/30 selection:text-white">
      <a
        href="#capitulo-6"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:text-xs focus:font-bold"
      >
        Pular para o agente de IA
      </a>

      <CyberpunkScene activeScene={active} />
      <DataWave3D progress={scrollYProgress} />
      <div className="fixed inset-0 z-20 vignette-overlay pointer-events-none" />

      <EliteHUD activeScene={active} />
      <div className="scanline" />

      <main className="relative z-10">
        {CHAPTERS.map((chapter, i) => (
          <ChapterSection key={i} index={i} label={chapter.label} setRef={setRef(i)}>
            {chapterContent[i]}
          </ChapterSection>
        ))}
      </main>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed top-8 left-8 z-30 pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-[1px] bg-accent/60" />
          <span className="text-white/60 text-xs tracking-[0.4em] uppercase font-black">RIA • ELITE</span>
        </div>
      </motion.div>

      <div className="fixed inset-0 z-40 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
```

Três coisas somem em relação ao original: `overflow-hidden`, `style={{ height: '100vh' }}` e o `useMotionValue` de ponte da Task 7.

- [ ] **Step 3: Ajustar o container das cenas que assumiam altura fixa**

`SceneCTA` usa `flex-1 min-h-full` e `max-h-[65vh]`, herdados do container de altura travada. Substituir o corpo de `SceneCTA` por:

```tsx
function SceneCTA({ onFinalContact }: { onFinalContact: (data: any) => void }) {
  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-4 flex flex-col justify-center items-center text-center pointer-events-auto">
      <div className="w-full mb-4 md:mb-8">
        <h2 className="text-3xl md:text-5xl font-serif text-white mb-2 md:mb-4">
          Você vai surfar ou <span className="italic font-normal text-glow-accent text-white/90">se afogar?</span>
        </h2>
        <p className="text-white/50 text-xs md:text-base max-w-xl mx-auto font-sans font-light leading-relaxed hidden md:block">
          Inicie a conversa com nosso Agente para descobrir seu Potencial de Alavancagem.
        </p>
      </div>

      <div className="w-full h-[70svh] md:h-[600px] mb-8">
        <AIChatAgent onComplete={onFinalContact} />
      </div>
    </div>
  );
}
```

Em `SceneServices`, trocar `h-full` por `w-full` na `className` do wrapper — a altura agora vem do capítulo.

- [ ] **Step 4: Corrigir o botão "Corrigir" do diagnóstico**

`PotentialDiagnostic.tsx:195` faz `window.scrollTo({ top: document.body.scrollHeight })`, que no novo documento vai parar no rodapé em vez do chat. Trocar a assinatura do componente por:

```tsx
interface PotentialDiagnosticProps {
  onWantStrategy?: () => void;
}

export default function PotentialDiagnostic({ onWantStrategy }: PotentialDiagnosticProps) {
```

E o `onClick` da linha 195 por:

```tsx
                onClick={() => onWantStrategy?.()}
```

- [ ] **Step 5: Adiar o carregamento das imagens abaixo da dobra**

Antes, só um capítulo existia por vez. Agora os sete montam juntos, então as imagens de conteúdo precisam parar de competir com o LCP.

Em `src/components/SocialProofSection.tsx`, cada `<img>` de thumbnail dos três vídeos recebe:

```tsx
                  loading="lazy"
                  decoding="async"
```

Em `src/components/ConsultantSection.tsx`, a foto `raul.pedro.webp` recebe os mesmos dois atributos.

**Não** aplicar em `CyberpunkScene.tsx`: `rio-real.webp` é o fundo da primeira tela e tem `preload` dedicado no `index.html` — adiá-lo pioraria o LCP em vez de melhorar.

- [ ] **Step 6: Apagar o motor antigo**

```bash
git rm src/components/NarrativeScroll.tsx
```

- [ ] **Step 7: Verificar a travessia inteira**

```bash
npm run dev
```
Conferir, um a um:
1. A roda do mouse rola de verdade, com inércia, e cada capítulo encaixa.
2. **Não existe momento de tela vazia** entre capítulos.
3. A onda cresce continuamente com o scroll, sem passo discreto.
4. PageDown, PageUp, Home, End e Tab funcionam.
5. O `document.title` muda ao trocar de capítulo.
6. No mobile (DevTools em 375 px), o arrastar é o gesto nativo e não há altura cortada pela barra do navegador.
7. Com o React DevTools em "Highlight updates", **nada pisca durante o scroll**.

- [ ] **Step 8: Verificar e commitar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

```bash
git add -A
git commit -m "feat: substituir scroll sequestrado por capitulos com snap nativo"
```

---

## Task 10: CTA persistente e navegação acessível

Com o motor novo, os dots de `NarrativeScroll` foram embora — e o CTA precisa deixar de estar a seis capítulos de distância.

**Files:**
- Create: `src/components/FloatingCTA.tsx`
- Create: `src/components/ChapterNav.tsx`
- Modify: `src/pages/LandingPage.tsx`

**Interfaces:**
- Consumes: `active` e `goToChapter` da Task 9; `WHATSAPP_URL_CTA` de `src/constants/links.ts`
- Produces:
  - `FloatingCTA` — props `{ visible: boolean }`
  - `ChapterNav` — props `{ count: number; active: number; labels: string[]; onSelect: (i: number) => void }`

- [ ] **Step 1: Criar o CTA flutuante**

Criar `src/components/FloatingCTA.tsx`:

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_URL_CTA } from '../constants/links';

interface FloatingCTAProps {
  /** Fica oculto no primeiro capitulo e no capitulo do chat. */
  visible: boolean;
}

export default function FloatingCTA({ visible }: FloatingCTAProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={WHATSAPP_URL_CTA}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-white text-black rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-2xl hover:bg-accent transition-colors duration-300 pointer-events-auto"
        >
          <MessageCircle size={15} />
          <span>Falar com o consultor</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Criar a navegação de capítulos**

Criar `src/components/ChapterNav.tsx`:

```tsx
interface ChapterNavProps {
  count: number;
  active: number;
  labels: string[];
  onSelect: (index: number) => void;
}

export default function ChapterNav({ count, active, labels, onSelect }: ChapterNavProps) {
  return (
    <nav
      aria-label="Navegação entre capítulos"
      className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col"
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Ir para ${labels[i]}`}
          aria-current={i === active ? 'true' : undefined}
          className="group flex items-center justify-center w-11 h-11 pointer-events-auto focus:outline-none"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full border border-accent/40 transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-accent ${
              i === active
                ? 'bg-accent scale-[1.8] shadow-[0_0_12px_rgba(0,229,255,0.6)]'
                : 'bg-transparent group-hover:bg-accent/30'
            }`}
          />
        </button>
      ))}
    </nav>
  );
}
```

Os alvos de toque passam a 44 × 44 px, contra os 24 px de antes.

- [ ] **Step 3: Montar os dois na LandingPage**

Acrescentar os imports:

```tsx
import FloatingCTA from '../components/FloatingCTA';
import ChapterNav from '../components/ChapterNav';
```

E, dentro do `return`, logo depois do `</main>`:

```tsx
      <ChapterNav
        count={CHAPTERS.length}
        active={active}
        labels={CHAPTERS.map((c) => c.label)}
        onSelect={goToChapter}
      />

      <FloatingCTA visible={active > 0 && active < CHAPTERS.length - 1} />
```

O CTA fica oculto no capítulo 0 (onde o hero já tem o seu) e no último (onde o chat é o destino).

- [ ] **Step 4: Verificar**

```bash
npm run dev
```
1. Rolar até o capítulo 2 e confirmar que o botão flutuante aparece; chegar ao último e confirmar que some.
2. Clicar num dot e confirmar que a rolagem é suave, não um salto.
3. Navegar pelos dots só com Tab e Enter, confirmando o anel de foco visível.
4. No mobile, confirmar que os dots são fáceis de acertar com o polegar.

- [ ] **Step 5: Verificar e commitar**

```bash
npm run lint && npm test && npm run build
```
Esperado: os três com código 0.

```bash
git add src/components/FloatingCTA.tsx src/components/ChapterNav.tsx src/pages/LandingPage.tsx
git commit -m "feat: CTA persistente e navegacao de capitulos acessivel"
```

---

## Task 11: Code splitting e smoke de ponta a ponta

O bundle é um chunk único e a `/onda` carrega junto com a `/`. E a travessia dos capítulos é exatamente o tipo de coisa que quebra em silêncio.

**Files:**
- Modify: `src/App.tsx`
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: a `LandingPage` com capítulos da Task 9; `FloatingCTA` da Task 10
- Produces: script `npm run test:e2e`

- [ ] **Step 1: Separar a rota `/onda` em chunk próprio**

Substituir `src/App.tsx` por:

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Rota secundaria: nao precisa entrar no bundle inicial.
const OndaPage = lazy(() => import('./pages/OndaPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/onda"
        element={
          <Suspense fallback={<div className="min-h-screen bg-[#000408]" />}>
            <OndaPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 2: Confirmar que o chunk se separou**

```bash
npm run build
```
Esperado: a listagem passa a mostrar um `OndaPage-*.js` além do `index-*.js`, e o `index` fica menor.

- [ ] **Step 3: Instalar o Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Configurar**

Criar `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Escrever o smoke**

Criar `e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const CHAPTERS = 7;

test('a pagina carrega sem erro de console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  expect(errors).toEqual([]);
});

test('os 7 capitulos existem no documento desde o carregamento', async ({ page }) => {
  await page.goto('/');

  for (let i = 0; i < CHAPTERS; i++) {
    await expect(page.locator(`#capitulo-${i}`)).toHaveCount(1);
  }
});

test('a travessia chega ao chat sem tela vazia', async ({ page }) => {
  await page.goto('/');

  for (let i = 0; i < CHAPTERS; i++) {
    const chapter = page.locator(`#capitulo-${i}`);
    await chapter.scrollIntoViewIfNeeded();

    // O capitulo em foco precisa estar visivel e conter texto — e isto que
    // falha se o motor voltar a esconder o conteudo durante a transicao.
    await expect(chapter).toBeVisible();
    await expect(chapter).not.toHaveText('');
  }

  await expect(page.getByPlaceholder('Digite sua resposta...')).toBeVisible();
});

test('o CTA persistente aparece no meio da narrativa', async ({ page }) => {
  await page.goto('/');

  const cta = page.getByRole('link', { name: /falar com o consultor/i });
  await expect(cta).toBeHidden();

  await page.locator('#capitulo-3').scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', /wa\.me/);
});

test('a navegacao por capitulos e acessivel por teclado', async ({ page }) => {
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: /capítulos/i });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('button')).toHaveCount(CHAPTERS);
});
```

- [ ] **Step 6: Rodar o smoke**

```bash
npx playwright test
```
Esperado: 10 testes passando (5 casos × 2 projetos).

Se `a travessia chega ao chat sem tela vazia` falhar, o motor da Task 9 regrediu — investigar antes de seguir.

- [ ] **Step 7: Registrar o script e ignorar os artefatos**

Em `package.json`, dentro de `scripts`:

```json
    "test:e2e": "playwright test",
```

Em `.gitignore`, acrescentar:

```
test-results/
playwright-report/
```

- [ ] **Step 8: Verificação final das duas camadas**

```bash
npm run lint && npm test && npm run build && npm run test:e2e
```
Esperado: os quatro com código 0.

Conferir o tamanho do bundle contra o orçamento do spec (< 200 kB gzip para o chunk inicial) e registrar o número no commit.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "test: smoke e2e da travessia de capitulos e code splitting da rota onda"
```

---

## Verificação final da Camada 0 + 1

Antes de abrir o PR, confirmar cada item **executando**, não por inspeção:

- [ ] `npm run lint` — código 0
- [ ] `npm test` — todos passando
- [ ] `npm run build` — chunk inicial < 200 kB gzip
- [ ] `npm run test:e2e` — 10 passando
- [ ] Zero segundos de tela vazia entre capítulos
- [ ] A onda responde continuamente ao scroll, sem passo discreto
- [ ] React DevTools não acusa re-render durante o scroll
- [ ] 55+ fps sustentados no DevTools Performance
- [ ] Com `prefers-reduced-motion: reduce`, nenhuma animação em loop segue ativa
- [ ] Os 7 capítulos presentes no HTML (`curl -s localhost:4173 | grep -c 'capitulo-'`)
- [ ] CTA alcançável em 1 clique a partir do capítulo 2
- [ ] Chat e diagnóstico continuam conversando com o n8n
- [ ] **Nenhuma mudança estética** — comparar lado a lado com a `main`

## Pendências herdadas do spec

Não são tarefas desta rodada, mas seguem abertas:

1. **Domínio real** — `index.html` continua com `https://ria.com.br` de placeholder no canonical, OG e JSON-LD. Bloqueado até o usuário definir.
2. **Hospedagem** — necessário confirmar antes de qualquer mudança no pipeline de deploy.
3. **Analytics** — inexistente. Antes de ligar tráfego pago, nenhuma decisão de conversão será verificável.
