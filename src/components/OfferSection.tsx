import { Clock, Wallet, CalendarCheck, ShieldCheck } from 'lucide-react';
import { OFFER_TERMS } from '../content/offer';

/**
 * A oferta, visível.
 *
 * O texto vive em content/offer.ts — fonte única compartilhada com o FAQPage
 * JSON-LD gerado no build. A regra que isso existe para impedir: até ago/2026
 * a oferta estava hardcoded aqui E duplicada no schema do index.html, o que
 * fazia o crawler receber informação comercial que o comprador não via.
 *
 * A ordem dos ícones acompanha a ordem de OFFER_TERMS. São quatro, e a faixa
 * assume quatro — se o conteúdo crescer, o ciclo abaixo repete o último ícone
 * em vez de quebrar.
 */
const ICONS = [CalendarCheck, Clock, Wallet, ShieldCheck];

export default function OfferSection() {
  return (
    <div className="glass-card w-full rounded-2xl px-5 py-4 text-left">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OFFER_TERMS.map((t, i) => {
          const Icon = ICONS[Math.min(i, ICONS.length - 1)];
          return (
            <div key={t.label} className="flex gap-2.5">
              <div className="glass-inset glass-accent p-1.5 rounded-lg h-fit shrink-0">
                <Icon size={12} className="text-accent" />
              </div>
              <div className="min-w-0">
                <dt className="text-[9px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold mb-0.5">
                  {t.label}
                </dt>
                <dd>
                  <span className="block text-xs font-bold text-slate-900 leading-snug mb-0.5">
                    {t.value}
                  </span>
                  <span className="block text-[11px] text-slate-600 leading-snug">{t.detail}</span>
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
