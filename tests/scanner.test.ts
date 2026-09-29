import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = (p: string) => resolve(process.cwd(), p);
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const hook = readFileSync(root('src/hooks/useSiteScan.tsx'), 'utf-8');
const form = readFileSync(root('src/components/ScannerForm.tsx'), 'utf-8');
const landing = readFileSync(root('src/pages/LandingPage.tsx'), 'utf-8');

describe('SCN: o scanner é a primeira dobra', () => {
  it('SCN-01: o hero renderiza o formulário do scanner', () => {
    const heroBloco = landing.slice(landing.indexOf('function SceneHero'), landing.indexOf('// ─── Capitulo 4'));
    expect(heroBloco).toContain('<ScannerForm');
    // Os dois botões antigos (consultoria gratuita / entenda melhor) saíram:
    // o formulário é o único chamado à ação da dobra.
    expect(heroBloco).not.toContain('MagneticButton');
    expect(heroBloco).not.toMatch(/Consultoria gratuita|Entenda melhor/);
  });

  it('SCN-02: a landing tem cinco capítulos, sem "Vozes do mercado"', () => {
    const chapters = landing.slice(landing.indexOf('const CHAPTERS'), landing.indexOf('export default function LandingPage'));
    expect(chapters).not.toMatch(/Vozes do mercado/);
    expect(chapters.match(/label:/g) ?? []).toHaveLength(5);
  });

  it('SCN-03: o CTA da oferta aponta para o último capítulo', () => {
    expect(landing).toMatch(/const CTA_CHAPTER = 4/);
    // O último índice de CHAPTERS é o do agente: se um capítulo entrar ou sair
    // sem o número acompanhar, o CTA aponta para o lugar errado.
    const chapters = landing.slice(landing.indexOf('const CHAPTERS'), landing.indexOf('export default function LandingPage'));
    expect((chapters.match(/label:/g) ?? []).length - 1).toBe(4);
    expect(chapters.lastIndexOf('label:')).toBe(chapters.indexOf("label: 'O agente e a agenda'"));
  });

  it('SCN-10: os capítulos são o scanner, o laudo, os caminhos, a prova e o agente, nessa ordem', () => {
    const conteudo = landing.slice(landing.indexOf('const chapterContent'), landing.indexOf('// A ordem dos provedores'));
    const ordem = ['<SceneHero', '<ReportSection', '<PathsSection', '<CredibilitySection', '<SceneCTA'];
    const posicoes = ordem.map((c) => conteudo.indexOf(c));
    for (const [i, pos] of posicoes.entries()) {
      expect(pos, `${ordem[i]} não está na lista de capítulos`).toBeGreaterThan(-1);
    }
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes);
  });

  it('SCN-11: os provedores aninham na ordem que as leituras exigem', () => {
    // O ScanProvider lê o contexto das notas e o AgentIntentProvider lê os dois.
    // Invertidos, useSiteScore() lança na montagem — e só no navegador, porque
    // o build não monta a árvore com estado.
    const jsx = landing.slice(landing.indexOf('return (', landing.indexOf('const chapterContent')));
    const notas = jsx.indexOf('<SiteScoreProvider>');
    const scan = jsx.indexOf('<ScanProvider>');
    const agente = jsx.indexOf('<AgentIntentProvider');
    expect(notas).toBeGreaterThan(-1);
    expect(scan).toBeGreaterThan(notas);
    expect(agente).toBeGreaterThan(scan);
    // E fecham na ordem inversa.
    expect(jsx.indexOf('</AgentIntentProvider>')).toBeLessThan(jsx.indexOf('</ScanProvider>'));
    expect(jsx.indexOf('</ScanProvider>')).toBeLessThan(jsx.indexOf('</SiteScoreProvider>'));
  });

  it('SCN-12: a manchete pergunta se o site aparece, e as quatro variantes de campanha existem', () => {
    const tabela = landing.slice(landing.indexOf('const HEADLINES'), landing.indexOf('/**', landing.indexOf('const HEADLINES')));
    for (const chave of ['default', 'industria', 'servicos', 'varejo']) {
      expect(tabela).toContain(`${chave}:`);
    }
    expect(tabela).toContain('o seu site aparece?');
  });
});

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

describe('SCN: scan_finished diz como cada instrumento terminou', () => {
  const corpo = semComentarios(hook);
  const analytics = semComentarios(readFileSync(root('src/lib/analytics.ts'), 'utf-8'));

  it('SCN-13: o evento carrega o desfecho do Google e o do Is Agentic', () => {
    expect(corpo).toMatch(
      /track\('scan_finished', \{ google_outcome: googleOutcome, agentic_outcome: agenticOutcome \}\)/
    );
    // Sem parâmetro, uma campanha que estoura o teto do terceiro (10/min por IP,
    // orçamento do site inteiro) seria indistinguível de desinteresse.
    expect(corpo).not.toMatch(/track\('scan_finished'\s*\)/);
  });

  it('SCN-14: cada motivo de falha do Google e do Is Agentic é registrado com o seu nome', () => {
    expect(corpo).toContain("googleOutcome = 'ok'");
    expect(corpo).toContain("googleOutcome = 'quota'");
    expect(corpo).toContain("googleOutcome = 'unreachable'");
    expect(corpo).toContain("agenticOutcome = 'ok'");
    // O motivo nomeado que a ponte mandou (rate-limited, unreachable, invalid-url).
    expect(corpo).toContain('agenticOutcome = event.reason');
    expect(corpo).toContain("agenticOutcome = 'unreachable'");
  });

  it('SCN-15: o tipo do evento obriga os dois desfechos, com os cinco nomes', () => {
    expect(analytics).toMatch(/export function track\(event: 'scan_finished', params: ScanFinishedParams\): void;/);
    expect(analytics).toMatch(/Exclude<RiaEvent, 'scan_finished'>/);
    const tipo = analytics.slice(analytics.indexOf('export type ScanOutcome'), analytics.indexOf('export interface ScanFinishedParams'));
    for (const nome of ['ok', 'rate-limited', 'unreachable', 'invalid-url', 'quota']) {
      expect(tipo, `ScanOutcome sem '${nome}'`).toContain(`'${nome}'`);
    }
    expect(analytics).toMatch(/google_outcome: ScanOutcome;\s*agentic_outcome: ScanOutcome;/);
  });
});
