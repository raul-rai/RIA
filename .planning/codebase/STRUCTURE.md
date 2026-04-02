# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
RIA/                         # Project root
├── src/                     # All application source code
│   ├── components/          # React section components (one file per page section)
│   │   ├── DataWave3D.tsx   # Full-viewport canvas background animation
│   │   ├── Navbar.tsx       # Fixed top navigation bar
│   │   ├── Hero.tsx         # Full-screen hero section
│   │   ├── Services.tsx     # Services grid section
│   │   ├── WhyNow.tsx       # Statistics / urgency section
│   │   ├── TheChoice.tsx    # Two-scenario comparison section
│   │   ├── About.tsx        # Founder bio section
│   │   ├── FinalCTA.tsx     # Contact / call-to-action section
│   │   └── Footer.tsx       # Page footer
│   ├── App.tsx              # Root composition component
│   ├── main.tsx             # React DOM entry point
│   └── index.css            # Global styles, Tailwind v4 theme tokens, utility classes
├── public/                  # Static assets served verbatim (currently empty; .gitkeep only)
├── .planning/               # GSD planning documents (not shipped)
│   └── codebase/            # Codebase analysis documents
├── .vscode/                 # Editor settings
├── index.html               # SPA shell HTML — mounts React
├── vite.config.ts           # Vite build & dev server config
├── tsconfig.json            # TypeScript compiler options
├── package.json             # Dependencies and npm scripts
├── .env.example             # Required environment variable template
├── metadata.json            # Project metadata (name, description)
├── .gitignore               # Ignored files
└── README.md                # Project readme
```

## Directory Purposes

**`src/`:**
- Purpose: All TypeScript/TSX application code
- Contains: Entry files (`main.tsx`, `App.tsx`), global CSS, component directory
- Key files: `src/main.tsx`, `src/App.tsx`, `src/index.css`

**`src/components/`:**
- Purpose: One file per visual page section; each exports a single default React component
- Contains: TSX files only — no subdirectories, no barrel `index.ts`
- Key files: `src/components/DataWave3D.tsx` (background canvas), `src/components/Navbar.tsx`, all section components

**`public/`:**
- Purpose: Static assets copied verbatim to build output at the root path (`/`)
- Contains: Currently only `.gitkeep` — no assets committed yet
- Expected future content: `raul-pedro.png` (referenced in `src/components/About.tsx` as `/raul-pedro.png`)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: Yes (by GSD map-codebase agent)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: SPA shell; defines `<div id="root">` and loads `src/main.tsx`
- `src/main.tsx`: React DOM bootstrap; calls `createRoot`, renders `<App>`

**Root Composition:**
- `src/App.tsx`: Imports and stacks all section components; defines global layout wrapper

**Global Styles & Design Tokens:**
- `src/index.css`: Tailwind v4 `@import`, `@theme` design tokens, `@layer base` resets, `@layer utilities` for `.glass-card`, `.text-glow`, `.animate-float`

**Background Animation:**
- `src/components/DataWave3D.tsx`: Canvas-based animated 3D wave; scroll-reactive; fixed-position z-0

**Build Configuration:**
- `vite.config.ts`: Vite plugins, path alias, env var exposure, HMR toggle
- `tsconfig.json`: TypeScript settings; `@` alias to project root

**Environment Template:**
- `.env.example`: Documents required env vars (`GEMINI_API_KEY`, `APP_URL`)

## Naming Conventions

**Files:**
- Components: PascalCase matching the exported function name — `DataWave3D.tsx`, `FinalCTA.tsx`, `WhyNow.tsx`
- Non-component source: camelCase — `main.tsx`, `index.css`
- Config files: kebab-case or framework convention — `vite.config.ts`, `tsconfig.json`

**Directories:**
- Lowercase with no hyphens — `src/`, `components/`, `public/`

**Components:**
- One default export per file, named identically to the file (minus extension)
- No named exports observed in component files

**CSS Classes:**
- Custom utilities: kebab-case — `.glass-card`, `.text-glow`, `.animate-float`
- Tailwind design tokens: kebab-case with semantic names — `bg-bg-base`, `text-muted`, `text-accent`

## Where to Add New Code

**New Page Section:**
- Create: `src/components/[SectionName].tsx` with a single default-exported function
- Register: Import and add JSX element inside `<main>` in `src/App.tsx`
- Pattern to follow: `src/components/WhyNow.tsx` (uses `useRef` + `useInView` for scroll-triggered animation)

**New Static Asset (image, font, etc.):**
- Place in: `public/` — accessible at `/<filename>` in browser and in `src/` via absolute path

**New Global Style or Design Token:**
- Add color/font token: `src/index.css` inside `@theme { }`
- Add reusable utility class: `src/index.css` inside `@layer utilities { }`

**New Shared Utility / Hook:**
- No `utils/` or `hooks/` directory exists yet
- Recommended new locations: `src/utils/` for pure functions, `src/hooks/` for custom React hooks

**New Service / API Integration:**
- No `services/` directory exists yet
- Recommended location: `src/services/[serviceName].ts`
- The `@google/genai` SDK is already installed; implementation would go in `src/services/gemini.ts` (or similar)

## Special Directories

**`.planning/`:**
- Purpose: GSD orchestration and codebase documentation
- Generated: Yes
- Committed: Yes — intended to be versioned alongside source

**`public/`:**
- Purpose: Static pass-through assets
- Generated: No
- Committed: Yes — but currently contains only `.gitkeep`

**`.vscode/`:**
- Purpose: Editor-specific settings (workspace config)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-02*
