import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { ROUTE_META, metaFor } from '../src/content/meta';
import { PATHS } from '../src/content/paths';
import { FAQ, OFFER_TERMS, PRICE } from '../src/content/offer';
import { CONSULTANT } from '../src/content/consultant';
import { SOCIAL_PROFILES } from '../src/constants/links';

/**
 * SEO / GEO — testado sobre o que é PUBLICADO, não sobre o template.
 *
 * O teste anterior lia o index.html da raiz e conferia se as meta tags estavam
 * lá. Ele passava com 100% de aprovação enquanto o site publicado servia
 * `<body><div id="root"></div></body>` — ou seja, validava exatamente a parte
 * que nunca foi o problema, e era cego para o defeito real: nenhum conteúdo
 * legível por crawler que não executa JavaScript.
 *
 * Agora o alvo é dist/. Os testes que dependem do build se anunciam como
 * pulados quando ele não existe, em vez de passar em silêncio.
 */
const dist = resolve(process.cwd(), 'dist');
const homePath = resolve(dist, 'index.html');
const built = existsSync(homePath);
const home = built ? readFileSync(homePath, 'utf-8') : '';

/** Texto que sobra depois de remover marcação e scripts — o que o robô lê. */
function visibleText(html: string): string {
  const body = html.slice(html.indexOf('<body>'));
  return body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * O bloco "Condições e perguntas frequentes" no HTML publicado, do <section>
 * ao </section>. Vazio se o bloco não existe — e é exatamente isso que os
 * testes abaixo precisam enxergar como falha, não como pulo.
 */
function blocoDeCondicoes(html: string): string {
  const start = html.indexOf('<section id="condicoes-e-perguntas"');
  if (start < 0) return '';
  const end = html.indexOf('</section>', start);
  return end < 0 ? '' : html.slice(start, end + '</section>'.length);
}

/**
 * Valores em dinheiro escritos num texto: `R$ 500`, `R$ 5.000/mês`, `US$ 30`,
 * `500 reais`. Um número solto (`88%`, `15 minutos`) não é dinheiro — os
 * percentuais têm o EVID-06, a duração tem o CONV-01.
 */
const DINHEIRO = /(?:R\$|US\$|€)\s*\d[\d.,]*|\d[\d.,]*\s*(?:mil\s+)?reais\b/gi;

function valoresEmDinheiro(texto: string): string[] {
  return [...texto.matchAll(DINHEIRO)].map((m) =>
    m[0].replace(/\s+/g, ' ').replace(/[.,]+$/, '').trim()
  );
}

/**
 * Todo texto de dentro dos blocos JSON-LD, sem os nomes de chave. É o que um
 * motor de busca lê como afirmação, e é onde um valor escondido numa resposta
 * do FAQ mora — o teste antigo só olhava os nomes.
 */
function textoDoSchema(html: string): string {
  const blocos = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (b) => JSON.parse(b[1])
  );
  const textos: string[] = [];
  const colher = (no: unknown) => {
    if (typeof no === 'string') textos.push(no);
    else if (Array.isArray(no)) no.forEach(colher);
    else if (no && typeof no === 'object') Object.values(no).forEach(colher);
  };
  colher(blocos);
  return textos.join('\n');
}

