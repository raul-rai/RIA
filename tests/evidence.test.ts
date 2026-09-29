import { describe, it, expect } from 'vitest';
import { EVIDENCE } from '../src/content/evidence';
import { FAQ } from '../src/content/offer';

/**
 * Substitui tests/authorities.test.ts.
 *
 * O teste antigo garantia que existiam exatamente três pessoas com foto e
 * vídeo. Este garante a coisa que realmente importa: que todo número exibido
 * no capítulo 1 seja rastreável até um estudo público, nomeado e datado.
 *
 * É o teste que impede a página de voltar ao estado auditado em ago/2026, em
 * que a "validação externa" eram três citações não verificáveis — uma delas
 * sem sequer recorte de vídeo que permitisse conferir se a frase existia.
 */
describe('EVIDENCE — integridade da prova', () => {
  it('EVID-01: toda evidência declara valor, afirmação e leitura', () => {
    expect(EVIDENCE.length).toBeGreaterThanOrEqual(3);
    for (const e of EVIDENCE) {
      expect(e.value.trim()).toBeTruthy();
      expect(e.claim.trim()).toBeTruthy();
      expect(e.takeaway.trim()).toBeTruthy();
      expect(e.icon).toBeTruthy();
    }
  });

  it('EVID-02: toda evidência nomeia a instituição, o ano e o método', () => {
    for (const e of EVIDENCE) {
      expect(e.source.trim()).toBeTruthy();
      expect(e.method.trim()).toBeTruthy();
      // Ano plausível: nada anterior à internet comercial, nada no futuro.
      expect(e.year).toBeGreaterThanOrEqual(1995);
      expect(e.year).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });

  it('EVID-03: toda evidência é conferível — URL absoluta e https', () => {
    for (const e of EVIDENCE) {
      expect(e.url).toMatch(/^https:\/\//);
      // URL precisa parsear: link quebrado num bloco cujo argumento é "confira
      // você mesmo" destrói exatamente o que o bloco existe para construir.
      expect(() => new URL(e.url)).not.toThrow();
    }
  });

  it('EVID-04: não repete fonte — quatro cartões da mesma pesquisa não são quatro provas', () => {
    expect(new Set(EVIDENCE.map((e) => e.source)).size).toBe(EVIDENCE.length);
  });

  it('EVID-05: o argumento central está presente — adoção alta e retorno baixo', () => {
    // A dobra só funciona se ela carregar as duas pontas da tese. Se alguém
    // remover uma delas, o capítulo vira uma lista de curiosidades.
    const texto = EVIDENCE.map((e) => `${e.claim} ${e.takeaway}`).join(' ').toLowerCase();
    expect(texto).toMatch(/usam ia|usa ia|adot/);
    expect(texto).toMatch(/retorno|ebit|p&l/);
  });

  it('EVID-06: todo percentual citado no FAQ existe em EVIDENCE', () => {
    // O FAQ vai para o FAQPage JSON-LD e para o agente: é o conteúdo mais
    // citável do site. Um número escrito à mão ali, sem estudo por trás, é a
    // fabricação que este arquivo existe para impedir — e ninguém a veria, porque
    // o FAQ é texto corrido, não um cartão com fonte impressa.
    const PERCENTUAL = /(\d+(?:[.,]\d+)?)\s*%/g;
    const rastreaveis = new Set(
      EVIDENCE.flatMap((e) =>
        [...`${e.value} ${e.claim} ${e.takeaway}`.matchAll(PERCENTUAL)].map((m) => m[1])
      )
    );
    let citados = 0;
    for (const item of FAQ) {
      for (const m of item.answer.matchAll(PERCENTUAL)) {
        citados += 1;
        expect(
          rastreaveis.has(m[1]),
          `${m[1]}% no FAQ ("${item.question}") não está em content/evidence.ts`
        ).toBe(true);
      }
    }
    // Trava o próprio teste: se o FAQ deixar de citar número, ele passaria vazio.
    expect(citados, 'o FAQ não cita percentual nenhum — o teste não mede nada').toBeGreaterThan(0);
  });
});
