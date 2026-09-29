import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CASES } from '../src/content/cases';

// Sem comentários: a checagem é do que a seção RENDERIZA. Um comentário que
// cite "destaque" ou "measurement" não pode fazer o teste passar por conta própria.
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const secao = semComentarios(
  readFileSync(resolve(process.cwd(), 'src/components/CredibilitySection.tsx'), 'utf-8'),
);

describe('PROVA: a dobra de casos', () => {
  it('PRV-01: o caso de site é o primeiro', () => {
    expect(CASES[0].segment).toBe('Design de interiores');
  });

  it('PRV-02: os três casos continuam publicados', () => {
    expect(CASES).toHaveLength(3);
  });

  it('PRV-03: nenhum caso carrega etiqueta de frente', () => {
    for (const c of CASES) {
      expect(c).not.toHaveProperty('front');
    }
  });

  it('PRV-04: a seção não renderiza etiqueta de frente', () => {
    expect(secao).not.toMatch(/\.front|FRONTS|frente/i);
  });

  it('PRV-05: o primeiro caso recebe destaque visual próprio', () => {
    expect(secao).toMatch(/index === 0|isPrimeiro/);
    // O destaque é de layout, não só um nome de variável: largura cheia na grade.
    expect(secao).toMatch(/isPrimeiro \? ' md:col-span-2'/);
  });

  it('PRV-06: a ressalva de apuração continua visível para caso sem medição', () => {
    expect(secao).toMatch(/c\.measurement \? \(/);
    expect(secao).toMatch(/c\.kind === 'resultado' \? \(\s*<p[^>]*>\s*Número informado pelo cliente, ainda sem apuração independente publicada\./);
  });
});
