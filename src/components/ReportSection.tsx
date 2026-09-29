import { ArrowUpRight } from 'lucide-react';
import { useSiteScore } from '../context/SiteScoreContext';
import { useAgentIntent } from '../context/AgentIntentContext';
import { useScan, type ScanPhase } from '../hooks/useSiteScan';
import type { GoogleReport } from '../lib/lighthouse-report';
import type { AgenticReport } from '../lib/agentic-report';
import { track } from '../lib/analytics';
import GoogleReportCard from './GoogleReportCard';
import AgenticReportCard from './AgenticReportCard';

/**
 * O capitulo do laudo.
 *
 * Duas colunas, dois instrumentos, nenhuma nota somada, e a tela diz isso em
 * voz alta: nao existe nota geral. Cada uma resolve
 * sozinha: o Lighthouse costuma chegar antes do Is Agentic, e quem chegou
 * primeiro publica primeiro em vez de esperar o outro.
 *
 * Consome `useScan()`, o leitor do provedor, e nunca a funcao de estado interna:
 * uma segunda instancia mediria aqui e o formulario do hero nao veria nada.
 */

/**
 * O chamado ao agente so aparece com o laudo fechado e ao menos uma nota na mao.
 *
 * Fechado: com o Lighthouse ja publicado e o Is Agentic ainda rodando, a fala do
 * agente diria "a nota de prontidao nao foi medida" sobre uma medicao que so nao
 * terminou. Ao menos uma nota: sem nenhuma, nao ha o que o agente comentar — o
 * laudo ja imprime o motivo de cada falha, e a conversa nasce de outro botao.
 * So testa presenca (`!== null`): a nota em si, zero inclusive, nao e lida aqui.
 */
function podeChamarAgente(
  phase: ScanPhase,
  google: GoogleReport | null,
  agentic: AgenticReport | null
): boolean {
  return phase === 'done' && (google !== null || agentic !== null);
}

export default function ReportSection() {
  const { google, agentic, hasNoWebsite, target } = useSiteScore();
  const { googleFailure, agenticFailure, progress, phase } = useScan();
  const { requestIntent } = useAgentIntent();

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
          <strong className="text-slate-900">{target}</strong>
        </p>
      )}
      {/* Fora do `target &&` de proposito: toda vez que as duas colunas aparecem,
          a negacao aparece junto. Dois "/100" lado a lado convidam a somar de cabeca. */}
      <p className="text-center text-sm text-slate-700 mb-4">
        Não existe nota geral: cada instrumento mede uma coisa diferente, e os dois
        números não se somam nem se comparam.
      </p>
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2" aria-live="polite">
        <GoogleReportCard report={google} failure={googleFailure} />
        <AgenticReportCard report={agentic} failure={agenticFailure} progress={progress} />
      </div>
      {podeChamarAgente(phase, google, agentic) && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              track('cta_click', { location: 'report' });
              // A intencao le as duas notas do estado, cada uma na sua voz; a que
              // nao foi medida chega como ausencia, nunca como zero.
              requestIntent('report-result');
            }}
            className="px-6 py-3.5 w-full md:w-auto bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
          >
            Entender este laudo <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
