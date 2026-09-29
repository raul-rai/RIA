import { useSiteScore } from '../context/SiteScoreContext';
import { useScan } from '../hooks/useSiteScan';
import GoogleReportCard from './GoogleReportCard';
import AgenticReportCard from './AgenticReportCard';

/**
 * O capitulo do laudo.
 *
 * Duas colunas, dois instrumentos, nenhuma nota somada. Cada uma resolve
 * sozinha: o Lighthouse costuma chegar antes do Is Agentic, e quem chegou
 * primeiro publica primeiro em vez de esperar o outro.
 *
 * Consome `useScan()`, o leitor do provedor, e nunca a funcao de estado interna:
 * uma segunda instancia mediria aqui e o formulario do hero nao veria nada.
 */
export default function ReportSection() {
  const { google, agentic, hasNoWebsite, target } = useSiteScore();
  const { googleFailure, agenticFailure, progress, phase } = useScan();

  if (hasNoWebsite) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 text-center">
        <p className="reading-surface inline-block px-4 py-3 rounded-2xl text-slate-700">
          Sem site não há o que medir — e é essa a medição. Quem procura o que você vende
          hoje não encontra nada para ler, citar ou recomendar. O caminho aqui é criar.
        </p>
      </div>
    );
  }

  if (phase === 'idle' && !google && !agentic) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 text-center">
        <p className="reading-surface inline-block px-4 py-3 rounded-2xl text-slate-700">
          Informe o endereço lá em cima e eu mostro as duas notas aqui: a do Google,
          que mede velocidade e estrutura, e a dos agentes de IA, que mede se o ChatGPT
          consegue ler e citar a sua página.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4">
      {target && (
        <p className="text-center text-sm text-slate-700 mb-4">
          {phase === 'running' ? 'Medindo' : 'Laudo de'}{' '}
          <strong className="text-slate-900">{target}</strong> — dois instrumentos
          independentes, duas notas separadas.
        </p>
      )}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2" aria-live="polite">
        <GoogleReportCard report={google} failure={googleFailure} />
        <AgenticReportCard report={agentic} failure={agenticFailure} progress={progress} />
      </div>
    </div>
  );
}
