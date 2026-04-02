# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Runner:** None — no test framework is installed or configured

**Assertion Library:** None

**Run Commands:**
```bash
# No test commands defined in package.json
# The only quality-related script is:
npm run lint    # Runs: tsc --noEmit (TypeScript type-checking only)
```

## Test File Organization

**Location:** No test files exist in the codebase

**Naming:** No convention established

**Structure:** No test directories or test files detected

## Test Structure

No tests are written. The project has no testing infrastructure.

## Mocking

**Framework:** None

**Patterns:** Not applicable — no tests exist

## Fixtures and Factories

**Test Data:** Not applicable

**Location:** Not applicable

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:** None

**Integration Tests:** None

**E2E Tests:** None

## Quality Assurance — What Exists Instead

The only automated quality check is TypeScript type-checking via:

```bash
npm run lint    # Runs: tsc --noEmit
```

This catches:
- Type errors in `.tsx` / `.ts` files
- Missing or mismatched types on DOM refs, Canvas API calls, and motion props
- Module resolution errors

TypeScript configuration (`tsconfig.json`):
- `target: ES2022`
- `strict` mode is NOT explicitly enabled — no `"strict": true` in compiler options
- `skipLibCheck: true` — third-party type errors are suppressed
- `allowJs: true` — JavaScript files are permitted alongside TypeScript

## Recommendations for Adding Tests

If tests are introduced, this project's stack would naturally support:

**Vitest** (recommended — matches Vite build toolchain):
```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

Config would go in `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
}
```

Test files would follow the pattern `src/components/ComponentName.test.tsx`.

**What to test first (highest value):**
- `src/components/Navbar.tsx` — has `useState` toggle logic (mobile menu open/close)
- `src/components/DataWave3D.tsx` — canvas setup, scroll handler registration/cleanup
- Any future utility functions extracted from components

**What is difficult to test without refactoring:**
- Canvas 2D rendering in `DataWave3D.tsx` — requires canvas mock or visual regression tooling
- Animation states — require async testing utilities
- All other components are purely presentational with no props, making them render-only snapshot candidates

---

*Testing analysis: 2026-04-02*