describe.skipIf(!built)('GEO — a página é legível sem JavaScript', () => {
  it('GEO-01: o corpo publicado não é um shell vazio', () => {
    expect(home).not.toContain('<div id="root"></div>');
    expect(visibleText(home).length).toBeGreaterThan(2000);
  });

  it('GEO-02: a proposta de valor está no HTML, não só no bundle', () => {
    const texto = visibleText(home);
    // A proposta de valor mudou (set/2026): a página deixou de vender o
    // Diagnóstico de Gargalo e passou a medir o site do visitante em duas notas
    // independentes — a do Google e a de prontidão para agentes de IA. É isso
    // que o crawler precisa ler sem executar JavaScript. Não ancoramos no
    // título do hero, que é a copy que mais gira: as duas notas e os dois
    // instrumentos são a substância da oferta.
    expect(texto).toContain('duas notas');
    expect(texto).toContain('Google');
    expect(texto).toContain('agentes de IA');
  });

  it('GEO-03: os dois caminhos estão no HTML', () => {
    // Rótulo E promessa, do MESMO array que os cartões renderizam: o crawler
    // sem JavaScript precisa ler o que o visitante lê — site novo ou
    // otimização, e o que cada um entrega.
    const texto = visibleText(home);
    expect(PATHS.length).toBe(2);
    for (const caminho of PATHS) {
      expect(texto, `o caminho "${caminho.label}" sumiu do HTML`).toContain(caminho.label);
      expect(texto, `a promessa de "${caminho.label}" sumiu do HTML`).toContain(caminho.promise);
    }
  });

  it('GEO-04: as fontes das evidências estão citadas e linkadas', () => {
    /**
     * Dado + fonte + ano é a tática GEO que faz um motor generativo citar a
     * página. Este teste já mediu isso sobre a dobra "O que os dados dizem";
     * a dobra saiu e levou as citações junto, e por uma versão o teste só
     * garantia que número solto não aparecesse sem fonte. As citações voltaram
     * — agora na faixa de fontes do rodapé (components/SiteFooter), que lê o
     * MESMO content/evidence.ts — então a exigência volta ao que sempre foi: a
     * fonte tem de estar NO HTML e LINKADA, não só nomeada.
     */
    const texto = visibleText(home);
    for (const fonte of ['McKinsey', 'MIT', 'Cetic.br', 'Harvard Business Review']) {
      expect(texto, `a fonte "${fonte}" sumiu do HTML publicado`).toContain(fonte);
    }
    // O que separa citação de menção é o link para o estudo. Os domínios são
    // os que os próprios `url` de content/evidence.ts apontam — a pesquisa do
    // Cetic.br é publicada em cgi.br, não em cetic.br.
    for (const dominio of ['mckinsey.com', 'cgi.br', 'hbr.org']) {
      expect(home, `o link para ${dominio} sumiu`).toContain(dominio);
    }

    // E o par número↔fonte não pode se soltar: número de terceiro sem a fonte
    // ao lado vira alegação.
    const citacoes: Array<[RegExp, RegExp]> = [
      [/\b88\s*%/, /McKinsey/],
      [/\b95\s*%/, /MIT|NANDA/],
      [/\b17\s*%/, /Cetic\.br/],
    ];
    for (const [numero, fonte] of citacoes) {
      if (numero.test(texto)) {
        expect(texto, `${numero} está na página sem nomear a fonte (${fonte})`).toMatch(fonte);
      }
    }
  });

  it('GEO-05: o JSON-LD é válido e o FAQPage tem perguntas', () => {
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(blocks.length).toBeGreaterThanOrEqual(2);

    const parsed = blocks.map((b) => JSON.parse(b[1]));
    const faq = parsed.find((p) => p['@type'] === 'FAQPage');
    expect(faq).toBeDefined();
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(4);
    for (const q of faq.mainEntity) {
      expect(q.name.trim()).toBeTruthy();
      expect(q.acceptedAnswer.text.trim().length).toBeGreaterThan(40);
    }
  });

  it('GEO-06: a oferta que o schema declara está visível, e o schema não inventa preço', () => {
    // A regressão que este teste tranca: até ago/2026 o FAQPage do index.html
    // continha a oferta inteira (preço, garantia) que NÃO aparecia em lugar
    // nenhum da tela — o crawler sabia mais que o comprador.
    //
    // Antes este teste checava um nome de produto ("Diagnóstico de Gargalo") e
    // passava por acidente de copy. Agora a oferta declarada É a lista de
    // Service do schema, e cada uma tem de estar na tela.
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (b) => JSON.parse(b[1])
    );
    const texto = visibleText(home);

    const services = blocks.filter((b) => b['@type'] === 'Service');
    expect(services.length, 'o schema não declara nenhuma oferta').toBeGreaterThan(0);
    for (const s of services) {
      expect(texto, `a oferta "${s.name}" está no schema mas não na tela`).toContain(s.name);
      expect(texto, `a promessa de "${s.name}" está no schema mas não na tela`).toContain(
        s.description
      );
    }

    // Preço em dado estruturado fica no cache do Google por semanas. Enquanto o
    // valor for uma decisão em aberto (PRICE === null), nenhum bloco declara
    // preço nem oferta comercial — nem como CHAVE do schema...
    if (PRICE === null) {
      expect(
        JSON.stringify(blocks),
        'o schema declara preço enquanto PRICE é null'
      ).not.toMatch(/"(offers|price|priceCurrency|lowPrice|highPrice|priceSpecification)"/);
    }

    // ...nem escrito DENTRO DO TEXTO de uma resposta. Este era o buraco: a faixa
    // "entre R$ 500 e R$ 5.000/mês" morava na resposta de "Quanto custa", que o
    // teste de chaves não enxerga, e chegava ao schema sem estar em lugar
    // nenhum da tela.
    //
    // Cada valor em dinheiro do schema tem de existir no HTML visível — e SEM
    // clique. Uma faixa de valores atrás de um acordeão fechado é um valor que o
    // comprador não vê, então o texto fora dos <details> é o que conta.
    const doSchema = valoresEmDinheiro(textoDoSchema(home));
    const semClique = visibleText(home.replace(/<details[\s\S]*?<\/details>/g, ' '));
    for (const valor of new Set(doSchema)) {
      expect(texto, `"${valor}" está no schema mas não na tela`).toContain(valor);
      expect(
        semClique,
        `"${valor}" só aparece dentro de um <details> fechado — o comprador não o vê sem clicar`
      ).toContain(valor);
    }

    // O FAQPage sai do MESMO array que a fonte (content/offer.ts).
    const faq = blocks.find((b) => b['@type'] === 'FAQPage');
    expect(faq.mainEntity.map((q: any) => q.name)).toEqual(FAQ.map((q) => q.question));
    expect(faq.mainEntity.every((q: any) => q.acceptedAnswer?.text)).toBe(true);
  });

  it('GEO-06a: o varredor de valores lê o schema — nada se aprova por ele não ver', () => {
    // O GEO-06 só vale se `valoresEmDinheiro(textoDoSchema(...))` de fato
    // enxerga o dinheiro que a fonte escreve. Sem esta âncora, um regex que
    // parasse de casar (ou um schema que passasse a serializar de outro jeito)
    // deixaria a varredura vazia e o teste verde, para sempre.
    const daFonte = new Set(FAQ.flatMap((q) => valoresEmDinheiro(q.answer)));
    const doSchema = new Set(valoresEmDinheiro(textoDoSchema(home)));
    expect([...doSchema].sort()).toEqual([...daFonte].sort());
  });

  it('GEO-06b: o bloco de condições e o FAQ estão na tela, inteiros e à mostra', () => {
    // Era um it.todo: o FAQ e as condições só existiam para o robô (JSON-LD,
    // Markdown, contexto do agente), e um todo é verde para sempre. Agora
    // components/OfferFaqSection.tsx desenha os dois, do MESMO array, e este
    // teste tranca o que o comprador de fato lê.
    const bloco = blocoDeCondicoes(home);
    expect(bloco, 'o bloco condicoes-e-perguntas não existe no HTML publicado').not.toBe('');

    // Dentro de <main>, e não só em algum canto do documento.
    const main = home.slice(home.indexOf('<main'), home.indexOf('</main>'));
    expect(main, 'o bloco está fora do <main>').toContain('id="condicoes-e-perguntas"');

    // Nada de esconder: um bloco presente no HTML mas invisível cumpre a letra
    // e trai a regra. Só o que o comprador vê conta como "na tela".
    expect(bloco, 'o bloco está oculto por classe').not.toMatch(
      /class="(?:[^"]*\s)?(?:hidden|sr-only|invisible|opacity-0)(?:\s|")/
    );
    expect(bloco, 'o bloco está oculto por estilo').not.toMatch(/display:\s*none|visibility:\s*hidden/);

    const textoBloco = visibleText('<body>' + bloco);

    // Toda pergunta e toda resposta do FAQPage, palavra por palavra.
    const faq = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((b) => JSON.parse(b[1]))
      .find((b) => b['@type'] === 'FAQPage');
    expect(faq.mainEntity.length).toBe(FAQ.length);
    for (const q of faq.mainEntity) {
      expect(textoBloco, `a pergunta "${q.name}" está no schema mas não na tela`).toContain(q.name);
      expect(
        textoBloco,
        `a resposta de "${q.name}" está no schema mas não na tela`
      ).toContain(q.acceptedAnswer.text);
    }

    // As condições da oferta: rótulo, resposta e detalhe.
    for (const t of OFFER_TERMS) {
      expect(textoBloco, `o termo "${t.label}" não está na tela`).toContain(t.label);
      expect(textoBloco, `a resposta de "${t.label}" não está na tela`).toContain(t.value);
      expect(textoBloco, `o detalhe de "${t.label}" não está na tela`).toContain(t.detail);
    }

    // As condições ficam sempre abertas: nenhuma delas dentro de <details>.
    const semDetails = visibleText('<body>' + bloco.replace(/<details[\s\S]*?<\/details>/g, ' '));
    for (const t of OFFER_TERMS) {
      expect(semDetails, `o termo "${t.label}" ficou atrás de um clique`).toContain(t.detail);
    }
  });

  it('GEO-06c: o bloco lê de content/offer.ts e entra depois do agente, fora dos capítulos', () => {
    const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
    const componente = src('src/components/OfferFaqSection.tsx');
    const semComentarios = componente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    // Uma fonte só, nunca uma segunda cópia à mão.
    expect(semComentarios).toMatch(/from '\.\.\/content\/offer'/);
    expect(semComentarios).toContain('OFFER_TERMS.map(');
    expect(semComentarios).toContain('FAQ.map(');
    expect(semComentarios, 'valor em reais escrito à mão no componente').not.toMatch(/R\$/);

    // Fora de CHAPTERS: não vira dobra de conversão, não ganha índice no HUD e
    // não desloca o capítulo do agente (o último, alvo de todo CTA).
    const landing = src('src/pages/LandingPage.tsx');
    const chapters = landing.slice(landing.indexOf('const CHAPTERS'), landing.indexOf('export default'));
    expect(chapters).not.toContain('Condições');
    expect(chapters).not.toContain('OfferFaqSection');

    // E vem DEPOIS do mapa de capítulos, dentro do <main>.
    const mapa = landing.indexOf('CHAPTERS.map(');
    const bloco = landing.indexOf('<OfferFaqSection />');
    const fimMain = landing.indexOf('</main>');
    expect(mapa).toBeGreaterThan(0);
    expect(bloco, 'OfferFaqSection não está montado na landing').toBeGreaterThan(mapa);
    expect(bloco).toBeLessThan(fimMain);
  });
});

