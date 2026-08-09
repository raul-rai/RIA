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
