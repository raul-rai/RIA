import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { derivePath, hasAnyMeasurement } from '../src/context/SiteScoreContext';

const root = (p: string) => resolve(process.cwd(), p);

function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe('SS: estado das duas notas', () => {
  it('SS-01: sem nenhuma medição, não há caminho sugerido', () => {
    expect(derivePath({ hasNoWebsite: false, googleScore: null })).toBeNull();
  });

  it('SS-02: declarar que não tem site sugere criar', () => {
    expect(derivePath({ hasNoWebsite: true, googleScore: null })).toBe('novo');
  });

  it('SS-03: medição feita conta como medida', () => {
    expect(hasAnyMeasurement({ google: null, agentic: null, hasNoWebsite: false })).toBe(false);
    expect(hasAnyMeasurement({ google: null, agentic: null, hasNoWebsite: true })).toBe(true);
    expect(hasAnyMeasurement({ google: { score: 50 }, agentic: null, hasNoWebsite: false })).toBe(true);
    expect(hasAnyMeasurement({ google: null, agentic: { score: 72 }, hasNoWebsite: false })).toBe(true);
  });
});

describe('SS: as duas notas nunca se misturam', () => {
  it('SS-04: nenhum arquivo de src/ combina googleScore com agenticScore numa conta', () => {
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      const texto = readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      // Soma, média ou ponderação entre as duas notas, em qualquer ordem.
      if (/(google\w*Score|google\.score)[^;\n]{0,40}[+*/][^;\n]{0,40}(agentic\w*Score|agentic\.score)/i.test(texto)
        || /(agentic\w*Score|agentic\.score)[^;\n]{0,40}[+*/][^;\n]{0,40}(google\w*Score|google\.score)/i.test(texto)) {
        infratores.push(file.replace(root('.'), '.'));
      }
    }
    expect(infratores, `combinam as duas notas:\n${infratores.join('\n')}`).toEqual([]);
  });

  // SS-05 (nenhum arquivo cita useVulnerability/VulnerabilityProvider/vulnerabilityIndex)
  // só passa depois da troca dos consumidores; entra na tarefa da virada.
});
