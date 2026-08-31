import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Contrato de PRIMEIRA PINTURA da dobra de abertura.
 *
 * O defeito que este arquivo tranca (ago/2026):
 *
 * O hero era animado por `motion` com `initial={{ opacity: 0 }}`. O motion
 * serializa a variante inicial durante o SSR, então o dist/index.html PUBLICADO
 * saía com 28 elementos assim:
 *
 *     <span class="inline-block"
 *           style="opacity:0;filter:blur(8px);transform:translateY(30px)">Sua</span>
 *
 * — o chip, o H1 palavra a palavra, o parágrafo de apoio e OS DOIS CTAs. Medido
 * no navegador: FCP e LCP idênticos em 1672 ms, em localhost, no desktop, com o
 * bundle em cache. Idênticos porque NADA pintava antes de o JavaScript baixar,
 * executar e hidratar.
 *
 * O detalhe que fazia isso passar despercebido: os testes de GEO leem o TEXTO do
 * DOM, e o texto sempre esteve lá. O crawler enxergava a página inteira. Quem
 * não enxergava era o visitante — em 4G, ou com o JS bloqueado, a primeira tela
 * era o canvas e mais nada. O prerender resolveu o robô e criou o problema
 * humano, e nenhum teste olhava para esse lado.
 *
 * Por isso o alvo aqui é a VISIBILIDADE do que foi publicado, não a presença.
 */

const dist = resolve(process.cwd(), 'dist');
const homePath = resolve(dist, 'index.html');
const built = existsSync(homePath);
const home = built ? readFileSync(homePath, 'utf-8') : '';

/**
 * O recorte da dobra de abertura no HTML publicado.
 *
 * Delimitado pelos ids das seções, que ChapterSection garante existirem. Só
 * esta dobra entra no contrato: as revelações por rolagem das dobras seguintes
 * também saem com opacity:0, mas ali o custo é outro — elas não seguram a
 * primeira pintura nem escondem o CTA de entrada.
 */
function heroHtml(html: string): string {
  const start = html.indexOf('id="capitulo-0"');
  const end = html.indexOf('id="capitulo-1"');
  return start >= 0 && end > start ? html.slice(start, end) : '';
}

describe.skipIf(!built)('Primeira pintura — a dobra de abertura sai visível do build', () => {
  it('PAINT-01: nada na primeira dobra é publicado com opacity:0 inline', () => {
    const hero = heroHtml(home);
    expect(hero.length, 'não achei a seção capitulo-0 no HTML publicado').toBeGreaterThan(500);

    const escondidos = [...hero.matchAll(/style="[^"]*opacity:\s*0[^.\d][^"]*"/g)];
    expect(
      escondidos.length,
      `${escondidos.length} elemento(s) invisível(is) na primeira dobra: ${escondidos
        .slice(0, 3)
        .map((m) => m[0])
        .join(' | ')}`
    ).toBe(0);
  });

  it('PAINT-02: a manchete e os dois CTAs estão no HTML da primeira dobra', () => {
    const hero = heroHtml(home);
    // A manchete sai palavra a palavra em <span>, então a comparação é por
    // texto limpo, não pela frase literal na marcação.
    const texto = hero.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(texto).toContain('Sua empresa está preparada para enfrentar');
    expect(texto).toContain('Pare de rasgar dinheiro');
    expect(texto).toContain('Entenda melhor');
  });

  it('PAINT-03: existe um <h1>, e ele é o da manchete', () => {
    const h1 = [...home.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
    expect(h1.length, 'a home precisa de exatamente um h1').toBe(1);
    expect(h1[0][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length).toBeGreaterThan(20);
  });
});

describe('Primeira pintura — a entrada do hero é CSS, não JavaScript', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8');
  const landing = readFileSync(resolve(process.cwd(), 'src/pages/LandingPage.tsx'), 'utf-8');

  it('PAINT-04: as classes de entrada existem e usam fill-mode backwards', () => {
    // `backwards` é o que aplica o primeiro quadro DURANTE o atraso — é ele que
    // permite escalonar sem um orquestrador em JavaScript, mantendo o estado de
    // repouso (visível) como o normal da folha de estilo.
    for (const classe of ['.hero-word', '.hero-rise']) {
      expect(css, `falta ${classe}`).toContain(classe);
    }
    expect(css).toMatch(/animation:\s*hero-word-in[^;]*backwards/);
    expect(css).toMatch(/animation:\s*hero-rise-in[^;]*backwards/);
  });

  it('PAINT-05: nenhuma regra fixa opacity:0 sobre os elementos do hero', () => {
    /**
     * O keyframe pode declarar opacity: 0 — ele só existe enquanto a animação
     * existe. Uma REGRA de classe declarando o mesmo seria o defeito de volta
     * por outro caminho: sem suporte a animação, ou com movimento reduzido, o
     * texto ficaria invisível para sempre.
     */
    const semKeyframes = css.replace(/@keyframes[\s\S]*?\n  \}/g, '');
    const regras = [...semKeyframes.matchAll(/\.hero-(?:word|rise)[^{]*\{([^}]*)\}/g)];
    expect(regras.length).toBeGreaterThan(0);
    for (const regra of regras) {
      expect(regra[1], `regra do hero fixando opacity: ${regra[1]}`).not.toMatch(/opacity:\s*0[^.\d]/);
    }
  });

  it('PAINT-06: a entrada do hero respeita prefers-reduced-motion', () => {
    // O que o motion não fazia em nenhuma das 28 animações de entrada da página.
    //
    // A busca é pelo bloco QUE CITA as classes do hero, não pelo primeiro
    // @media da folha: já existe um bloco de movimento reduzido lá em cima, na
    // @layer base, e um regex ganancioso casaria com ele e passaria por engano.
    const blocos = [
      ...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/g),
    ].map((m) => m[1]);
    const heroBloco = blocos.find((b) => b.includes('.hero-word') && b.includes('.hero-rise'));
    expect(heroBloco, 'falta a guarda de movimento reduzido para .hero-word/.hero-rise').toBeTruthy();
    expect(heroBloco!).toContain('animation: none');
  });

  it('PAINT-07: o hero não voltou a esconder nada pelo motion', () => {
    /**
     * A regressão exata: qualquer `initial={{ opacity: 0 }}` dentro da
     * LandingPage volta a serializar o estado oculto no HTML publicado. Os
     * outros componentes continuam livres para usar o padrão — o contrato é
     * desta dobra, que é a que segura a primeira pintura.
     */
    const sceneHero = landing.slice(
      landing.indexOf('function SceneHero'),
      landing.indexOf('function SceneCTA')
    );
    expect(sceneHero.length).toBeGreaterThan(200);
    expect(sceneHero).not.toMatch(/initial\s*=\s*\{\{[^}]*opacity:\s*0/);
    expect(sceneHero).not.toContain('variants=');
  });
});
