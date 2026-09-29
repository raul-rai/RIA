import { ArrowRight } from 'lucide-react';
import { PATHS } from '../content/paths';
import { useSiteScore } from '../context/SiteScoreContext';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * Criar ou otimizar.
 *
 * Substitui a dobra do cardapio de servicos. A diferenca nao e de quantidade:
 * o cardapio deixava o visitante escolher antes de entender, e estes dois sao a
 * consequencia do laudo que ele acabou de ler. O caminho que a medicao indica
 * chega destacado; a escolha dele ganha da sugestao.
 */
export default function PathsSection() {
  const { path: sugerido, choosePath } = useSiteScore();
  const { requestIntent } = useAgentIntent();

  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-4">
      <h2 className="text-center text-2xl md:text-4xl font-bold text-slate-950 mb-3">
        A partir daqui são dois caminhos
      </h2>
      <p className="reading-surface mx-auto mb-8 max-w-2xl text-center px-4 py-2 text-slate-700">
        O laudo já disse onde você está. O que muda agora é se o trabalho começa do zero
        ou em cima do que existe.
      </p>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {PATHS.map((p) => {
          const destacado = sugerido === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                choosePath(p.id);
                track('path_pick', { path: p.id });
                // O caminho vai junto no pedido: o agente nao precisa esperar o
                // estado do laudo assentar para saber qual cartao foi clicado.
                requestIntent('path-pick', p.id);
              }}
              className={`glass-panel text-left rounded-[1.5rem] p-6 md:p-8 transition-transform hover:-translate-y-1 ${
                destacado ? 'ring-2 ring-accent' : ''
              }`}
            >
              {destacado && (
                <span className="glass-chip glass-accent inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-accent-dark mb-3">
                  O que a sua medição indica
                </span>
              )}
              <h3 className="text-xl md:text-2xl font-bold text-slate-950">{p.label}</h3>
              <p className="mt-2 text-slate-700">{p.promise}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest text-accent-dark">
                Falar sobre isso <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
