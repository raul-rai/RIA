---
phase: 01-funcional
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/constants/links.ts
  - index.html
  - src/components/DataWave3D.tsx
autonomous: true
requirements:
  - CTA-07
  - FIX-01
  - FIX-02
  - FIX-03

must_haves:
  truths:
    - "src/constants/links.ts exists and exports WHATSAPP_URL_HERO, WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL, LINKEDIN_URL"
    - "Browser tab reads 'RIA — Revolução da Inteligência Artificial' (not 'RAI')"
    - "index.html has lang='pt-BR' (not 'en')"
    - "DataWave3D animation loop stops when the component unmounts (no memory leak)"
  artifacts:
    - path: "src/constants/links.ts"
      provides: "Single source of truth for all external contact URLs"
      exports:
        - WHATSAPP_URL_HERO
        - WHATSAPP_URL_CTA
        - WHATSAPP_URL
        - EMAIL
        - LINKEDIN_URL
    - path: "index.html"
      provides: "Corrected HTML metadata"
      contains: "lang=\"pt-BR\""
    - path: "src/components/DataWave3D.tsx"
      provides: "Animation loop with proper cleanup"
      contains: "cancelAnimationFrame"
  key_links:
    - from: "src/components/Hero.tsx (Plan 02)"
      to: "src/constants/links.ts"
      via: "import { WHATSAPP_URL_HERO } from '../constants/links'"
    - from: "src/components/FinalCTA.tsx (Plan 02)"
      to: "src/constants/links.ts"
      via: "import { WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL } from '../constants/links'"
    - from: "src/components/Navbar.tsx (Plan 03)"
      to: "src/constants/links.ts"
      via: "import { WHATSAPP_URL } from '../constants/links'"
---

<objective>
Create the shared constants foundation that all CTA wiring depends on, fix two HTML metadata bugs, and eliminate the requestAnimationFrame memory leak in DataWave3D.

Purpose: Plan 02 and Plan 03 both import from constants/links.ts — this plan must complete first. The HTML and rAF fixes are independent and slot naturally into this wave.
Output: src/constants/links.ts (new), corrected index.html, patched DataWave3D.tsx.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-funcional/01-RESEARCH.md
@.planning/phases/01-funcional/01-VALIDATION.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/constants/links.ts</name>
  <files>src/constants/links.ts</files>

  <read_first>
    - .planning/STATE.md (confirmed phone number: 5516997879837)
    - .planning/phases/01-funcional/01-RESEARCH.md (Pattern 1 — constants/links.ts)
  </read_first>

  <action>
Create the file src/constants/links.ts from scratch with this exact content:

```typescript
// src/constants/links.ts
// Single source of truth for all external contact URLs.
// Phone: 5516997879837 = country code 55 + DDD 16 + mobile 997879837 (13 digits)

const WHATSAPP_PHONE = '5516997879837';

/** Hero CTA — first impression, short message */
export const WHATSAPP_URL_HERO = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita.'
)}`;

/** FinalCTA button — clear booking intent */
export const WHATSAPP_URL_CTA = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, quero agendar minha sessão estratégica de 30 minutos.'
)}`;

/** Icon link — generic entry point (no pre-filled text) */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

/** Email — placeholder until real address is confirmed */
export const EMAIL = 'contato@ria.com.br'; // TODO: update when real email is defined

/** LinkedIn — placeholder until profile is created */
export const LINKEDIN_URL = '#'; // TODO: update when LinkedIn profile is created
```

Rules:
- Use backtick template literals and encodeURIComponent for both WhatsApp URLs with text params
- Do NOT use `+` or spaces in the phone number string — pure digits only
- The two pre-filled messages must stay under 100 characters each
- Export all five named constants; do not use a default export
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run lint 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - File exists at src/constants/links.ts
    - grep "WHATSAPP_URL_HERO" src/constants/links.ts returns a match
    - grep "WHATSAPP_URL_CTA" src/constants/links.ts returns a match
    - grep "WHATSAPP_URL " src/constants/links.ts returns a match (generic URL)
    - grep "EMAIL" src/constants/links.ts returns a match
    - grep "LINKEDIN_URL" src/constants/links.ts returns a match
    - grep "5516997879837" src/constants/links.ts returns a match (pure digits, no + or spaces)
    - grep "encodeURIComponent" src/constants/links.ts returns 2 matches (both text-param URLs)
    - npm run lint passes with no errors in this file
  </acceptance_criteria>

  <done>src/constants/links.ts exists, exports all five constants, WhatsApp numbers are pure digits, messages are encodeURIComponent-encoded, lint passes.</done>
</task>

