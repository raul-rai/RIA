import {
  issuesByTier,
  type AgenticBucket,
  type AgenticFailure,
  type AgenticReport,
} from '../lib/agentic-report';

/**
 * A segunda nota.
 *
 * Mede o que o Lighthouse nao mede: se um agente de IA DESCOBRE, ACESSA e USA o
 * site. Nota e apontamentos vem do Is Agentic (Vercel Labs), e o laudo publico
 * deles fica linkado: quem publica numero publica a fonte conferivel.
 *
 * Esta coluna NAO se combina com a do Google. Sao instrumentos diferentes.
 *
 * Campo ausente na resposta e "nao medido", nunca zero: o parser devolve `null`
 * nos quatro campos de cada balde, e imprimir "null de null" ou "0 de 0" seria
 * fabricar um resultado que ninguem mediu.
 */

const MOTIVO: Record<AgenticFailure, string> = {
  'rate-limited':
    'a fila de varreduras encheu (são 10 por minuto, para o site inteiro). Tente daqui a um minuto.',
  unreachable: 'a varredura não completou desta vez.',
  'invalid-url': 'o endereço não parece completo.',
};

function toneOf(score: number) {
  if (score < 50) return 'text-red-700';
  if (score < 80) return 'text-amber-700';
  return 'text-accent-dark';
}

/** So aceita http(s): o link vem de uma API de terceiro e vira href. */
function linkSeguro(url: string): string | null {
  return /^https?:\/\//i.test(url) ? url : null;
}

/** "N de M <rotulo> passaram", ou "<rotulo>: nao medido" se a API nao mandou. */
function checagens(bucket: AgenticBucket, rotulo: string): string {
  if (bucket.passing === null || bucket.total === null) return `${rotulo}: não medido`;
  return `${bucket.passing} de ${bucket.total} ${rotulo} passaram`;
}

function Bloco({ titulo, itens }: { titulo: string; itens: ReturnType<typeof issuesByTier> }) {
  if (itens.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">{titulo}</h3>
      <ul className="mt-2 space-y-3">
        {itens.map((i) => (
          <li key={i.id} className="glass-chip rounded-xl px-3 py-2">
            <p className="font-semibold text-slate-800 text-sm">
              {i.name}
              <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-600">
                {i.result === 'failed' ? 'falhou' : 'parcial'}
              </span>
            </p>
            <p className="text-sm text-slate-600 mt-1">{i.details}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AgenticReportCard({
  report,
  failure,
  progress,
}: {
  report: AgenticReport | null;
  failure: AgenticFailure | null;
  progress: number;
}) {
  const laudo = report ? linkSeguro(report.reportUrl) : null;

  return (
    <section
      className="glass-panel rounded-[1.5rem] p-5 md:p-8 text-left"
      aria-label="Laudo de prontidão para agentes de IA"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">
        Fonte: Is Agentic (Vercel Labs)
      </p>

      {!report ? (
        <div className="mt-4">
          <p className="text-slate-600">
            <strong className="text-slate-800">não medido</strong>
            {failure ? ` — ${MOTIVO[failure]}` : ' — a varredura leva cerca de 20 segundos.'}
          </p>
          {!failure && (
            <div
              className="h-1.5 rounded-full bg-slate-900/10 mt-3"
              role="progressbar"
              aria-label="Progresso da varredura"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <p className={`mt-3 text-5xl font-black ${toneOf(report.score)}`}>
            {report.score}
            <span className="text-xl text-slate-500">/100</span>
          </p>
          {report.scoreLabel && (
            <p className="text-slate-800 font-semibold">{report.scoreLabel}</p>
          )}
          <p className="text-sm text-slate-600 mt-1">
            {checagens(report.essential, 'checagens essenciais')}.{' '}
            {checagens(report.recommended, 'checagens recomendadas')}.
          </p>

          <Bloco titulo="Essencial" itens={issuesByTier(report, 'essential')} />
          <Bloco titulo="Recomendado" itens={issuesByTier(report, 'recommended')} />
          {report.issues.length === 0 && (
            <p className="mt-5 text-sm text-slate-600">
              Nenhum apontamento listado nesta varredura.
            </p>
          )}

          {laudo ? (
            <a
              href={laudo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 text-sm font-semibold text-accent-dark underline underline-offset-4"
            >
              Conferir o laudo completo no Is Agentic
            </a>
          ) : (
            <p className="mt-5 text-sm text-slate-600">
              Link do laudo público: não medido (o Is Agentic não devolveu o endereço).
            </p>
          )}
        </>
      )}
    </section>
  );
}
