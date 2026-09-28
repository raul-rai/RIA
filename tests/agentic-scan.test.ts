import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { normalizeTarget } from '../src/lib/agentic-report';
import { config } from '../src/config';

const root = (p: string) => resolve(process.cwd(), p);

describe('SCAN: alvo do scan', () => {
  it('SCAN-01: completa o esquema quando falta', () => {
    expect(normalizeTarget('exemplo.com.br')).toBe('https://exemplo.com.br/');
  });

  it('SCAN-02: preserva https e http explícitos', () => {
    expect(normalizeTarget('https://exemplo.com.br/pagina')).toBe('https://exemplo.com.br/pagina');
    expect(normalizeTarget('http://exemplo.com.br/')).toBe('http://exemplo.com.br/');
  });

  it('SCAN-03: recusa o que não é endereço público', () => {
    expect(normalizeTarget('')).toBeNull();
    expect(normalizeTarget('sem-ponto')).toBeNull();
    expect(normalizeTarget('ftp://exemplo.com')).toBeNull();
    expect(normalizeTarget('javascript:alert(1)')).toBeNull();
  });

  it('SCAN-04: apara espaço em volta', () => {
    expect(normalizeTarget('  exemplo.com  ')).toBe('https://exemplo.com/');
  });
});

describe('SCAN: fronteira de configuração', () => {
  it('SCAN-05: o domínio do Is Agentic só aparece em config.ts e na função de borda', () => {
    const cliente = readFileSync(root('src/lib/agentic-scan-client.ts'), 'utf-8');
    expect(cliente, 'o cliente fala com a NOSSA rota, não com a deles').not.toContain('is-agentic.com');
    expect(cliente).toContain('config.agenticScanPath');
  });

  it('SCAN-06: a função de borda não inventa nota', () => {
    const fn = readFileSync(root('api/agentic-scan.ts'), 'utf-8');
    const semComentario = fn.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(semComentario, 'nenhum score literal na função').not.toMatch(/score:\s*\d/);
    expect(semComentario).toContain("type: 'failure'");
  });

  it('SCAN-07: a rota da nossa função está em config.ts', () => {
    expect(config.agenticScanPath).toBe('/api/agentic-scan');
  });
});
