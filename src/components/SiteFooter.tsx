import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { CONSULTANT } from '../content/consultant';
import { EVIDENCE } from '../content/evidence';

/**
 * Rodapé.
 *
 * A página não tinha nenhum — o que significava que a política de privacidade,
 * uma vez criada, não teria como ser encontrada por quem não soubesse a URL.
 * Rodapé é onde todo mundo procura isso, inclusive o jurídico do prospect.
 *
 * Deliberadamente discreto: esta página termina no agente, e o rodapé não pode
 * competir com a conversão. Ele existe para ser encontrado, não para ser visto.
 *
 * A FAIXA DE FONTES (set/2026)
 *
 * Aqui moram as quatro citações que saíram com a dobra "O que os dados dizem".
 * O motivo de traze-las de volta NÃO é decorar o rodapé: dado + fonte + ano +
 * link é o formato que motor generativo cita, e eram as quatro únicas citações
 * COM LINK da página. Tirar a dobra tirou o desenho; tirou junto, sem querer, o
 * conteúdo mais citável do site. Ele volta onde não disputa atenção com a
 * conversão — mas volta ao HTML publicado, que é onde o crawler lê.
 *
 * Por isso a faixa é conteúdo VISÍVEL, não `sr-only`: link escondido é
 * descontado pelo robô e cheira a manipulação. Discreto e real cita; invisível
 * e "otimizado" não.
 *
 * A honestidade da dobra sobrevive junto: cada linha é o número, a afirmação, a
 * instituição (nunca o veículo que só noticiou) e o ano — os mesmos campos de
 * content/evidence.ts, sem reescrever nada para caber.
 */
export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-900/10 bg-white/80 backdrop-blur-sm">
      <section aria-label="Fontes" className="max-w-5xl mx-auto px-5 pt-8 pb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
          Fontes
        </h2>
        <p className="text-[11px] text-slate-500 leading-snug mb-4 max-w-2xl">
          Os números citados neste trabalho vêm de estudos públicos — nomeados, datados e linkados.
          Nenhum é estimado ou arredondado para soar melhor.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {EVIDENCE.map((e) => (
            <li key={e.url} className="text-[11px] text-slate-600 leading-snug">
              <span className="font-bold text-slate-700">{e.value}</span> {e.claim}{' '}
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 py-1.5 font-semibold text-slate-600 hover:text-accent underline underline-offset-2 whitespace-nowrap"
              >
                {e.source} ({e.year})
                <ArrowUpRight size={11} className="shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-slate-900/10">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 text-center sm:text-left leading-snug">
            {CONSULTANT.name} — {CONSULTANT.role}
          </p>
          <nav className="flex items-center gap-4">
            <Link
              to="/privacidade"
              className="text-[11px] font-semibold text-slate-600 hover:text-accent underline underline-offset-2 py-2"
            >
              Política de privacidade
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
