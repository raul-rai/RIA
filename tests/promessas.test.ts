import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { SESSION_MINUTES, OFFER_TERMS, FAQ } from '../src/content/offer';
import { CONTROLLER } from '../src/content/privacy';
import { EMAIL } from '../src/constants/links';

/**
 * As promessas que a página faz ao visitante.
 *
 * Duas famílias de defeito moram aqui, e as duas são do mesmo tipo: um número
 * ou um endereço escrito à mão em vários lugares, divergindo em silêncio.
 * Nenhuma quebra o build, nenhuma aparece em log, e as duas só são descobertas
 * pelo visitante — que é quem menos pode descobri-las.
 */

const root = (p: string) => resolve(process.cwd(), p);

/** Todos os .ts/.tsx sob src/, para varreduras de texto. */
function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe('CONV-01 — a duração da sessão é uma só', () => {
  /**
   * O defeito: sete lugares diziam "15 minutos" e o botão do chat dizia
   * "30 min". O botão errado era o que mais converte — o visitante lia 30 e
   * agendava o que a página vendeu como 15.
   */

  /**
   * Comentários fora, números de linha preservados.
   *
   * Os comentários deste repositório citam de propósito os valores antigos —
   * inclusive o `/30min` do Cal.com, que precisa continuar escrito em algum
   * lugar visível. Contá-los como infração transformaria a documentação do
   * defeito em causa de falha.
   */
  function semComentarios(texto: string): string {
    return texto
      .replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, (linha) => linha.replace(/./g, ' '));
  }

  it('CONV-01: nenhum literal de minutos no código discorda de SESSION_MINUTES', () => {
    const infratores: string[] = [];

    /**
     * `min` seguido de hífen é Tailwind (`min-h-11`, `min-w-0`), não duração —
     * e a classe costuma vir logo depois de um número (`mb-5 min-h-[52px]`),
     * então sem essa exclusão a varredura acusa a folha de estilo inteira.
     */
    const DURACAO = /(\d+)\s*minutos?\b|(\d+)\s+min(?![-\w])/g;

    for (const file of sourceFiles()) {
      semComentarios(readFileSync(file, 'utf-8'))
        .split('\n')
        .forEach((linha, i) => {
          for (const m of linha.matchAll(DURACAO)) {
            const valor = Number(m[1] ?? m[2]);
            if (valor !== SESSION_MINUTES) {
              infratores.push(`${file.replace(root('.'), '.')}:${i + 1} → "${m[0].trim()}"`);
            }
          }
        });
    }

    expect(infratores, `duração divergente:\n${infratores.join('\n')}`).toEqual([]);
  });

  it('CONV-02: a oferta e o FAQ anunciam a mesma duração', () => {
    // O FAQ alimenta o FAQPage JSON-LD. Divergir aqui faz o dado estruturado
    // prometer uma coisa e a tela outra — a regressão que GEO-06 já trancou
    // para o conteúdo, aplicada agora ao número.
    const comeco = OFFER_TERMS.find((t) => t.label === 'Como começa');
    expect(comeco?.value).toContain(`${SESSION_MINUTES} minutos`);

    const preco = FAQ.find((f) => f.question.includes('Quanto custa'));
    expect(preco?.answer).toContain(`${SESSION_MINUTES} minutos`);
  });

  it('CONV-03: SESSION_MINUTES é o número que a página realmente vende', () => {
    // Trava frouxa de propósito: o valor pode mudar, mas mudar exige passar
    // por aqui — e por este comentário, que lembra do Cal.com.
    //
    // ATENÇÃO: o evento do Cal.com em VITE_BOOKING_URL tem slug `/30min`.
    // Alinhar o código não muda a duração no provedor. Enquanto os dois
    // discordarem, o visitante lê uma coisa e agenda outra.
    expect(SESSION_MINUTES).toBe(15);
  });
});

describe('LGPD-02 — o canal de direitos do titular existe de verdade', () => {
  /**
   * O defeito: `contato@ria.com.br`, marcado `// TODO` no código, publicado na
   * /privacidade como canal de acesso, correção, exclusão e revogação — o canal
   * do art. 18 — com promessa de resposta em 15 dias. Um pedido enviado para lá
   * não chegava em ninguém.
   */

  it('LGPD-01: o e-mail do controlador é um endereço real ou é null, nunca um placeholder', () => {
    if (EMAIL === null) return; // caminho válido: a página cai só no WhatsApp

    expect(EMAIL, 'e-mail sem @').toContain('@');

    const placeholders = ['exemplo', 'example', 'seu@', 'contato@ria.com.br', 'test@', 'todo'];
    for (const p of placeholders) {
      expect(EMAIL.toLowerCase(), `e-mail de contato ainda é placeholder: ${EMAIL}`).not.toContain(p);
    }
  });

  it('LGPD-02: nenhum TODO sobrevive no e-mail publicado como canal legal', () => {
    const links = readFileSync(root('src/constants/links.ts'), 'utf-8');
    const declaracao = links.match(/export const EMAIL[^\n]*\n/)?.[0] ?? '';
    expect(declaracao).not.toMatch(/TODO/i);
  });

  it('LGPD-03: sem e-mail, a política ainda oferece um canal — o WhatsApp', () => {
    // O ponto todo: degradar para menos canais é aceitável; degradar para um
    // canal que não funciona, não.
    expect(CONTROLLER.whatsapp).toMatch(/^https:\/\/wa\.me\/\d+/);

    const pagina = readFileSync(root('src/pages/PrivacyPage.tsx'), 'utf-8');
    // O botão de e-mail precisa ser condicional; o de WhatsApp, não.
    expect(pagina, 'o botão de e-mail não é condicional').toContain('CONTROLLER.email &&');
    expect(pagina).toContain('CONTROLLER.whatsapp');
  });
});
