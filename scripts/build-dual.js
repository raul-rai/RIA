// Build da home publicada, a partir de um commit congelado.
//
// POR QUE ISTO EXISTE
//
// A home NAO e construida do HEAD: ela sai de um commit escolhido a mao, e quem
// a congela e o git — que e para isso que ele serve. Isso existe porque o codigo
// em desenvolvimento anda mais rapido do que a decisao de publicar.
//
// O /v2 FOI REMOVIDO (22/08/2026)
//
// Ate aqui este script publicava DUAS versoes: a home congelada em `/` e o HEAD
// em `/v2`, para avaliacao lado a lado antes de promover. O /v2 existia para
// responder uma pergunta — qual versao do site vale — e a pergunta foi
// respondida: sao seis frentes, e a home publicada ja as vende.
//
// Mantido depois disso, o /v2 so servia para confundir: duas URLs do mesmo
// negocio, com numeros diferentes de frentes, e a certeza de que uma das duas
// estaria sempre desatualizada. Rascunho que sobrevive a propria decisao vira
// armadilha.
//
// O nome do arquivo continua build-dual DE PROPOSITO: renomear quebraria o
// `npm run build:dual` que outra sessao deste repositorio possa estar chamando.
// E um nome grande demais para o que o script faz hoje.
//
// A tentação seria forkar o código — duplicar componentes, contextos e conteúdo
// num diretório `v1/`. Seria caro e permanente: `lib/wave-scene.ts`, por
// exemplo, tem constantes de módulo que DIFEREM entre as versões (a submersão
// foi recalibrada de 0.85 para 0.832 quando o site ganhou a sétima dobra), e
// toda mudança futura passaria a exigir a pergunta "em qual versão?".
//
// Aqui não há fork. A home é construída a partir de um COMMIT; a versão nova,
// do HEAD atual. Quem congela a home é o git, que é para isso que ele serve.
//
// POR QUE NÃO USA WORKTREE
//
// A primeira versão usava `git worktree` com o node_modules ligado por junção.
// O rollup não resolve o próprio binário nativo através da junção
// (MODULE_NOT_FOUND em @rollup/rollup-win32-x64-msvc), e instalar do zero no
// worktree custaria minutos por build. Alternar o checkout no diretório real
// usa o node_modules que comprovadamente funciona.
//
// Isso exige árvore LIMPA — o script recusa rodar de outro jeito, porque um
// checkout com alterações pendentes é como se perde trabalho.
//
// Uso:
//   node scripts/build-dual.js [ref-da-home]     (padrão: HEAD~1)

import { execFileSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist-site');

/**
 * shell:false SEMPRE. O caminho deste projeto tem espaço e acento ("Área de
 * Trabalho"); com shell:true o Node concatena os argumentos sem citar nada e o
 * git recebe o caminho picado, falhando com status 129.
 *
 * Como shell:false não resolve `.cmd` no Windows, o Vite é invocado pelo seu
 * bin JS com o próprio Node, nunca por `npx`.
 */
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'inherit', cwd: root, shell: false, ...opts });

const capture = (cmd, args) =>
  execFileSync(cmd, args, { encoding: 'utf-8', cwd: root }).trim();

const vite = (args, env) =>
  run(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), ...args], {
    env: { ...process.env, ...env },
  });

// ─── Guardas ────────────────────────────────────────────────────────────────
const sujo = capture('git', ['status', '--porcelain']);
if (sujo) {
  console.error('\n✗ A árvore tem alterações não commitadas.');
  console.error('  Este script alterna o checkout; rodar assim arriscaria seu trabalho.');
  console.error('  Commite ou guarde antes:\n');
  console.error(sujo.split('\n').slice(0, 10).join('\n'));
  process.exit(1);
}

const LEGACY_REF = process.argv[2] || 'HEAD~1';
const legacySha = capture('git', ['rev-parse', LEGACY_REF]);
const legacyShort = capture('git', ['rev-parse', '--short', LEGACY_REF]);
const legacyAssunto = capture('git', ['log', '-1', '--format=%s', LEGACY_REF]);

/** Para onde voltar. Nome do branch, ou o SHA se já estiver destacado. */
let voltarPara = capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

/** Se a home saiu com conteudo no HTML. Lido pela conferencia la embaixo. */
let homePrerender = false;
if (voltarPara === 'HEAD') voltarPara = capture('git', ['rev-parse', 'HEAD']);

const restaurar = () => {
  const atual = capture('git', ['rev-parse', 'HEAD']);
  if (atual === legacySha) run('git', ['checkout', '--quiet', voltarPara]);
};

// Nenhum caminho de saída pode deixar o repositório no commit antigo.
process.on('exit', restaurar);
process.on('SIGINT', () => process.exit(130));

