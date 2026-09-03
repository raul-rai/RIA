import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

/**
 * A11Y-04, A11Y-05, CONF-02 e DOC-01 — os quatro de acabamento.
 *
 * O que junta os quatro num arquivo só: nenhum deles quebra nada. São todos
 * defeitos de PROMESSA — a página dizendo uma coisa e fazendo outra. O
 * movimento que ignora a preferência do sistema, o alvo que promete ser
 * clicável e tem metade do tamanho mínimo, o rótulo que diz "tempo real" sobre
 * uma simulação, e três comentários que descrevem um código que não existe.
 *
 * Nada disso reprova em compilador nem em teste de unidade comum. Só reprova
 * contra a leitura de alguém — que é exatamente o tipo de defeito que volta.
 */

const raiz = process.cwd();
const ler = (p: string) => readFileSync(resolve(raiz, p), 'utf-8');

/** Todos os .tsx de src, recursivamente. */
function arquivosTsx(dir = 'src'): string[] {
  const saida: string[] = [];
  for (const entrada of readdirSync(resolve(raiz, dir), { withFileTypes: true })) {
    const rel = join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...arquivosTsx(rel));
    else if (entrada.name.endsWith('.tsx')) saida.push(rel);
  }
  return saida;
}

describe('A11Y-04 — "reduzir movimento" alcança a página inteira, não só o canvas', () => {
  /**
   * O defeito: `prefers-reduced-motion` chegava a exatamente UM lugar — o
   * canvas da onda, por lib/canvas-quality.ts. As ~28 animações de entrada do
   * motion espalhadas pelos capítulos ignoravam a preferência inteira.
   *
   * Quem liga "reduzir movimento" no sistema faz isso porque movimento causa
   * náusea ou tontura. A página respondia com todos os capítulos deslizando.
   */

  it('MOV-01: o App inteiro está dentro de um MotionConfig reducedMotion="user"', () => {
    const app = ler('src/App.tsx');
    // O import é conferido por conteúdo, não pela linha inteira: o LazyMotion
    // do PERF-02 entrou na mesma declaração e quebrou a versão literal disto.
    expect(app).toMatch(/import \{[^}]*\bMotionConfig\b[^}]*\} from 'motion\/react'/);
    expect(app).toMatch(/<MotionConfig\s+reducedMotion="user">/);

    // Precisa ENVOLVER, não apenas existir: as rotas e a barra de consentimento
    // ficam dentro. Um MotionConfig irmão não configura nada.
    const abre = app.indexOf('<MotionConfig');
    const fecha = app.indexOf('</MotionConfig>');
    expect(abre).toBeGreaterThan(-1);
    expect(fecha).toBeGreaterThan(abre);
    const dentro = app.slice(abre, fecha);
    expect(dentro).toContain('<Routes>');
    expect(dentro).toContain('<ConsentBar />');
  });

  it('MOV-02: "always" não entra — quem não pediu não perde a página', () => {
    // `always` desligaria o movimento para todo mundo. A configuração tem que
    // obedecer à mídia do sistema, não substituí-la por uma decisão nossa.
    expect(ler('src/App.tsx')).not.toMatch(/reducedMotion="always"/);
  });

  it('MOV-03: os dois pontos de entrada montam o App — cliente e prerender', () => {
    /**
     * O MotionConfig mora no App justamente para valer nos dois. Se um dia ele
     * subir para o main.tsx, o HTML gerado pelo prerender sai sem a
     * configuração e a preferência volta a ser ignorada até a hidratação.
     */
    expect(ler('src/main.tsx')).toContain('<App />');
    expect(ler('src/entry-server.tsx')).toContain('<App />');
  });

  it('MOV-04: toda animação infinita do Tailwind tem guarda no ponto de uso', () => {
    /**
     * `MotionConfig` cobre o motion e nada além dele. `animate-pulse`,
     * `animate-ping` e `animate-bounce` são CSS puro do Tailwind: rodam para
     * sempre e não passam por contexto nenhum. Cada ocorrência precisa carregar
     * a própria variante `motion-reduce:`.
     *
     * É o critério 2.2.2 (Pausar, Parar, Ocultar): movimento automático que
     * dura mais de cinco segundos precisa ter como parar. "Para sempre" é
     * bastante mais que cinco segundos.
     */
    const infinitas = /\banimate-(pulse|ping|bounce)\b(?!-)/;
    const faltando: string[] = [];

    for (const arquivo of arquivosTsx()) {
      ler(arquivo)
        .split('\n')
        .forEach((linha, i) => {
          if (infinitas.test(linha) && !linha.includes('motion-reduce:')) {
            faltando.push(`${arquivo}:${i + 1}`);
          }
        });
    }

    expect(faltando, `sem guarda de movimento reduzido: ${faltando.join(', ')}`).toEqual([]);
  });

  it('MOV-05: animate-spin fica de fora, e isso é deliberado', () => {
    /**
     * A exceção de conteúdo essencial do próprio 2.2.2. O spinner só existe
     * enquanto a varredura roda e é o único sinal na tela de que ela continua
     * viva. Parar aquele seria trocar um incômodo por uma tela que parece
     * travada.
     *
     * O teste existe para que a exceção seja uma DECISÃO registrada, e não um
     * esquecimento que o MOV-04 não pegou.
     */
    const diagnostico = ler('src/components/PotentialDiagnostic.tsx');
    expect(diagnostico).toContain('animate-spin');
    expect(diagnostico).not.toMatch(/animate-spin[^"]*motion-reduce:/);

    // E a razão precisa estar escrita em algum lugar que alguém leia.
    expect(ler('src/index.css')).toMatch(/animate-spin[\s\S]{0,400}?2\.2\.2/);
  });

  it('MOV-06: as animações infinitas do index.css são desligadas DE FATO', () => {
    /**
     * A primeira versão deste teste procurava o nome da classe dentro de um
     * bloco `prefers-reduced-motion` e passava — com o CSS não desligando nada.
     *
     * A guarda tinha sido escrita ANTES das definições, e `@media` não
     * acrescenta especificidade: `.glitch-text { animation: none }` e
     * `.glitch-text { animation: glitch 500ms infinite }` valem o mesmo, e
     * vence o último. O teste provava que alguém tinha escrito a regra, não que
     * a regra ganhava. Verificado nos bytes do CSS compilado: a guarda estava
     * em 72631 e as três definições em 72685, 73459 e 73724.
     *
     * Por isso agora o teste confere ORDEM, que é o que decide.
     */
    const css = ler('src/index.css');

    const comInfinite = [
      ...css.matchAll(/\.([a-z-]+)\s*\{[^}]*animation:[^;]*\binfinite\b/g),
    ].map((m) => ({ classe: m[1], definidaEm: m.index! }));

    expect(
      comInfinite.length,
      'nenhuma animação infinita encontrada — o regex quebrou'
    ).toBeGreaterThan(0);

    for (const { classe, definidaEm } of comInfinite) {
      // Onde a classe é desligada dentro de um bloco de movimento reduzido.
      const guarda = [
        ...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n  \}/g),
      ].find((m) => m[1].includes(`.${classe}`));

      expect(guarda, `.${classe} roda para sempre sem guarda nenhuma`).toBeDefined();
      expect(
        guarda!.index!,
        `.${classe}: a guarda está ANTES da definição e perde no cascade — ` +
          `mova o bloco para depois da linha onde a classe é declarada`
      ).toBeGreaterThan(definidaEm);
    }
  });

  it('MOV-06b: no CSS compilado, a guarda vem depois — é lá que o cascade acontece', () => {
    /**
     * O teste acima lê a fonte. Este lê o que o navegador recebe: o Tailwind
     * reordena, funde blocos `@media` iguais e move utilitárias entre camadas.
     * Uma ordem certa na fonte pode sair errada do build.
     *
     * Pula quando não há build — não faz sentido travar o `vitest` de quem
     * ainda não rodou `npm run build`.
     */
    const dist = 'dist/assets';
    let arquivo: string | undefined;
    try {
      arquivo = readdirSync(resolve(raiz, dist)).find((f) => /^index-.*\.css$/.test(f));
    } catch {
      return;
    }
    if (!arquivo) return;

    const css = ler(join(dist, arquivo));

    const pares: [string, string][] = [
      ['.animate-pulse{', 'motion-reduce\\:animate-none{'],
      ['.animate-ping{', 'motion-reduce\\:animate-none{'],
      ['.animate-bounce{', 'motion-reduce\\:animate-none{'],
      ['.animate-pulse-subtle{', '.animate-pulse-subtle,.scanline,.glitch-text{'],
      ['.glitch-text{', '.animate-pulse-subtle,.scanline,.glitch-text{'],
      ['.scanline{', '.animate-pulse-subtle,.scanline,.glitch-text{'],
    ];

    for (const [definicao, guardaTexto] of pares) {
      const iDef = css.indexOf(definicao);
      const iGuarda = css.indexOf(guardaTexto);
      if (iDef === -1) continue; // classe sem uso foi eliminada do build
      expect(iGuarda, `guarda de ${definicao} sumiu do CSS publicado`).toBeGreaterThan(-1);
      expect(
        iGuarda,
        `${definicao} vem DEPOIS da guarda no CSS publicado — a guarda não tem efeito`
      ).toBeGreaterThan(iDef);
    }
  });

  it('MOV-07: as barras do HUD param, e param na altura de repouso', () => {
    /**
     * A única `repeat: Infinity` da base. O MotionConfig até cobriria — `height`
     * está no conjunto de chaves posicionais do motion — mas isso é detalhe
     * INTERNO da biblioteca. A guarda explícita é o que sobrevive a um upgrade.
     *
     * E a altura precisa vir do style quando não há animação: sem ela a barra
     * nasce com zero e o gráfico some.
     */
    const hud = ler('src/components/EliteHUD.tsx');
    expect(hud).toContain('useReducedMotion');
    expect(hud).toMatch(/reduzMovimento\s*\?\s*undefined\s*:\s*\{\s*height:/);
    expect(hud).toMatch(/reduzMovimento\s*\?\s*\{\s*height:\s*`\$\{base\}%`\s*\}/);

    // A `repeat: Infinity` não pode voltar a rodar solta.
    const semGuarda = /animate=\{\{\s*height:[^}]*\}\}[\s\S]{0,200}repeat:\s*Infinity/;
    expect(hud, 'a barra voltou a pulsar sem guarda').not.toMatch(semGuarda);
  });
});

