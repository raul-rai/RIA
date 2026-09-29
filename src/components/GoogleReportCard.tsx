import type { GoogleReport } from '../lib/lighthouse-report';
import type { GoogleFailure } from '../hooks/useSiteScan';

/**
 * A primeira nota.
 *
 * Velocidade, acessibilidade, praticas e SEO, medidos pelo Lighthouse do
 * Google (PageSpeed Insights). Esta coluna NAO se combina com a do Is Agentic:
 * sao instrumentos diferentes, e cada uma assina a sua fonte.
 *
 * Ausencia de medicao imprime "nao medido" com o motivo. Nunca zero: zero a tela
 * le como reprovacao, e nao houve reprovacao nenhuma.
 */

/** Uma escala de cor so para o cartao inteiro: nota, dimensoes e vitals. */
function toneOf(pct: number) {
  if (pct < 50) return { text: 'text-red-700', bar: 'bg-red-500' };
  if (pct < 80) return { text: 'text-amber-700', bar: 'bg-amber-500' };
  return { text: 'text-accent-dark', bar: 'bg-accent' };
}

// 'invalid-url' e erro de digitacao do visitante, nao falha do Google: o
// Lighthouse nem chegou a ser chamado, entao o texto nao pode acusa-lo.
const MOTIVO: Record<GoogleFailure, string> = {
  quota: 'a cota do PageSpeed estourou agora. Tente de novo em alguns minutos.',
  unreachable: 'o Lighthouse não devolveu uma leitura para este endereço.',
  'invalid-url': 'o endereço digitado não parece completo, então o Google nem chegou a ser consultado.',
};

export default function GoogleReportCard({
  report,
  failure,
}: {
  report: GoogleReport | null;
  failure: GoogleFailure | null;
}) {
  return (
    <section className="glass-panel rounded-[1.5rem] p-5 md:p-8 text-left" aria-label="Laudo do Google">
      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">
        Fonte: Google Lighthouse (PageSpeed Insights)
      </p>

      {!report ? (
        <p className="mt-4 text-slate-600">
          <strong className="text-slate-800">não medido</strong>
          {failure ? ` — ${MOTIVO[failure]}` : ' — a medição ainda não terminou.'}
        </p>
      ) : (
        <>
          <p className={`mt-3 text-5xl font-black ${toneOf(report.score).text}`}>
            {report.score}
            <span className="text-xl text-slate-500">/100</span>
          </p>
          <p className="text-slate-800 font-semibold">{report.reading.nome}</p>
          <p className="text-sm text-slate-600 mt-1">{report.reading.texto}</p>

          <ul className="mt-5 space-y-3">
            {report.dimensions.map((d) => (
              <li key={d.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{d.nome}</span>
                  <span className={`font-semibold ${toneOf(d.pct).text}`}>{d.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-900/10 mt-1" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${toneOf(d.pct).bar}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Confere o tamanho, nao a lista: um vital sem nota numerica e omitido
              pelo parser, e a grade pode chegar com menos de quatro (ou nenhum). */}
          {report.webVitals.length > 0 ? (
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {report.webVitals.map((v) => (
                <li key={v.id} className="glass-chip rounded-xl px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-600">
                    {v.name}
                  </span>
                  <span className={`font-black ${toneOf(v.score).text}`}>{v.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-slate-600">
              <strong className="text-slate-800">Core Web Vitals: não medido</strong> — o Google
              não devolveu os tempos de carregamento desta leitura.
            </p>
          )}
        </>
      )}
    </section>
  );
}
