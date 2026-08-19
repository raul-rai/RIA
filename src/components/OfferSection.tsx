import { Clock, Wallet, CalendarCheck, ShieldCheck } from 'lucide-react';

/**
 * A oferta, visivel.
 *
 * Este texto existia so no FAQPage JSON-LD do index.html — o crawler recebia
 * mais informacao comercial que o comprador. Aqui ele passa a ser conteudo de
 * pagina; o JSON-LD continua espelhando as mesmas frases.
 *
 * A faixa e a oferta visivel acima do agente — nao mais um cartao competindo
 * com o chat por atencao.
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
    <div className="glass-card w-full rounded-2xl px-5 py-4 text-left">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TERMS.map((t) => {
          const Icon = t.icon;
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