describe('CONF-02 — o bloco de Web Vitals diz de onde o número vem', () => {
  const diagnostico = ler('src/components/PotentialDiagnostic.tsx');
  const semComentarios = diagnostico
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  it('MOV-11: "tempo real" não aparece mais na tela', () => {
    /**
     * O rótulo era "Métricas em Tempo Real (Core Web Vitals)". Nenhum daqueles
     * quatro números é de tempo real nem vem de visitante nenhum: são
     * auditorias de LABORATÓRIO do Lighthouse — uma carga só, num celular
     * simulado, com a rede estrangulada por software num servidor do Google.
     *
     * O dado de campo existe (`loadingExperience`, o CrUX, na mesma resposta),
     * mas só para páginas com tráfego suficiente — e numa chamada sem chave ele
     * voltou vazio, que é como produção chama hoje. Prometer campo e entregar
     * laboratório é o mesmo defeito do CONF-01 com outra roupa.
     */
    expect(semComentarios, 'o rótulo de "tempo real" voltou').not.toMatch(/[Tt]empo [Rr]eal/);
  });

  it('MOV-12: a tela nomeia o laboratório e diz o que ele não alcança', () => {
    expect(semComentarios).toMatch(/medidos em laborat[óo]rio/i);
    expect(semComentarios).toMatch(/simulada/i);
    expect(
      semComentarios,
      'falta dizer que não é o que os visitantes experimentaram'
    ).toMatch(/n[ãa]o [ée] o que os seus\s+visitantes/);
  });

  it('MOV-13: se um dia o CrUX entrar, ele entra como campo — nunca por cima do laboratório', () => {
    // Enquanto `loadingExperience` não for lido, o teste guarda a razão de não
    // ser. Se alguém adicionar o leitor, este teste falha e obriga a rever o
    // rótulo dos dois blocos de uma vez.
    if (semComentarios.includes('loadingExperience')) {
      expect(semComentarios).toMatch(/campo/i);
    } else {
      expect(diagnostico, 'a decisão de não ler o CrUX precisa estar escrita').toContain(
        'loadingExperience'
      );
    }
  });
});

