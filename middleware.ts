// Negociação de conteúdo Markdown (acceptmarkdown.com).
//
// O PROBLEMA QUE ISTO RESOLVE
//
// Um agente que manda `Accept: text/markdown` para uma rota da RIA recebia
// `text/html` mesmo assim, e a resposta não trazia `Vary: Accept` — então um
// CDN podia guardar a variante HTML e entregá-la a quem pediu Markdown (ou o
// contrário), conforme qual caiu no cache primeiro. Este middleware serve a
// variante `.md` (gerada pelo prerender, das MESMAS fontes que o HTML) quando o
// Accept prefere Markdown, e marca `Vary: Accept` para o cache separar as duas.
//
// POR QUE MIDDLEWARE, E NÃO UM REWRITE NO vercel.json
//
// Um rewrite condicional por header no vercel.json só é avaliado DEPOIS do
// sistema de arquivos: como `/` já resolve para o index.html estático, o
// rewrite nunca dispararia. O middleware roda ANTES do sistema de arquivos, que
// é o único ponto onde dá para trocar a variante de `/` sem redirecionar.
//
// SEGURANÇA
//
// Só age nas rotas do matcher e só quando o Accept pede Markdown; qualquer
// falha (fetch, parsing) cai para `undefined`, que deixa a resposta estática
// normal seguir. Middleware que lança quebraria TODAS as respostas destas
// rotas — nenhuma negociação de formato vale esse risco.

/** Rota pública -> arquivo Markdown plano que o prerender emitiu em dist/. */
const MD_FOR: Record<string, string> = {
  '/': '/index.md',
  '/sobre': '/sobre.md',
  '/contato': '/contato.md',
  '/privacidade': '/privacidade.md',
};

/**
 * O visitante prefere Markdown?
 *
 * Puro e exportado para o teste (tests/markdown-negotiation.test.ts). Lê os
 * q-values do Accept: só devolve `true` quando `text/markdown` foi pedido
 * explicitamente e sua qualidade empata ou supera a de `text/html`. Um
 * navegador comum manda `text/html,...,*​/*` sem `text/markdown` e cai no
 * `false` — continua recebendo HTML.
 */
export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false;

  let markdownQ = -1;
  let htmlQ = -1;

  for (const raw of acceptHeader.split(',')) {
    const segments = raw.trim().toLowerCase().split(';');
    const type = segments[0].trim();
    if (!type) continue;

    let q = 1;
    for (const param of segments.slice(1)) {
      const match = param.trim().match(/^q=(\d*(?:\.\d+)?)$/);
      if (match) q = Number.parseFloat(match[1]);
    }

    if (type === 'text/markdown' || type === 'text/x-markdown') {
      markdownQ = Math.max(markdownQ, q);
    } else if (type === 'text/html') {
      htmlQ = Math.max(htmlQ, q);
    }
  }

  if (markdownQ <= 0) return false; // não pedido, ou recusado com q=0
  if (htmlQ < 0) return true; // pediu Markdown e não pediu HTML
  return markdownQ >= htmlQ; // desempate a favor de Markdown
}

export const config = {
  matcher: ['/', '/sobre', '/contato', '/privacidade'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  try {
    const url = new URL(request.url);
    const markdownPath = MD_FOR[url.pathname];

    if (markdownPath && prefersMarkdown(request.headers.get('accept'))) {
      const upstream = await fetch(new URL(markdownPath, url.origin), {
        headers: { accept: 'text/markdown' },
      });

      if (upstream.ok) {
        return new Response(upstream.body, {
          status: 200,
          headers: {
            'content-type': 'text/markdown; charset=utf-8',
            vary: 'Accept',
            'cache-control': 'public, max-age=0, must-revalidate',
            'x-content-type-options': 'nosniff',
          },
        });
      }
    }
  } catch {
    // Cai para o comportamento estático normal. Ver a nota de SEGURANÇA acima.
  }

  return undefined;
}