<task type="auto">
  <name>Task 2: Fix index.html title and lang</name>
  <files>index.html</files>

  <read_first>
    - index.html (current content — line 2 has lang="en", line 6 has title "RAI")
  </read_first>

  <action>
Edit index.html. Make exactly two changes:

1. Line 2: change `<html lang="en">` to `<html lang="pt-BR">`
2. Line 6: change `<title>RAI - Revolução da Inteligência Artificial!</title>` to `<title>RIA — Revolução da Inteligência Artificial</title>`

The final file must be:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RIA — Revolução da Inteligência Artificial</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Notes:
- The em dash in the title is — (U+2014), not a hyphen `-`
- Remove the exclamation mark at the end of the old title
- Do not add any other tags — meta description, OG, canonical, favicon are Phase 2 scope
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run build 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - grep 'lang="pt-BR"' index.html returns a match
    - grep 'lang="en"' index.html returns no match
    - grep 'RIA — Revolução da Inteligência Artificial' index.html returns a match (with em dash)
    - grep 'RAI' index.html returns no match
    - grep 'Artificial!' index.html returns no match (exclamation mark removed)
  </acceptance_criteria>

  <done>index.html has lang="pt-BR" and title "RIA — Revolução da Inteligência Artificial" with em dash. No "RAI" or "!" remain.</done>
</task>

<task type="auto">
  <name>Task 3: Fix DataWave3D requestAnimationFrame memory leak</name>
  <files>src/components/DataWave3D.tsx</files>

  <read_first>
    - src/components/DataWave3D.tsx (full file — the useEffect runs from line 6 to 178)
    - .planning/phases/01-funcional/01-RESEARCH.md (Pattern 3 — rAF Cleanup with useRef)
  </read_first>

  <action>
Make three surgical edits inside the useEffect in DataWave3D.tsx. Do not change anything else.

**Edit 1:** Add `let frameId: number;` as a new line immediately before the `const render = () => {` line (currently line 47). Place it between the `points` loop (ending around line 45) and the render function declaration.

**Edit 2:** Inside the `render` function, find the final line `requestAnimationFrame(render);` (currently line 163, the last line before the closing `};` of the render function). Change it to:
```typescript
frameId = requestAnimationFrame(render);
```

**Edit 3:** Find the `render();` call (currently line 166). Change it to:
```typescript
frameId = requestAnimationFrame(render);
```
This replaces the direct `render()` call so the first frame ID is also captured.

**Edit 4:** In the cleanup return block (currently lines 174-177), add `cancelAnimationFrame(frameId);` as the FIRST line inside the cleanup:
```typescript
return () => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
};
```

After all edits, the relevant section should read:

```typescript
    let frameId: number;

    const render = () => {
      // ... all existing render logic unchanged ...
      frameId = requestAnimationFrame(render);  // was: requestAnimationFrame(render)
    };

    frameId = requestAnimationFrame(render);  // was: render()

    const handleResize = () => { ... };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
```

Do NOT touch any canvas drawing logic, point math, color calculations, or scroll handler.
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run lint 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - grep "let frameId: number" src/components/DataWave3D.tsx returns a match
    - grep "cancelAnimationFrame(frameId)" src/components/DataWave3D.tsx returns a match
    - grep "frameId = requestAnimationFrame(render)" src/components/DataWave3D.tsx returns 2 matches (inside render body + initial call)
    - grep "^    render();" src/components/DataWave3D.tsx returns no match (old direct call removed)
    - npm run lint passes with no errors on this file
    - npm run build succeeds
  </acceptance_criteria>

  <done>DataWave3D.tsx stores the rAF ID in frameId, assigns it on both the initial call and every recursive call, and cancels it in the cleanup function. Lint and build pass.</done>
</task>

</tasks>

<verification>
After all three tasks:
- npm run build completes with no errors
- src/constants/links.ts exists with all 5 exports
- index.html: lang="pt-BR", title contains "RIA" with em dash, no "RAI", no "!"
- DataWave3D.tsx: grep confirms cancelAnimationFrame and frameId present
</verification>

<success_criteria>
- `npm run build` exits 0
- `grep -c "export const" src/constants/links.ts` returns 5
- `grep 'lang="pt-BR"' index.html` returns a match
- `grep 'cancelAnimationFrame' src/components/DataWave3D.tsx` returns a match
- Plans 02 and 03 can now import from src/constants/links.ts without errors
</success_criteria>

<output>
After completion, create .planning/phases/01-funcional/01-01-SUMMARY.md with:
- Files created/modified
- Exports from constants/links.ts (for executor context in Plans 02 and 03)
- Confirmation of index.html corrections
- Confirmation of DataWave3D fix
</output>