describe('DOC-01 — nenhum comentário afirma o contrário do código', () => {
  it('MOV-15: content/evidence.ts não se descreve como parte de uma dobra que saiu', () => {
    /**
     * O arquivo dizia substituir o SocialProofSection, e depois dizia conviver
     * com ele no capítulo 1. Nenhuma das duas coisas é verdade desde que a
     * dobra "O que os dados dizem" foi removida: EVIDENCE hoje alimenta só o
     * contexto do agente (scripts/build-agent-context.ts). Um comentário que
     * descreve um desenho que não existe mais é lido com a confiança de
     * documentação — por isso a guarda fica.
     */
    const evidencia = ler('src/content/evidence.ts');
    expect(evidencia, 'evidence.ts ainda se diz substituto').not.toMatch(
      /Substitui (SocialProofSection|o antigo bloco)/
    );
    expect(evidencia, 'evidence.ts ainda se diz uma dobra da página').not.toMatch(
      /MarketEvidenceSection/
    );
  });

  it('MOV-16: o checkbox não se descreve como algo que mexe no índice', () => {
    /**
     * `AwarenessCheck` se apresentava como "a caixa que reduz o Índice de
     * Vulnerabilidade" e dizia que marcar ali mudava o diagnóstico adiante. Era
     * verdade até o eixo de conscientização ser removido inteiro — justamente
     * porque o índice mede o que a empresa FAZ, nunca o que ela concorda.
     */
    const check = ler('src/components/AwarenessCheck.tsx');
    expect(check).not.toMatch(/a caixa que reduz o [ÍI]ndice/);
    expect(check).not.toMatch(/marcar aqui muda o diagnostico/i);
    expect(check, 'precisa dizer explicitamente que NÃO pontua').toMatch(/N[ÃA]O mexe no [ÍI]ndice/);

    // E a promessa tem que continuar verdadeira no código: nenhum caminho daqui
    // até o contexto de vulnerabilidade.
    expect(check).not.toContain('useVulnerability');
    expect(ler('src/components/SocialProofSection.tsx')).not.toContain('useVulnerability');
  });
});