describe.skipIf(!built)('SEO — metadados por rota', () => {
  it('SEO-01: title e description próprios, description até 160 caracteres', () => {
    const title = home.match(/<title>([^<]+)<\/title>/)?.[1];
    const desc = home.match(/<meta name="description" content="([^"]+)"/)?.[1];
    expect(title).toBeTruthy();
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeLessThanOrEqual(160);
  });

  it('SEO-02: OG e Twitter completos, com imagem absoluta', () => {
    for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
      expect(home).toContain(`property="${tag}"`);
    }
    expect(home).toMatch(/og:image"\s+content="https:\/\//);
    expect(home).toContain('name="twitter:card"');
  });

  it('SEO-03: canonical presente e absoluto', () => {
    const canonical = home.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toMatch(/^https:\/\//);
  });

  it('SEO-04: nenhuma tag duplicada — o prerender limpa antes de injetar', () => {
    for (const tag of ['<title>', 'rel="canonical"', 'property="og:title"']) {
      const ocorrencias = home.split(tag).length - 1;
      expect(ocorrencias, `${tag} aparece ${ocorrencias}x`).toBe(1);
    }
  });

  it('SEO-05: /privacidade tem title e canonical PRÓPRIOS, não herdados da home', () => {
    const privPath = resolve(dist, 'privacidade/index.html');
    expect(existsSync(privPath)).toBe(true);
    const priv = readFileSync(privPath, 'utf-8');

    const privTitle = priv.match(/<title>([^<]+)<\/title>/)?.[1];
    const homeTitle = home.match(/<title>([^<]+)<\/title>/)?.[1];
    expect(privTitle).not.toBe(homeTitle);

    const privCanonical = priv.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(privCanonical).toContain('/privacidade');
  });

  it('SEO-08: /privacidade sai nas duas formas — com e sem barra final', () => {
    /**
     * REGRESSÃO VERIFICADA EM SERVIDOR REAL.
     *
     * Com apenas `privacidade/index.html`, um GET em `/privacidade` (sem barra)
     * caía no rewrite de SPA e devolvia a HOME — com o title e o canonical da
     * home. Conteúdo duplicado apontando canonical errado, no link que o
     * rodapé do site inteiro publica.
     */
    const semBarra = resolve(dist, 'privacidade.html');
    const comBarra = resolve(dist, 'privacidade/index.html');
    expect(existsSync(semBarra), 'falta dist/privacidade.html').toBe(true);
    expect(existsSync(comBarra), 'falta dist/privacidade/index.html').toBe(true);
    // Saem do mesmo render: divergir seria pior que faltar.
    expect(readFileSync(semBarra, 'utf-8')).toBe(readFileSync(comBarra, 'utf-8'));
  });

  it('SEO-06: robots.txt existe, aponta o sitemap e libera os crawlers de IA', () => {
    const robots = readFileSync(resolve(dist, 'robots.txt'), 'utf-8');
    expect(robots).toContain('Sitemap:');
    // O trabalho da RIA é deixar o site do cliente citável por estes agentes.
    // Bloqueá-los por descuido seria vender o oposto do que o site entrega.
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot']) {
      expect(robots).toContain(bot);
    }
  });

  it('SEO-09: o título publicado é o de content/meta.ts, e a home é a home', () => {
    /**
     * REGRESSÃO VERIFICADA NO NAVEGADOR.
     *
     * O prerender injetava o título certo e o React o APAGAVA na hidratação,
     * trocando por "RIA — A Ameaça Silenciosa" (o rótulo do capítulo 0) e
     * reescrevendo a cada rolagem. Como o Googlebot lê o <title> DEPOIS de
     * executar o JavaScript, o título indexado era o do capítulo — sem
     * "gargalo", sem "ferramenta de IA".
     *
     * O teste só consegue afirmar o lado publicado; o lado do React está em
     * SEO-10, que é onde a regressão de fato entrava.
     */
    const title = home.match(/<title>([^<]+)<\/title>/)?.[1];
    const desc = home.match(/<meta name="description" content="([^"]+)"/)?.[1];
    expect(title).toBe(ROUTE_META['/'].title);
    expect(desc).toBe(ROUTE_META['/'].description);

    const priv = readFileSync(resolve(dist, 'privacidade/index.html'), 'utf-8');
    expect(priv.match(/<title>([^<]+)<\/title>/)?.[1]).toBe(ROUTE_META['/privacidade'].title);
  });

  it('SEO-07: sitemap.xml lista exatamente as rotas prerenderizadas', () => {
    const sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf-8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // As páginas-âncora de confiança (/sobre e /contato) entraram no mesmo
    // build que o prerender, o sitemap e o llms.txt — as listas saem todas da
    // constante ROUTES, então listar uma página inexistente (ou omitir uma que
    // existe) é impossível por construção.
    expect(locs.some((l) => l.endsWith('/sobre'))).toBe(true);
    expect(locs.some((l) => l.endsWith('/contato'))).toBe(true);
    expect(locs.some((l) => l.endsWith('/privacidade'))).toBe(true);
    // A home entra sem barra final (a raiz), não como '/'.
    expect(locs.some((l) => /raulvieira\.vercel\.app$/.test(l))).toBe(true);
    for (const loc of locs) expect(loc).toMatch(/^https:\/\//);
  });
});

