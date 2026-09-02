import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { ROUTE_META, metaFor } from '../src/content/meta';
import { FRONTS } from '../src/content/fronts';
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
    .replace(/\s+/g, ' ')
    .trim();
}

describe.skipIf(!built)('GEO — a página é legível sem JavaScript', () => {
  it('GEO-01: o corpo publicado não é um shell vazio', () => {
    expect(home).not.toContain('<div id="root"></div>');
    expect(visibleText(home).length).toBeGreaterThan(2000);
  });

  it('GEO-02: a proposta de valor está no HTML, não só no bundle', () => {
    const texto = visibleText(home);
    // Antes este teste procurava "achar o gargalo", texto de um CTA do hero que
    // desde então mudou. Ancorar num rótulo de botão é frágil: a copy do topo é
    // a parte da página que mais gira. O nome do produto de entrada é o que a
    // página precisa mesmo entregar ao crawler — e ele vem de content/offer.ts,
    // não de uma string solta.
    expect(texto).toContain('Diagnóstico de Gargalo');
  });

  it('GEO-03: as três frentes estão no HTML', () => {
    const texto = visibleText(home);
    for (const frente of ['Presença digital', 'Agente SDR', 'Automação de processos']) {
      expect(texto).toContain(frente);
    }
  });

  it('GEO-04: nenhum número de terceiro aparece sem a fonte junto', () => {
    /**
     * Este teste JÁ EXIGIU o contrário: que McKinsey, MIT, Cetic.br e HBR
     * estivessem citados e linkados no HTML. Eles vinham da dobra "O que os
     * dados dizem", que foi removida a pedido — e com ela saíram as quatro
     * únicas citações com link da página.
     *
     * O QUE SE PERDEU, escrito para não ser redescoberto por acaso: dado +
     * fonte + ano era a tática que fazia um motor generativo citar esta
     * página. Hoje ela não tem nenhuma. Se as evidências voltarem, elas vêm de
     * content/evidence.ts (que continua existindo, alimentando o agente) e
     * este teste volta a exigir o link.
     *
     * O que a guarda protege ENQUANTO ISSO: número de terceiro solto, sem
     * fonte ao lado, é pior que número nenhum — vira alegação. Se alguém
     * colar "95% dos pilotos" numa headline, o domínio do estudo tem de
     * aparecer no mesmo HTML.
     */
    const texto = visibleText(home);
    const citacoes: Array<[RegExp, RegExp]> = [
      [/\b88\s*%/, /McKinsey/],
      [/\b95\s*%/, /MIT|NANDA/],
      [/\b17\s*%/, /Cetic\.br/],
      [/\b2,24 milh(õ|o)es de leads/, /Harvard Business Review/],
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

  it('GEO-06: toda resposta do FAQPage também existe na página visível', () => {
    // A regressão que este teste tranca: até ago/2026 o FAQPage do index.html
    // continha a oferta inteira (preço, garantia) que NÃO aparecia em lugar
    // nenhum da tela — o crawler sabia mais que o comprador.
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const faq = blocks.map((b) => JSON.parse(b[1])).find((p) => p['@type'] === 'FAQPage');
    const texto = visibleText(home);

    // A oferta declarada no schema tem de estar visível na página.
    expect(texto).toContain('Diagnóstico de Gargalo');
    expect(faq.mainEntity.some((q: any) => q.answer ?? q.acceptedAnswer)).toBe(true);
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
    // A Frente 1 vende ser citável por estes agentes. Bloqueá-los por descuido
    // seria vender o oposto do que o site entrega.
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
    expect(locs.length).toBe(2);
    expect(locs.some((l) => l.endsWith('/privacidade'))).toBe(true);
    // Sitemap que lista página inexistente (ou omite uma que existe) é o erro
    // clássico; aqui as duas listas saem da mesma constante ROUTES.
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
 * As três frentes existiam só como texto solto no HTML — o motor tinha que
 * INFERIR que "Agente SDR 24/7" era um serviço. E o bloco do negócio não
 * declarava marca nem contato: sem `logo`, sem `image`, sem `telephone`.
 *
 * A ironia é o motivo de isto ser um achado e não um capricho: a Frente 1 do
 * catálogo vende exatamente "site que o ChatGPT e o Perplexity conseguem ler e
 * CITAR". Ser lido, o prerender resolveu. Ser citado depende de declarar.
 */
describe.skipIf(!built)('GEO-01 — schema.org completo', () => {
  const ld = (html: string) =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((b) =>
      JSON.parse(b[1])
    );

  const blocos = built ? ld(home) : [];
  const tipo = (t: string) => blocos.filter((b) => b['@type'] === t);
  const org = () => tipo('ProfessionalService')[0];

  it('GEO-07: a home declara negócio, site, uma oferta por frente e o FAQ', () => {
    expect(tipo('ProfessionalService')).toHaveLength(1);
    expect(tipo('WebSite')).toHaveLength(1);
    expect(tipo('FAQPage')).toHaveLength(1);
    expect(tipo('Service').length, 'nenhuma frente virou Service').toBe(FRONTS.length);
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
     * cartões renderizam — uma frente cortada do catálogo some do schema no
     * mesmo build, em vez de continuar sendo oferecida a um motor de busca
     * depois de deixar de ser oferecida ao visitante.
     */
    const services = tipo('Service');
    const texto = visibleText(home);

    for (const frente of FRONTS) {
      const s = services.find((x) => x.name === frente.label);
      expect(s, `nenhuma Service para "${frente.label}"`).toBeDefined();
      expect(s.description).toBe(frente.promise);
      expect(s.serviceType).toBe(frente.tag);

      // E a promessa do schema tem que estar na tela, não só no schema.
      expect(texto, `a promessa de "${frente.label}" não aparece na página`).toContain(
        frente.promise
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
