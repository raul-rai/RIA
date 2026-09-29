import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useSiteScore } from '../context/SiteScoreContext';
import { useScan } from '../hooks/useSiteScan';
import { normalizeTarget } from '../lib/agentic-report';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * O campo que abre a página.
 *
 * Ele morava no meio do capítulo 2, atrás de duas dobras de argumento. Subiu
 * para o hero porque medir o site do visitante é a única coisa que esta página
 * faz melhor que qualquer concorrente — e era a última que ela oferecia.
 */
export default function ScannerForm({ onMeasured }: { onMeasured: () => void }) {
  const [url, setUrl] = useState('');
  const { setNoWebsite } = useSiteScore();
  const { requestIntent } = useAgentIntent();
  const { start, phase, googleFailure, cancel } = useScan();

  const invalido = googleFailure === 'invalid-url';

  const medir = () => {
    // Enter no campo não passa pelo botão desabilitado: sem esta guarda, um
    // segundo Enter reiniciaria a medição que está no meio.
    if (phase === 'running') return;
    if (!normalizeTarget(url)) {
      start(url); // deixa o hook publicar 'invalid-url'
      return;
    }
    start(url);
    track('cta_click', { location: 'hero-scanner' });
    onMeasured();
  };

  const semSite = () => {
    cancel();
    setNoWebsite(true);
    track('no_website_declared');
    // A intenção do agente para quem declara não ter site.
    requestIntent('sem-site');
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
      <div className="glass-field flex items-center w-full rounded-xl px-4 py-3 gap-3">
        <Search size={16} className="text-accent shrink-0" aria-hidden="true" />
        <label htmlFor="scanner-url" className="sr-only">
          Endereço do seu site
        </label>
        <input
          id="scanner-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="suaempresa.com.br"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') medir(); }}
          className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 min-h-[28px]"
          aria-invalid={invalido}
          aria-describedby={invalido ? 'scanner-erro' : undefined}
        />
      </div>

      {invalido && (
        <p id="scanner-erro" role="alert" className="text-sm text-red-600">
          Preciso de um endereço completo — algo como suaempresa.com.br.
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          onClick={medir}
          disabled={phase === 'running'}
          className="w-full sm:w-auto px-7 py-4 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2.5 min-h-[52px] disabled:opacity-60"
        >
          <span>{phase === 'running' ? 'Medindo…' : 'Medir meu site'}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>

        <button
          onClick={semSite}
          className="glass glass-hover w-full sm:w-auto px-7 py-4 text-slate-900 hover:text-accent rounded-xl font-black text-xs uppercase tracking-widest min-h-[52px]"
        >
          Ainda não tenho site
        </button>
      </div>
    </div>
  );
}