try {
  console.log(`\n═══ 1/2 · Home congelada ═══`);
  console.log(`    ${legacyShort} — ${legacyAssunto}\n`);

  run('git', ['checkout', '--quiet', '--detach', legacySha]);

  vite(['build'], { SITE_BASE: '/' });

  /**
   * Prerender da home, quando o ref congelado souber fazer isso.
   *
   * Ate ago/2026 esta etapa era so `vite build`, e o comentario aqui dizia que
   * "a home antiga nao tem prerender" — descricao de um defeito escrita como se
   * fosse uma decisao. A home publicada saia com `<div id="root"></div>` e
   * mais nada, numa pagina cuja Frente 1 vende ser citavel por IA e cujo cartao
   * de diagnostico pergunta ao visitante se o site DELE sobrevive aos motores
   * de IA.
   *
   * A condicao nao e cerimonia: este script aceita QUALQUER ref como home, e
   * refs anteriores ao porte do prerender nao tem src/entry-server.tsx. Sem a
   * checagem, apontar o script para um commit antigo quebraria o build inteiro
   * em vez de reproduzir aquele commit como ele era — que e a unica coisa que
   * um congelamento precisa saber fazer.
   */
  homePrerender = existsSync(resolve(root, 'src/entry-server.tsx'));
  if (homePrerender) {
    vite(['build', '--ssr', 'src/entry-server.tsx', '--outDir', 'dist-ssr'], { SITE_BASE: '/' });
    run(process.execPath, ['scripts/prerender.js'], { env: { ...process.env, SITE_BASE: '/' } });
  } else {
    console.log('    (ref sem entry-server.tsx — home sai como SPA, sem prerender)');
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(resolve(root, 'dist'), outDir, { recursive: true });
  console.log(`    home -> dist-site/`);

  run('git', ['checkout', '--quiet', voltarPara]);
} finally {
  restaurar();
}

console.log(`\n═══ 2/2 · Roteamento ═══`);

/**
 * Uma SPA, um fallback.
 *
 * Enquanto existia o /v2 havia duas, e a ordem das regras importava. Com uma so,
 * qualquer caminho que nao seja arquivo real cai no index.html — /v2 inclusive,
 * que passa a servir a home em vez de 404. E de proposito: quem tiver a URL
 * antiga salva chega no site certo, em vez de numa parede.
 */
writeFileSync(
  resolve(outDir, 'vercel.json'),
  JSON.stringify(
    {
      cleanUrls: true,
      rewrites: [
        { source: '/(.*)', destination: '/index.html' },
      ],
    },
    null,
    2
  ) + '\n'
);

/**
 * robots.txt da RAIZ.
 *
 * A home congelada nunca teve um. Ele nasceu para dizer que /v2 estava fora do
 * indice; com o /v2 removido, o Disallow saiu junto — bloquear um caminho que
 * nao existe mais so ensina o crawler a desconfiar do arquivo.
 *
 * O arquivo continua existindo porque site sem robots.txt e um 404 a cada visita
 * de crawler, e porque o sitemap merece um lugar declarado.
 */
writeFileSync(
  resolve(outDir, 'robots.txt'),
  [
    '# RIA',
    '',
    'User-agent: *',
    'Allow: /',
    '',
  ].join('\n')
);
console.log('    vercel.json + robots.txt');

// ─── Conferência ────────────────────────────────────────────────────────────
const home = readFileSync(resolve(outDir, 'index.html'), 'utf-8');

const check = (ok, label) => console.log(`    ${ok ? '✓' : '✗'} ${label}`);
console.log('\n═══ Conferência ═══');
check(
  homePrerender ? !home.includes('<div id="root"></div>') : home.includes('<div id="root"></div>'),
  homePrerender ? 'home: prerenderizada, com conteúdo no HTML' : 'home: SPA (ref sem prerender)'
);
check(!/content="noindex/.test(home), 'home: indexável');
check(!existsSync(resolve(outDir, 'v2')), 'nenhum /v2 na saida');

// ─── Saída pré-construída da Vercel (Build Output API v3) ───────────────────
//
// `vercel deploy dist-site` NÃO serve: passar um caminho faz o CLI criar um
// PROJETO NOVO com o nome do diretório, em vez de publicar no projeto já
// ligado em .vercel/project.json. Aprendido do jeito difícil — nasceu um
// projeto "dist-site" com proteção de autenticação, que teve de ser removido.
//
// O formato abaixo é o que `vercel deploy --prebuilt` espera, e ele respeita
// o vínculo do projeto.
const vercelOut = resolve(root, '.vercel/output');
rmSync(vercelOut, { recursive: true, force: true });
mkdirSync(resolve(vercelOut, 'static'), { recursive: true });
cpSync(outDir, resolve(vercelOut, 'static'), { recursive: true });

/**
 * Roteamento em formato Build Output API.
 *
 * `handle: filesystem` primeiro: arquivo real sempre ganha do fallback. Sem
 * ele, /assets/index.js cairia no index.html e o navegador receberia HTML onde
 * esperava JavaScript.
 *
 * Depois, a coringa — a unica regra que sobrou. Sem o /v2 nao ha mais duas SPAs
 * disputando prefixo.
 */
writeFileSync(
  resolve(vercelOut, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // cleanUrls da home, explícito porque a saída pré-construída não herda
        // o cleanUrls do vercel.json do projeto.
        { src: '^/privacidade/?$', dest: '/privacidade.html' },
        { handle: 'filesystem' },
        { src: '/.*', dest: '/index.html' },
      ],
    },
    null,
    2
  ) + '\n'
);
console.log('    .vercel/output pronto para `vercel deploy --prebuilt`');

/**
 * Restaura o invariante "dist/ é o build do código ATUAL".
 *
 * O passo 1 constrói a home ANTIGA em dist/, e é de lá que tests/seo.test.ts
 * lê para checar prerender, JSON-LD e canonical. Sem esta reconstrução, rodar
 * o build combinado deixava 9 testes falhando — não por regressão no código,
 * mas porque o alvo do teste virava a versão errada. Um build que quebra a
 * suíte sem nada estar quebrado é pior que inconveniente: ensina a ignorar
 * vermelho.
 */
console.log('\n═══ Restaurando dist/ para o codigo atual ═══\n');
vite(['build'], { SITE_BASE: '/' });
vite(['build', '--ssr', 'src/entry-server.tsx', '--outDir', 'dist-ssr'], { SITE_BASE: '/' });
run(process.execPath, ['scripts/prerender.js'], { env: { ...process.env, SITE_BASE: '/' } });

console.log(`\n✓ Site em dist-site/`);
console.log(`    /     home congelada em ${legacyShort}\n`);
