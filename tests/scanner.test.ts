import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// SCN-01..03 (o hero renderiza o formulario, cinco capitulos, CTA_CHAPTER) leem
// src/pages/LandingPage.tsx e entram junto com a virada da pagina.

const root = (p: string) => resolve(process.cwd(), p);
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const hook = readFileSync(root('src/hooks/useSiteScan.tsx'), 'utf-8');
const form = readFileSync(root('src/components/ScannerForm.tsx'), 'utf-8');

describe('SCN: o scanner mede o site em duas notas independentes', () => {
  it('SCN-04: as duas medições disparam em paralelo, não em cascata', () => {
    const corpo = semComentarios(hook);
    // Promise.all/allSettled, e nunca um await de uma antes de começar a outra.
    expect(corpo).toMatch(/Promise\.(all|allSettled)\(/);
  });

  it('SCN-05: falha de medição nunca vira nota zero', () => {
    const corpo = semComentarios(hook);
    expect(corpo).not.toMatch(/setGoogle\(\s*0\s*\)/);
    expect(corpo).not.toMatch(/score:\s*0\b/);
  });

  it('SCN-06: o campo recusa endereço inválido antes de qualquer requisição', () => {
    expect(semComentarios(form) + semComentarios(hook)).toContain('normalizeTarget');
  });

  it('SCN-07: o botão de "não tenho site" continua existindo', () => {
    expect(form).toContain('setNoWebsite');
    expect(form).toMatch(/não tenho site/i);
  });

  it('SCN-08: o formulário lê a medição pelo provedor, nunca pelo hook de estado', () => {
    // useSiteScanState guarda estado local: chamado por dois componentes, vira
    // duas instâncias e o laudo nunca vê o que o formulário disparou.
    const corpo = semComentarios(form);
    expect(corpo).toContain('useScan()');
    expect(corpo).not.toContain('useSiteScanState');
    expect(semComentarios(hook)).toMatch(/export function ScanProvider/);
  });

  it('SCN-09: clicar em "não tenho site" cancela a medição em curso antes de declarar', () => {
    // O bug: se o visitante clica em "não tenho site" enquanto a medição está
    // rodando, ela não é cancelada. Quando termina, publica o resultado e desfaz
    // a declaração. Correção: semSite deve chamar cancel() antes de setNoWebsite(true).
    const corpo = semComentarios(form);
    // Deve extrair cancel de useScan()
    const temDesestruturacaoDeCancel = /const\s*\{\s*[^}]*cancel[^}]*\}\s*=\s*useScan\(\)/.test(
      corpo
    );
    expect(temDesestruturacaoDeCancel).toBe(true);
    expect(temDesestruturacaoDeCancel, 'semSite precisa consumir cancel de useScan()').toBe(
      true
    );
    // Dentro de semSite, cancel() deve ser chamado antes de setNoWebsite
    const semSiteMatch = corpo.match(
      /const semSite\s*=\s*(?:\(\)|async\s*\(\))\s*=>\s*\{[\s\S]*?^\s*\}/m
    );
    expect(semSiteMatch).toBeTruthy();
    const semSiteCorpo = semSiteMatch![0];
    const temCancelCall = /cancel\s*\(\s*\)/.test(semSiteCorpo);
    expect(temCancelCall).toBe(true);
    const indexCancel = semSiteCorpo.indexOf('cancel()');
    const indexSetNoWebsite = semSiteCorpo.indexOf('setNoWebsite');
    expect(indexCancel).toBeGreaterThan(-1);
    expect(indexSetNoWebsite).toBeGreaterThan(-1);
    expect(indexCancel).toBeLessThan(indexSetNoWebsite);
  });
});
