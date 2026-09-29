import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { PRIVACY_SECTIONS } from '../src/content/privacy';
import { EVIDENCE } from '../src/content/evidence';

/**
 * Contrato de TERCEIROS.
 *
 * A regra que este arquivo tranca, e que é a mesma que content/privacy.ts
 * declara no próprio cabeçalho: *política que omite um tratamento que acontece
 * é pior que política nenhuma — vira prova documental contra o controlador*.
 *
 * O defeito (ago/2026): a política listava n8n, LLM, PageSpeed, Cal.com,
 * Analytics e WhatsApp, e omitia dois.
 *
 *   - Google Fonts, carregado em TODA visita por um <link> render-blocking no
 *     index.html. O IP de todo visitante ia para o Google antes de qualquer
 *     clique. Numa página que constrói uma barra de consentimento inteira para
 *     o Analytics, e que declara em voz alta para onde os dados vão.
 *   - YouTube, com iframe_api e player em www.youtube.com (não -nocookie).
 *
 * Foram tratados de formas diferentes de propósito, e a diferença é o ponto:
 * o Fonts foi ELIMINADO (auto-hospedado), o YouTube foi DECLARADO e movido
 * para o domínio sem cookie. Eliminar é sempre melhor que divulgar.
 *
 * O desfecho do YouTube: a parede de vídeos saiu por decisão de posicionamento
 * (docs/superpowers/specs/2026-09-28-foco-em-sites-duas-notas-design.md) e o
 * player foi junto. Os casos que travavam o player sem cookie, o facade antes
 * do clique e a ausência da IFrame API existiam só para ele e saíram com ele.
 * O que os substitui é mais forte: o YouTube não pode aparecer em lugar
 * nenhum do código nem da política (TERC-12 e POS-PRIV), e o Is Agentic — o
 * terceiro que entrou no lugar — só fala com a nossa função de borda (TERC-14).
 */

const root = (p: string) => resolve(process.cwd(), p);

function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(entry) ? [full] : [];
  });
}

/**
 * Hosts de terceiro que o código pode citar, e por quê.
 *
 * A distinção que vale: LINK QUE O VISITANTE CLICA não é transferência de
 * dados — é navegação, e é ele quem decide. RECURSO QUE A PÁGINA BUSCA é
 * transferência, aconteça ele por clique (o player que saiu) ou sozinho (o Google Fonts
 * que saiu daqui). Esta lista é de recursos; os links de citação entram por
 * EVIDENCE, logo abaixo.
 */
const PERMITIDOS = [
  'googleapis.com', // PageSpeed Insights — só o domínio que o visitante pediu
  'wa.me', // WhatsApp — sempre por clique, mensagem visível antes
  'googletagmanager.com', // gtag — só com consentimento explícito
  'is-agentic.com', // laudo de prontidão para agentes — só a função de borda o chama (TERC-14)
  'schema.org', // @context do JSON-LD, não é requisição
  'w3.org', // namespace de SVG, não é requisição
];

/**
 * As fontes das evidências são links de saída, hoje na faixa de fontes do
 * rodapé: é por poder conferir cada estudo que o argumento pesa. Ler daqui, e
 * não de uma lista fixa, faz uma evidência nova ser aceita sozinha — e mantém a
 * trava fechada para qualquer OUTRO domínio que apareça no código.
 */
const CITACOES = EVIDENCE.map((e) => e.url);

/**
 * Comentários fora — sem comer as URLs.
 *
 * O `[^:]` antes do `//` não é detalhe: sem ele o stripper apaga de
 * `//www.youtube-nocookie.com…` até o fim da linha, porque `https://` também
 * tem duas barras. Foi exatamente assim que a primeira versão deste arquivo
 * "provou" que o código não continha uma URL que ele continha.
 */
function semComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Só o que a página BUSCA, não o que ela oferece para clicar. */
function recursosExternos(html: string): string[] {
  const semComentario = html.replace(/<!--[\s\S]*?-->/g, '');
  return [
    ...semComentario.matchAll(
      /<(?:link|script|img|iframe|source|video|audio|embed)\b[^>]*?\b(?:href|src)="(https?:\/\/[^"]+)"/gi
    ),
  ].map((m) => m[1]);
}

describe('Terceiros — nada carrega sem ação do visitante', () => {
  it('TERC-01: o index.html não busca nada de fora', () => {
    /**
     * O único ponto do site onde um terceiro conseguia entrar SEM clique. Tudo
     * o mais é sob demanda; o <head> é carregado por todo mundo, sempre.
     */
    const html = readFileSync(root('index.html'), 'utf-8');
    const externos = recursosExternos(html);
    expect(externos, `index.html busca de fora: ${externos.join(', ')}`).toEqual([]);
  });

  it('TERC-02: as fontes são auto-hospedadas, não vêm do Google', () => {
    // Sem os comentários: o comentário que substituiu as tags do Google cita o
    // domínio de propósito, para explicar por que ele saiu.
    const html = readFileSync(root('index.html'), 'utf-8').replace(/<!--[\s\S]*?-->/g, '');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');

    // E vêm de algum lugar: sem isto o teste acima passaria com a página sem fonte.
    const main = readFileSync(root('src/main.tsx'), 'utf-8');
    expect(main).toContain('@fontsource-variable/inter');
    expect(main).toContain('@fontsource-variable/playfair-display');

    // A família declarada no tema precisa ser a que o @fontsource registra,
    // senão o CSS pede uma fonte que nenhum @font-face define e a página cai
    // silenciosamente no fallback — com as fontes baixadas e sem uso.
    const css = readFileSync(root('src/index.css'), 'utf-8');
    expect(css).toContain('"Inter Variable"');
    expect(css).toContain('"Playfair Display Variable"');
  });

  it('TERC-05: nenhum host de terceiro no código fora da lista declarada', () => {
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      /**
       * Exceção estreita e datada: content/authorities.ts guarda as URLs dos
       * vídeos da parede que saiu. Nada na página o lê — só o
       * scripts/build-agent-context.ts, que extrai nome, cargo e fala para o
       * contexto publicado aos agentes. Sai na Task 11, junto com esses campos.
       * O host do YouTube NÃO volta à lista de permitidos: a exceção é deste
       * arquivo, e qualquer outro que o cite reprova.
       */
      if (file.replace(/\\/g, '/').endsWith('src/content/authorities.ts')) continue;
      // Sem comentários: eles citam de propósito os hosts que saíram, e o
      // histórico do defeito não pode ser causa de falha.
      const texto = semComentarios(readFileSync(file, 'utf-8'));
      for (const m of texto.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(\/[^\s'"`)]*)?/gi)) {
        const alvo = m[1] + (m[2] ?? '');
        const permitido =
          PERMITIDOS.some((p) => alvo.includes(p)) || CITACOES.some((c) => c.startsWith(m[0]));
        if (!permitido) {
          infratores.push(`${file.replace(root('.'), '.')} → ${m[0]}`);
        }
      }
    }
    expect(infratores, `terceiro não declarado:\n${infratores.join('\n')}`).toEqual([]);
  });
});

describe('Terceiros — a política declara o que de fato acontece', () => {
  const texto = PRIVACY_SECTIONS.flatMap((s) => [...s.paragraphs, ...(s.bullets ?? [])])
    .join(' ')
    .toLowerCase();

  it('TERC-06: todo serviço que recebe dado do visitante está na política', () => {
    for (const servico of ['n8n', 'pagespeed', 'cal.com', 'google analytics', 'whatsapp', 'is-agentic', 'vercel']) {
      expect(texto, `a política não menciona: ${servico}`).toContain(servico);
    }
  });

  it('TERC-07: a política diz que o Is Agentic recebe só o endereço, e por pedido seu', () => {
    // O que api/agentic-scan.ts de fato manda: o endereço digitado, por uma
    // função nossa, só depois de o visitante pedir a medição.
    expect(texto).toContain('quando você pede a medição');
    expect(texto).toMatch(/é enviado o endereço do site — nenhum dado seu/);
  });

  it('TERC-12: a política não descreve um YouTube que a página já não carrega', () => {
    // O oposto do TERC-06 para o terceiro que saiu. O código também não pode
    // trazê-lo de volta às escondidas: ver o teste seguinte.
    expect(texto).not.toContain('youtube');
  });

  it('TERC-08: a política não promete um Google Fonts que não existe mais', () => {
    // O oposto do defeito original: declarar um tratamento que NÃO acontece é
    // igualmente errado. A menção que sobra é histórica e diz, explicitamente,
    // que ele deixou de acontecer.
    expect(texto).toContain('deixou de acontecer');
  });
});

describe('Terceiros — a página não fala com ninguém sem passar por nós', () => {
  const semAuthorities = () =>
    sourceFiles().filter((f) => !f.replace(/\\/g, '/').endsWith('src/content/authorities.ts'));

  it('TERC-13: nada no código de src/ carrega YouTube (fora do arquivo de dados que sai na Task 11)', () => {
    const infratores = semAuthorities().filter((f) =>
      /youtube/i.test(semComentarios(readFileSync(f, 'utf-8')))
    );
    expect(infratores, 'o YouTube voltou ao código').toEqual([]);
  });

  it('TERC-14: o site fala com o Is Agentic só pela nossa função de borda', () => {
    // Sem comentários: src/config.ts cita o domínio de propósito para explicar
    // por que a rota é relativa. O que não pode existir é o domínio no CÓDIGO
    // do navegador — ele só pode aparecer em api/agentic-scan.ts.
    // A política de privacidade é a outra exceção, e é a que deve existir: ela
    // NOMEIA o serviço para o visitante. É texto, não requisição.
    const infratores = sourceFiles()
      .filter((f) => !f.replace(/\\/g, '/').endsWith('src/content/privacy.ts'))
      .filter((f) => semComentarios(readFileSync(f, 'utf-8')).includes('is-agentic.com'));
    expect(infratores, 'o domínio deles só pode aparecer em api/agentic-scan.ts').toEqual([]);

    const funcao = readFileSync(root('api/agentic-scan.ts'), 'utf-8');
    expect(funcao, 'a função de borda deixou de ser o ponto de contato').toContain(
      "const BASE = 'https://is-agentic.com'"
    );
  });
});

describe.skipIf(!existsSync(root('dist/index.html')))('Terceiros — o que foi PUBLICADO', () => {
  const home = readFileSync(root('dist/index.html'), 'utf-8');

  it('TERC-09: o HTML publicado não BUSCA nada de fora', () => {
    /**
     * Só tags de recurso. Os <a> para McKinsey, MIT, Cetic.br, HBR (na faixa
     * de fontes do rodapé) e wa.me são links de saída — o visitante decide
     * clicar, e as citações são o que torna a página citável. O que não pode
     * existir é um <link>, <script>, <img> ou <iframe> apontando para fora:
     * esses o navegador busca sozinho, sem o visitante saber.
     */
    const externos = recursosExternos(home).filter((u) => !u.includes('raulvieira.vercel.app'));
    expect(externos, `o build publica requisição externa: ${externos.join(', ')}`).toEqual([]);
  });

  it('TERC-10: as fontes publicadas saem do próprio domínio', () => {
    const cssFile = home.match(/href="(\/assets\/index-[^"]+\.css)"/)?.[1];
    expect(cssFile, 'folha de estilo não encontrada no HTML publicado').toBeTruthy();
    const css = readFileSync(root(`dist${cssFile}`), 'utf-8');
    expect(css).toContain('@font-face');
    expect(css).not.toContain('fonts.gstatic.com');
    expect(css).toMatch(/url\(\/assets\/inter-[^)]+\.woff2\)/);
  });
});