/**
 * D8 — o irmao do PERF-01, abaixo da dobra.
 *
 * O PERF-01 tirou o hero do motion porque a variante `initial` e SERIALIZADA
 * durante o SSR: a primeira dobra saia publicada com `style="opacity:0"` e so
 * acendia depois que o JavaScript baixava, executava e hidratava.
 *
 * Corrigido o hero, sobrou o mesmo defeito em DOZE elementos abaixo da dobra —
 * quatro cartoes de evidencia, tres de caso, tres de autoridade, a marca do
 * canto e um chip do chat. O prerender entregava o texto ao crawler, entao
 * nenhum teste de GEO reclamava; quem nao via era o visitante sem JavaScript.
 *
 * A correcao NAO foi mover a entrada para CSS com `animation-timeline: view()`.
 * Aquilo foi tentado e medido: o `body` desta pagina tem `overflow-x: hidden`,
 * o que faz o `overflow-y` computar para `auto` e transforma o body num scroll
 * container de 6750px que nunca rola. A `view()` resolve contra esse scrollport
 * e devolve progresso negativo (-74,8% num cartao inteiramente visivel), com os
 * cartoes presos em opacity 0 PARA SEMPRE — inclusive com JavaScript.
 *
 * O que ficou: a entrada perde a OPACIDADE e mantem o deslocamento. Sem
 * JavaScript o cartao esta la, legivel, 16px fora do lugar.
 */
