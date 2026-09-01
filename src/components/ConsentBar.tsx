import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { readConsent, setConsent, onConsentChange, type ConsentState } from '../lib/consent';
import { analyticsEnabled } from '../lib/analytics';

/**
 * Aviso de medição.
 *
 * Aparece apenas quando (a) existe um destino de analytics configurado e
 * (b) o visitante ainda não decidiu. Sem VITE_GA_MEASUREMENT_ID a barra nunca
 * é montada — pedir consentimento para um tratamento que não acontece é ruído
 * que treina o usuário a clicar em "aceitar" sem ler.
 *
 * As duas opções têm o MESMO peso visual, de propósito. Botão de aceitar em
 * destaque e recusar em cinza-claro é o padrão que a LGPD e as autoridades
 * europeias tratam como consentimento viciado — e, no caso desta página, seria
 * incoerente com uma auditoria que acabou de remover números fabricados.
 */
export default function ConsentBar() {
  const [state, setState] = useState<ConsentState | null | undefined>(undefined);

  useEffect(() => {
    setState(readConsent());
    return onConsentChange(setState);
  }, []);

  // `undefined` = ainda não li o localStorage (primeiro render). Não mostrar
  // nada aqui evita o flash da barra para quem já decidiu há meses.
  const shouldShow = analyticsEnabled && state === null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label="Aviso sobre medição de navegação"
          className="fixed bottom-0 inset-x-0 z-[80] p-3 md:p-4 pointer-events-none"
        >
          <div className="glass-panel pointer-events-auto max-w-3xl mx-auto rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 shadow-2xl">
            <BarChart3 size={18} className="text-accent shrink-0 hidden md:block" />
            <p className="text-[12px] md:text-[13px] text-slate-700 leading-snug flex-1">
              Posso medir quais trechos desta página são lidos? Ajuda a melhorá-la e não coleta nada
              que te identifique. Recusar não muda nada no que você vê aqui.{' '}
              <Link
                to="/privacidade"
                className="text-accent font-semibold underline underline-offset-2 hover:text-accent-dark"
              >
                Como trato seus dados
              </Link>
              .
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setConsent('denied')}
                className="glass-raised glass-interactive flex-1 md:flex-none px-4 py-2.5 min-h-11 rounded-xl text-slate-800 text-[11px] font-black uppercase tracking-widest"
              >
                Não medir
              </button>
              <button
                onClick={() => setConsent('granted')}
                className="flex-1 md:flex-none px-4 py-2.5 min-h-11 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Pode medir
              </button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
