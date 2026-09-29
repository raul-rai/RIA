import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const root = (p: string) => resolve(process.cwd(), p);

describe('GA: fins de linha do repositório', () => {
  it('GA-01: .gitattributes fixa LF, para a build não sujar a árvore com core.autocrlf=true', () => {
    // npm run build reescreve public/agent-context.json com LF. Sem o atributo,
    // com autocrlf=true o checkout entrega CRLF e o git status fica sujo depois
    // de toda build, com conteúdo idêntico.
    expect(existsSync(root('.gitattributes')), '.gitattributes sumiu').toBe(true);
    const texto = readFileSync(root('.gitattributes'), 'utf-8')
      .split(/\r?\n/)
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n');
    expect(texto).toMatch(/^\*\s+text=auto\s+eol=lf\s*$/m);
    expect(texto).toMatch(/^\*\.png\s+binary\s*$/m);
  });
});