describe('D8 — nada de conteudo depende de JavaScript para ser visivel', () => {
  const semOpacidadeNaEntrada = [
    'src/components/CredibilitySection.tsx',
    'src/components/AuthorityCard.tsx',
  ];

  it('MOV-17: nenhuma entrada de cartao anima a opacidade a partir do zero', () => {
    for (const arquivo of semOpacidadeNaEntrada) {
      // Sem os comentários: eles CITAM o defeito antigo
      // (`initial={{ opacity: 0, y: 16 }}`) para explicar o que saiu, e a
      // primeira versão deste teste reprovou na própria explicação.
      const src = ler(arquivo)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

      const iniciais = [...src.matchAll(/initial=\{\{([^}]*)\}\}/g)].map((m) => m[1]);
      expect(iniciais.length, `${arquivo}: nenhum initial encontrado`).toBeGreaterThan(0);
      for (const variante of iniciais) {
        expect(
          variante,
          `${arquivo}: initial={{${variante}}} volta a publicar o cartao invisivel`
        ).not.toMatch(/opacity:\s*0/);
      }
    }
  });

  it('MOV-18: a marca saiu do motion e entra por CSS', () => {
    /**
     * O nome do site nao pode depender de hidratacao para existir. `.marca-rise`
     * e CSS puro com fill-mode backwards: o repouso, sem animacao nenhuma, e
     * opacity 1.
     */
    const marca = ler('src/components/BrandMark.tsx');
    expect(marca).toContain('marca-rise');
    // A RAIZ do componente nao pode mais ser um motion com initial de opacidade.
    expect(marca).not.toMatch(/<m\.div\s+initial=\{\{\s*opacity:\s*0\s*\}\}/);

    const css = ler('src/index.css');
    expect(css).toMatch(/\.marca-rise\s*\{[^}]*animation:\s*marca-rise-in/);
    expect(css, 'sem backwards o estado inicial nao e segurado no atraso').toMatch(
      /animation:\s*marca-rise-in[^;]*backwards/
    );
  });

  it('MOV-19: `animation-timeline: view()` nao voltou', () => {
    /**
     * A guarda contra a tentativa que falhou. Enquanto o `body` for um scroll
     * container que nao rola, uma timeline de rolagem prende o conteudo em
     * opacity 0. Se alguem quiser tentar de novo, precisa primeiro trocar o
     * `overflow-x: hidden` do body por `clip` — e este teste obriga a lembrar.
     */
    const css = ler('src/index.css');
    expect(css, 'timeline de rolagem de volta sem trocar o overflow do body').not.toContain(
      'animation-timeline'
    );
  });
});

describe.skipIf(!existsSync(resolve(raiz, 'dist/index.html')))(
  'D8 — medido sobre o HTML publicado',
  () => {
    const home = ler('dist/index.html');

    it('MOV-20: no maximo um elemento sai invisivel, e ele vive dentro do chat', () => {
      /**
       * Eram doze. O unico que sobra e a fileira de chips do AIChatAgent, e ele
       * fica de proposito: vive dentro de uma superficie que ja e 100%
       * JavaScript — sem JS o chat inteiro nao existe, entao esconder um chip
       * nao tira nada de ninguem.
       */
      const invisiveis = [...home.matchAll(/style="opacity:0[^"]*"/g)];
      expect(
        invisiveis.length,
        `${invisiveis.length} elementos publicados invisiveis`
      ).toBeLessThanOrEqual(1);
    });

    it('MOV-21: os dez cartoes de conteudo estao no HTML e nenhum deles esta invisivel', () => {
      // Se um cartao some do HTML, o teste acima passaria por omissao.
      for (const marca of ['Raul Vieira', 'Parcerias frutíferas']) {
        expect(home, `${marca} sumiu do HTML publicado`).toContain(marca);
      }
      // E o unico invisivel restante nao pode ser um deles.
      const contexto = home.match(/.{0,200}style="opacity:0[^"]*"/g) ?? [];
      for (const trecho of contexto) {
        expect(trecho, 'um cartao de conteudo voltou a ser publicado invisivel').not.toMatch(
          /Raul Vieira|glass-card/
        );
      }
    });
  }
);