/**
 * O título depois da hidratação.
 *
 * Estes testes não dependem do build: eles trancam a fonte, que é onde o
 * defeito morava. O <title> publicado estava sempre correto — o problema era o
 * React sobrescrevê-lo no primeiro frame, e nenhum teste sobre `dist/` tem como
 * enxergar isso.
 */
describe('SEO — o título sobrevive à hidratação', () => {
  const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

  it('SEO-10: nenhuma página escreve document.title com texto solto', () => {
    /**
     * O contrato: escrever `document.title` é permitido — a navegação
     * client-side precisa disso, senão ir da home para /privacidade pelo rodapé
     * deixa o título da home na aba. O que não é permitido é escrever um valor
     * que o prerender não conhece. Toda escrita passa por metaFor().
     */
    for (const pagina of ['src/pages/LandingPage.tsx', 'src/pages/PrivacyPage.tsx']) {
      const escritas = [...src(pagina).matchAll(/document\.title\s*=\s*([^;]+);/g)];
      expect(escritas.length, `${pagina} escreve o título ${escritas.length}x`).toBeLessThanOrEqual(1);
      for (const [, valor] of escritas) {
        expect(valor.trim(), `${pagina}: document.title = ${valor.trim()}`).toMatch(
          /^metaFor\('[^']+'\)\.title$/
        );
      }
    }
  });

  it('SEO-11: a lista de capítulos não carrega mais um título próprio', () => {
    // O campo `title` de CHAPTERS existia só para alimentar a sobrescrita.
    // Enquanto ele não voltar, não há de onde a regressão renascer.
    const landing = src('src/pages/LandingPage.tsx');
    const chapters = landing.slice(landing.indexOf('const CHAPTERS'), landing.indexOf('export default'));
    expect(chapters).toContain("label:");
    expect(chapters, 'CHAPTERS voltou a ter title — ver src/content/meta.ts').not.toContain('title:');
  });

  it('SEO-12: o prerender lê os metadados da mesma fonte que as páginas', () => {
    // Sem isto, o script podia redeclarar o seu próprio objeto META e as duas
    // listas voltariam a divergir em silêncio — que é o modo de falha que
    // content/meta.ts existe para fechar.
    const prerender = src('scripts/prerender.js');
    expect(prerender).toContain('metaFor');
    expect(prerender, 'prerender.js redeclarou META').not.toMatch(/^const META = \{/m);
    expect(src('src/entry-server.tsx')).toContain("from './content/meta'");
  });

  it('SEO-13: toda rota prerenderizada tem metadados declarados', () => {
    // ROUTES vive em entry-server.tsx (que não dá para importar aqui, arrasta
    // React), então a checagem é por texto — e o que importa é o inverso: uma
    // rota nova sem metadados cairia calada no título da home.
    const rotas = [...src('src/entry-server.tsx').matchAll(/\{ path: '([^']+)'/g)].map((m) => m[1]);
    expect(rotas.length).toBeGreaterThan(0);
    for (const rota of rotas) {
      expect(ROUTE_META[rota], `rota ${rota} não tem entrada em ROUTE_META`).toBeDefined();
      expect(metaFor(rota).description.length).toBeLessThanOrEqual(160);
    }
  });
});

/**
 * GEO-01 — o schema declara o negócio, o site e a OFERTA.
 *
 * O que havia até ago/2026: dois blocos, `ProfessionalService` e `FAQPage`.
 * Para um motor generativo isso responde "existe um negócio" e "ele responde
 * estas perguntas". Não responde qual é o site, nem o que está à venda.
 *
 * As ofertas existiam só como texto solto no HTML — o motor tinha que INFERIR
 * que "Site novo" era um serviço. E o bloco do negócio não declarava marca nem
 * contato: sem `logo`, sem `image`, sem `telephone`.
 *
 * A ironia é o motivo de isto ser um achado e não um capricho: a RIA vende
 * exatamente "site que o ChatGPT e o Perplexity conseguem ler e CITAR". Ser
 * lido, o prerender resolveu. Ser citado depende de declarar.
 */
describe.skipIf(!built)('GEO-01 — schema.org completo', () => {
  const ld = (html: string) =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((b) =>
      JSON.parse(b[1])
    );

  const blocos = built ? ld(home) : [];
  const tipo = (t: string) => blocos.filter((b) => b['@type'] === t);
  const org = () => tipo('ProfessionalService')[0];

  it('GEO-07: a home declara negócio, site, uma oferta por caminho e o FAQ', () => {
    expect(tipo('ProfessionalService')).toHaveLength(1);
    expect(tipo('WebSite')).toHaveLength(1);
    expect(tipo('FAQPage')).toHaveLength(1);
    expect(tipo('Service').length, 'nenhum caminho virou Service').toBe(PATHS.length);
  });

  it('GEO-08: marca e contato declarados, e os arquivos existem de verdade', () => {
    /**
     * Um `logo` apontando para 404 é pior que `logo` ausente: o Google tenta
     * buscar, falha, e o cartão de conhecimento fica sem imagem sem dizer por
     * quê. Então o teste confere o arquivo, não só o campo.
     */
    const o = org();
    expect(o.logo, 'falta logo').toBeTruthy();
    expect(o.image, 'falta image').toBeTruthy();
    expect(o.telephone, 'falta telephone').toMatch(/^\+\d{12,13}$/);

    for (const url of [o.logo, o.image]) {
      const arquivo = url.split('/').pop();
      expect(existsSync(resolve(dist, arquivo)), `${arquivo} não existe em dist/`).toBe(true);
    }

    // PNG e não SVG: a orientação do Google para `logo` pede raster.
    expect(o.logo).toMatch(/\.(png|jpg|gif)$/);
  });

  it('GEO-09: sameAs só existe se houver perfil verificado', () => {
    /**
     * `sameAs` afirma "estas contas são a mesma entidade que este site". Um
     * perfil errado não devolve erro — ele associa a marca a outra coisa, em
     * silêncio. Aqui morava um `LINKEDIN_URL = '#'`, e é exatamente o valor que
     * teria acabado nesta lista.
     */
    if (SOCIAL_PROFILES.length === 0) {
      expect(
        'sameAs' in org(),
        'sameAs declarado sem nenhum perfil verificado em constants/links.ts'
      ).toBe(false);
    } else {
      expect(org().sameAs).toEqual(SOCIAL_PROFILES);
      for (const url of org().sameAs) expect(url).toMatch(/^https:\/\//);
    }
  });

  it('GEO-10: o que a Service promete é o que o cartão promete', () => {
    /**
     * O ponto do achado inteiro. As Services saem do MESMO array que os
     * cartões renderizam — um caminho cortado do catálogo some do schema no
     * mesmo build, em vez de continuar sendo oferecido a um motor de busca
     * depois de deixar de ser oferecido ao visitante.
     */
    const services = tipo('Service');
    const texto = visibleText(home);

    for (const caminho of PATHS) {
      const s = services.find((x) => x.name === caminho.label);
      expect(s, `nenhuma Service para "${caminho.label}"`).toBeDefined();
      expect(s.description).toBe(caminho.promise);
      expect(s.serviceType).toBe(caminho.tag);

      // E a promessa do schema tem que estar na tela, não só no schema.
      expect(texto, `a promessa de "${caminho.label}" não aparece na página`).toContain(
        caminho.promise
      );
    }
  });

  it('GEO-11: toda referência por @id aponta para um bloco que existe', () => {
    // Um `provider: {@id}` órfão faz o grafo inteiro perder o vínculo com o
    // negócio — e falha em silêncio, porque o JSON continua válido.
    const ids = new Set(blocos.map((b) => b['@id']).filter(Boolean));
    const refs = [
      ...tipo('Service').map((s) => s.provider?.['@id']),
      tipo('WebSite')[0]?.publisher?.['@id'],
    ].filter(Boolean);

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ids, `@id órfão: ${ref}`).toContain(ref);
  });

  it('GEO-12: /privacidade declara a trilha, e a home não desperdiça bytes com ela', () => {
    const priv = readFileSync(resolve(dist, 'privacidade/index.html'), 'utf-8');
    const trilha = ld(priv).find((b) => b['@type'] === 'BreadcrumbList');

    expect(trilha, '/privacidade sem BreadcrumbList').toBeDefined();
    expect(trilha.itemListElement).toHaveLength(2);
    expect(trilha.itemListElement[0].item).toMatch(/^https:\/\//);
    expect(trilha.itemListElement[1].item).toContain('/privacidade');

    // O degrau é o nome da página, não o <title>: "Início › RIA — Política de
    // Privacidade" repetiria a marca dentro do caminho dela mesma.
    expect(trilha.itemListElement[1].name).toBe('Política de Privacidade');
    expect(trilha.itemListElement[1].name).not.toMatch(/^RIA/);

    // Na home o breadcrumb apontaria para si mesmo: o Google ignora e só ocupa
    // espaço no documento que mais precisa ser leve.
    expect(tipo('BreadcrumbList')).toHaveLength(0);
  });

  it('GEO-13: o card compartilhado não chega mudo', () => {
    /**
     * A og-image carrega TODO o nome da marca em texto DESENHADO — nenhuma
     * tecnologia assistiva alcança pixel. Sem `og:image:alt`, quem recebe o
     * link no WhatsApp por leitor de tela ouve "imagem" e mais nada.
     */
    for (const [rota, arquivo] of [
      ['/', 'index.html'],
      ['/privacidade', 'privacidade/index.html'],
    ]) {
      const html = readFileSync(resolve(dist, arquivo), 'utf-8');
      const alt = html.match(/property="og:image:alt" content="([^"]+)"/)?.[1];
      expect(alt, `${rota} sem og:image:alt`).toBeTruthy();
      expect(alt!.length).toBeGreaterThan(20);
      expect(html).toMatch(/name="twitter:image:alt"/);
    }
  });

  it('GEO-14: o cargo do schema vem de content/consultant.ts, não de uma cópia', () => {
    // O comentário que estava aqui admitia a duplicação: "a concordancia e
    // manual, e divergir aqui faz o schema afirmar um cargo que a tela nao
    // mostra". Agora atravessa pela mesma ponte que o FAQ e os metadados.
    expect(org().founder.jobTitle).toBe(CONSULTANT.role);
    expect(org().founder.name).toBe(CONSULTANT.name);
    const prerender = readFileSync(resolve(process.cwd(), 'scripts/prerender.js'), 'utf-8');
    expect(prerender).toContain('CONSULTANT.role');
    expect(prerender, 'o cargo voltou a ser copiado à mão').not.toMatch(
      /jobTitle:\s*'Engenheiro/
    );
  });
});
