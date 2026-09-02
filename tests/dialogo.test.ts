import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Contrato de DIÁLOGO do modal de vídeo.
 *
 * Medido no navegador antes da correção, com o modal aberto:
 *
 *     role            → null
 *     aria-modal      → null
 *     rótulo          → null
 *     foco após abrir → BODY
 *     Escape fecha?   → false
 *     fundo rolável?  → sim
 *
 * Para quem enxerga e usa mouse, aquilo era um modal. Para quem navega por
 * teclado ou leitor de tela, era uma div que apareceu e o documento ativo
 * continuou sendo a página inteira atrás dela — dá para tabular para dentro
 * dos cartões escondidos pelo overlay, e não há como sair sem achar o botão.
 *
 * Estes testes leem a fonte, não o DOM: a suíte roda em `node`, sem navegador.
 * O comportamento foi verificado à mão no preview; o que fica trancado aqui é
 * a ESTRUTURA que o produz, que é onde a regressão entraria.
 */

const modal = readFileSync(resolve(process.cwd(), 'src/components/VideoModal.tsx'), 'utf-8');

/** Comentários fora, sem comer as URLs (ver a nota em terceiros.test.ts). */
const codigo = modal.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('A11Y-01 — o modal de vídeo é um diálogo de verdade', () => {
  it('DIAL-01: declara papel, modalidade e rótulo', () => {
    expect(codigo, 'sem role="dialog"').toContain('role="dialog"');
    expect(codigo, 'sem aria-modal').toContain('aria-modal="true"');

    // O rótulo aponta para o h3 com o nome de quem fala, e o id vem de useId()
    // — não de uma string fixa, que colidiria se dois modais coexistissem.
    expect(codigo).toContain('aria-labelledby={tituloId}');
    expect(codigo).toContain('id={tituloId}');
    expect(codigo).toContain('useId()');
  });

  it('DIAL-02: o foco entra no diálogo ao abrir e volta ao fechar', () => {
    // Entrar: sem isso o foco fica no <body> e o Tab seguinte cai na página
    // atrás do overlay.
    expect(codigo, 'o foco não entra no diálogo').toMatch(/fecharRef\.current\?\.focus\(\)/);

    // Voltar: sem isso, fechar joga o teclado para o início da página e a
    // pessoa perde o lugar onde estava lendo.
    expect(codigo, 'o foco não é devolvido ao fechar').toMatch(
      /focoAnterior\.current\?\.focus\(\)/
    );
    expect(codigo).toMatch(/focoAnterior\.current = document\.activeElement/);
  });

  it('DIAL-03: Escape fecha', () => {
    expect(codigo).toMatch(/e\.key === 'Escape'/);
    expect(codigo).toMatch(/'keydown'/);
  });

  it('DIAL-04: o Tab circula dentro do diálogo', () => {
    expect(codigo, 'sem armadilha de foco').toMatch(/e\.key !== 'Tab'/);
    expect(codigo).toMatch(/e\.shiftKey/);
    expect(codigo).toMatch(/preventDefault\(\)/);
    // O iframe do player precisa estar na lista: ele é focalizável, e deixá-lo
    // de fora faria a armadilha pular o elemento principal do diálogo.
    expect(codigo).toContain('iframe');
  });

  it('DIAL-05: a página não rola atrás do diálogo, e volta a rolar depois', () => {
    expect(codigo).toMatch(/document\.body\.style\.overflow = 'hidden'/);
    // Restaurar o valor ANTERIOR, não 'auto': a folha pode ter definido outra
    // coisa, e assumir 'auto' devolveria um estado que nunca existiu.
    expect(codigo).toMatch(/overflowAnterior = document\.body\.style\.overflow/);
    expect(codigo).toMatch(/document\.body\.style\.overflow = overflowAnterior/);
  });

  it('DIAL-06: o botão de fechar tem nome, e o ícone não fala', () => {
    expect(codigo).toContain('aria-label="Fechar o vídeo"');
    // O ícone é decorativo — sem isto o leitor anuncia o nome do <svg> junto.
    expect(codigo).toMatch(/<X size=\{20\} aria-hidden="true" \/>/);

    // O foco VISÍVEL deste botão não é mais responsabilidade dele: passou para
    // a regra global de :focus-visible em index.css, junto com o resto da
    // página. Ver tests/foco.test.ts — e FOCO-05, que proíbe o anel avulso
    // voltar aqui com a cor errada.
    expect(codigo, 'o botão voltou a ter anel próprio').not.toMatch(/focus-visible:ring/);
  });

  it('DIAL-07: fechar DESMONTA o diálogo, sem depender de animação', () => {
    /**
     * A tentativa que não vingou, registrada porque custou tempo e pode ser
     * tentada de novo: mover a condição para dentro de um <AnimatePresence>,
     * para a animação de saída (que estava escrita e nunca rodava) finalmente
     * acontecer. Medido no preview: a saída COMPLETAVA — opacity 0, transform
     * no valor final, nenhuma animação em curso — e o AnimatePresence não
     * removia o nó. Nem com `key` no filho, nem sem o motion aninhado.
     *
     * O que sobrava no DOM não era inofensivo: um `role="dialog"` com
     * `aria-modal="true"` invisível continua dizendo ao leitor de tela para
     * ignorar o resto da página, e o iframe do YouTube seguia tocando dentro.
     *
     * Entre a animação de saída e o desmonte confiável, o desmonte ganha.
     */
    expect(codigo, 'o desmonte imediato saiu').toContain('if (!isOpen) return null;');
    expect(codigo, 'AnimatePresence voltou — conferir se desmonta de verdade').not.toContain(
      'AnimatePresence'
    );
  });

  it('DIAL-08: não há animação de saída declarada que não rode', () => {
    // A regra que vale para o repositório inteiro: código que promete um
    // comportamento e não o entrega é pior que a ausência dele. Sem
    // AnimatePresence, um `exit` seria exatamente isso.
    expect(codigo, 'exit sem AnimatePresence não anima nada').not.toMatch(/\bexit=\{/);
    // As de ENTRADA continuam, e essas funcionam sem AnimatePresence.
    expect(codigo).toMatch(/initial=\{\{/);
    expect(codigo).toMatch(/animate=\{\{/);
  });
});
