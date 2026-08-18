import { Check, Clock, Wallet, CalendarCheck, ShieldCheck } from 'lucide-react';

/**
 * A oferta, visivel.
 *
 * Este texto existia so no FAQPage JSON-LD do index.html — o crawler recebia
 * mais informacao comercial que o comprador. Aqui ele passa a ser conteudo de
 * pagina; o JSON-LD continua espelhando as mesmas frases.
 */

const TERMS = [
  {
    icon: CalendarCheck,
    label: 'O que é',
    value: 'Sessão estratégica de 30 minutos',
    detail: 'Uma conversa, por vídeo ou WhatsApp, sobre a sua operação — não uma apresentação de slides.',
  },
  {
    icon: Clock,
    label: 'O que sai dela',
    value: 'Mapa dos 3 gargalos mais caros',
    detail: 'Quais rotinas consomem mais hora de gente, quais dão para automatizar já, e em que ordem.',
  },
  {
    icon: Wallet,
    label: 'Investimento',
    value: 'A sessão é gratuita',
    detail: 'Implementações para pequenas e médias empresas costumam ficar entre R$ 500 e R$ 5.000/mês, conforme o escopo. O número do seu caso sai na proposta, depois do diagnóstico.',
  },
  {
    icon: ShieldCheck,
    label: 'O que não acontece',
    value: 'Sem contrato de fidelidade',
    detail: 'Se o primeiro processo automatizado não entregar o resultado acordado no prazo acordado, a etapa não é cobrada.',
  },
];

export default function OfferSection() {
  return (
    <div className="w-full h-full bg-white/95 premium-glass rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 flex flex-col text-left">
      <div className="mb-5">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-dark font-bold block mb-2">
          A proposta
        </span>
        <h3 className="text-xl md:text-2xl font-serif text-slate-900 leading-tight">
          O que você leva desta conversa
        </h3>
      </div>

      <dl className="flex flex-col gap-4 md:gap-5 flex-1">
        {TERMS.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="flex gap-3.5">
              <div className="p-2 bg-accent/10 border border-accent/20 rounded-lg h-fit shrink-0">
                <Icon size={14} className="text-accent" />
              </div>
              <div>
                <dt className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold mb-0.5">
                  {t.label}
                </dt>
                <dd>
                  <span className="block text-sm font-bold text-slate-900 mb-0.5">{t.value}</span>
                  <span className="block text-xs text-slate-600 leading-relaxed">{t.detail}</span>
                </dd>
              </div>
            </div>
          );
        })}
      </dl>

      <p className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <Check size={14} className="text-accent shrink-0 mt-0.5" />
        <span>
          Próximo passo: conte ao agente da RIA o que sua empresa faz. Ele devolve onde a IA paga
          mais rápido no seu caso e agenda a sessão.
        </span>
      </p>
    </div>
  );
}
