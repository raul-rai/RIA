import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8');

describe('Brand tokens and assets (BRAND-01, BRAND-02)', () => {
  it('BRAND-01: --color-accent token is defined in @theme', () => {
    expect(css).toContain('--color-accent: #00E5FF');
  });

  it('BRAND-02: public/og-image.png exists', () => {
    const ogPath = resolve(process.cwd(), 'public/og-image.png');
    expect(existsSync(ogPath)).toBe(true);
  });

  it('BRAND-02: og-image.png is under 300KB (WhatsApp limit)', () => {
    const ogPath = resolve(process.cwd(), 'public/og-image.png');
    if (existsSync(ogPath)) {
      const { size } = statSync(ogPath);
      expect(size).toBeLessThan(300 * 1024);
    }
  });
});
