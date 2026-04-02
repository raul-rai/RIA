# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- PascalCase for all React component files: `Navbar.tsx`, `Hero.tsx`, `DataWave3D.tsx`, `FinalCTA.tsx`
- PascalCase for entry point files: `App.tsx`
- camelCase for non-component files: `main.tsx`, `index.css`, `vite.config.ts`

**Functions / Components:**
- All React components are `export default function` with PascalCase names matching their filename
- Event handlers use camelCase: `handleScroll`, `handleResize`
- Boolean state variables use `is` prefix: `isOpen`, `isInView`

**Variables:**
- camelCase for all local variables: `canvasRef`, `isInView`, `targetScroll`, `currentScroll`
- Module-level data arrays use camelCase plurals defined outside the component: `services`, `stats`

**Types:**
- Inline TypeScript types for complex structures: `{x: number, y: number, z: number, px: number, py: number, scale: number}[]`
- No separate type/interface files detected — types are inlined at point of use

## Code Style

**Formatting:**
- No `.prettierrc` or `.eslintrc` detected — formatting is manual/editor-driven
- Lint command is `tsc --noEmit` (TypeScript type-check only, no style linter)
- Single quotes for string literals in imports: `import { motion } from 'motion/react'`
- Curly-brace imports without spaces in `main.tsx`: `import {StrictMode} from 'react'`
- Curly-brace imports with spaces in components: `import { motion } from 'motion/react'` — inconsistency across files

**Indentation:**
- 2-space indentation throughout

**Semicolons:**
- No trailing semicolons on JSX returns; semicolons used on statement lines

**Trailing commas:**
- Used in multi-line object/array literals (standard TypeScript ESNext style)

## Import Organization

**Order (observed pattern):**
1. Third-party animation library: `motion/react`
2. Third-party icon library: `lucide-react`
3. React built-in hooks: `react`
4. Internal components (in `App.tsx`): `./components/ComponentName`
5. CSS: `./index.css`

**Path Aliases:**
- `@/*` maps to project root `./*` (configured in both `tsconfig.json` and `vite.config.ts`)
- In practice, relative paths (`./components/...`) are used throughout — the `@/` alias is not actively used in source files

**Import style:**
- Named imports for hooks and icons: `import { useState, useRef } from 'react'`
- Default imports for components: `import Navbar from './components/Navbar'`
- Both `motion` and `useInView` from `motion/react` are imported separately (not combined into one import in several files — e.g., `About.tsx` has two separate import lines from `motion/react`)

## Error Handling

**Patterns:**
- Early-return guard clauses for DOM refs: `if (!canvas) return` / `if (!ctx) return`
- Non-null assertion operator for guaranteed DOM elements: `document.getElementById('root')!`
- No try/catch blocks detected — no async operations or API calls in component code
- Canvas API errors are silently avoided by null-checking refs before use

## Logging

**Framework:** None — no logging library present

**Patterns:**
- No `console.log` / `console.error` calls detected in source files
- Inline code comments used instead to document optimizations and intent (see `DataWave3D.tsx`)

## Comments

**When to Comment:**
- Inline comments explain performance optimizations: `// OPTIMIZATION: Drastically reduced grid resolution`
- Inline comments explain visual/algorithmic intent: `// 1. Update points (Math phase)`, `// 2. Draw phase (Painter's Algorithm)`
- Section dividers with descriptive labels in JSX: `{/* Desktop Menu */}`, `{/* Mobile Toggle */}`
- Portuguese comments appear alongside English ones in `DataWave3D.tsx` (bilingual codebase)

**JSDoc/TSDoc:**
- License header only in `src/App.tsx`:
  ```tsx
  /**
   * @license
   * SPDX-License-Identifier: Apache-2.0
   */
  ```
- No JSDoc on component functions or helper functions

## Function Design

**Size:**
- Components are self-contained single-file exports, ranging from ~28 lines (`Footer.tsx`) to ~189 lines (`DataWave3D.tsx`)
- Logic-heavy components like `DataWave3D.tsx` keep all canvas rendering logic inside a single `useEffect`

**Parameters:**
- Components accept no props (all are page-level sections with hardcoded content)
- No prop types / interfaces defined — zero prop components throughout

**Return Values:**
- All components return JSX directly from the function body (no intermediate variables for JSX)

## Module Design

**Exports:**
- One `export default` per file — no named exports
- No index barrel files (`index.ts`) in `src/components/`

**Data co-location:**
- Module-level data arrays defined above the component in the same file: `const services = [...]` in `Services.tsx`, `const stats = [...]` in `WhyNow.tsx`

## Tailwind CSS Usage

**Approach:**
- Utility-first Tailwind classes directly in JSX `className` props
- Custom design tokens defined in `src/index.css` via `@theme` directive: `--color-accent`, `--color-muted`, `--font-display`
- Custom utility class `.glass-card` defined in `@layer utilities` in `src/index.css`
- Responsive prefixes: `md:`, `lg:`, `sm:` used extensively
- Arbitrary values used for specific pixel values: `text-[75px]`, `blur-[120px]`, `w-[1px]`
- Template literals used for conditional class composition: `` `glass-card rounded-2xl ... ${index === 4 ? 'md:col-span-2 lg:col-span-1' : ''}` ``

## Animation Conventions

**Framework:** `motion/react` (Framer Motion v12)

**Pattern — entrance animations:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
  transition={{ duration: 0.8, delay: index * 0.1 }}
>
```

**Scroll-triggered pattern:**
```tsx
const ref = useRef(null);
const isInView = useInView(ref, { once: true, margin: "-100px" });
// ref attached to container div, motion elements check isInView
```
- `once: true` is used consistently — animations trigger once and do not replay
- Staggered children use `delay: index * 0.1` or `delay: index * 0.2`
- Ease curves: `"easeOut"`, `[0.16, 1, 0.3, 1]` (custom spring-like)

---

*Convention analysis: 2026-04-02*
