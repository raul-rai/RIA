# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.8.x - All source files under `src/` (`*.tsx`, `*.ts`)
- CSS - `src/index.css` (Tailwind v4 `@theme` directive syntax)

**Secondary:**
- HTML - `index.html` (single entry point shell)

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` or `.node-version` present)

**Package Manager:**
- npm (inferred from `package.json` presence)
- Lockfile: Not present (`package-lock.json`, `yarn.lock`, and `bun.lockb` are all absent — install reproducibility not enforced)

## Frameworks

**Core:**
- React 19.0.x - UI rendering (`src/main.tsx`, all components under `src/components/`)
- React DOM 19.0.x - DOM mounting via `createRoot` in `src/main.tsx`

**Animation:**
- Motion 12.x (`motion` package) - Declarative animations via `motion/react` used in `src/components/Hero.tsx`, `src/components/Navbar.tsx`, `src/components/FinalCTA.tsx`, `src/components/Services.tsx`, `src/components/WhyNow.tsx`, `src/components/About.tsx`, `src/components/TheChoice.tsx`

**Styling:**
- Tailwind CSS 4.1.x - Utility classes; configured via `@theme` block directly in `src/index.css` (Tailwind v4 CSS-first config — no `tailwind.config.js` file)
- `@tailwindcss/vite` 4.1.x - Vite plugin for Tailwind v4 integration

**Build/Dev:**
- Vite 6.2.x - Dev server and production bundler; config at `vite.config.ts`
- `@vitejs/plugin-react` 5.0.x - React Fast Refresh and JSX transform
- `tsx` 4.x - TypeScript execution for Node.js scripts (devDependency)

**Icons:**
- `lucide-react` 0.546.x - Icon components; used in `src/components/Hero.tsx`, `src/components/FinalCTA.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`

**AI SDK (declared but not actively used in src/):**
- `@google/genai` 1.29.x - Google Gemini AI SDK; declared as a dependency and `GEMINI_API_KEY` is exposed via Vite config in `vite.config.ts`, but no direct import found in `src/` currently

**Server (declared but no server file found in src/):**
- `express` 4.21.x - HTTP server framework; declared as dependency with `@types/express` devDependency; no server entry file found in `src/`
- `dotenv` 17.x - Environment variable loading for server-side use

## Key Dependencies

**Critical:**
- `react` ^19.0.0 - Core UI rendering engine
- `motion` ^12.23.24 - All page animations depend on this; removing it would break all animated sections
- `tailwindcss` ^4.1.14 - All styling is utility-first; no fallback CSS

**Infrastructure:**
- `vite` ^6.2.0 - Dev server and build pipeline; removing it stops all development and build capability
- `@google/genai` ^1.29.0 - Gemini AI SDK present but not yet wired into components

## Configuration

**Environment:**
- Configured via `.env` file at project root (not committed; `.env.example` present at root)
- Required variables: `GEMINI_API_KEY`, `APP_URL`
- `GEMINI_API_KEY` is injected into the frontend bundle at build time via `vite.config.ts` `define` block: `process.env.GEMINI_API_KEY`
- `DISABLE_HMR` env var disables Vite HMR (used by AI Studio to prevent flickering)

**Build:**
- `vite.config.ts` - Main Vite config; sets React plugin, Tailwind plugin, path alias `@` → project root, and `GEMINI_API_KEY` define
- `tsconfig.json` - TypeScript config; targets ES2022, JSX transform `react-jsx`, path alias `@/*` → `./*`, `noEmit: true` (type-checking only, no emit)
- No separate `tsconfig.node.json` for Vite config file

**Dev Scripts:**
```bash
npm run dev       # vite --port=3000 --host=0.0.0.0
npm run build     # vite build
npm run preview   # vite preview
npm run lint      # tsc --noEmit (type check only)
npm run clean     # rm -rf dist
```

## Platform Requirements

**Development:**
- Node.js with npm
- Port 3000 exposed (dev server configured with `--host=0.0.0.0` for container/remote access)

**Production:**
- Static file hosting (output is `dist/` after `vite build`)
- Designed for Google AI Studio / Cloud Run deployment (inferred from `metadata.json`, HMR disable flag, and `APP_URL` env var comment)

---

*Stack analysis: 2026-04-02*
