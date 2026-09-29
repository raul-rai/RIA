import { ChevronDown } from 'lucide-react';
import { FAQ, OFFER_TERMS } from '../content/offer';

/**
 * Condições e perguntas frequentes — o fundo da página.
 *
 * Existe por causa de uma assimetria: o FAQ e as condições da oferta viviam em
 * content/offer.ts e alimentavam o FAQPage JSON-LD, o index.md, o sobre.md, o
 * agent-context.json e o servidor MCP — mas nenhum componente os desenhava. O
 * robô sabia da faixa de valores e da garantia de prazo; o comprador, não. É a
 * regra que atravessa este repositório (nunca o crawler saber algo que o
 * comprador não vê na tela) violada justamente no conteúdo mais citável do
 * site.
 *
 * ONDE ENTRA, E POR QUÊ
 *
 * Depois do capítulo do agente, antes do rodapé, FORA da lista de capítulos.
 *   - Não é um sexto capítulo: capítulo tem índice no HUD, âncora de CTA e
 *     ocupa uma tela inteira. Este bloco é conteúdo de consulta, de fundo de
 *     página, e não pode competir com a conversão.
 *   - Vem depois do agente, então nunca o empurra para fora da tela: o
 *     capítulo 4 continua sendo a última dobra de conversão, e quem quer o
 *     agente chega nele sem passar por aqui.
 *   - Fica antes do rodapé porque é a última coisa que o comprador pesa
 *     (quanto custa, e se não entregar?) e a primeira que o rodapé
 *     (`Fontes`, contato, privacidade) não responde.
 *
 * AS CONDIÇÕES FICAM ABERTAS, O FAQ RECOLHE
 *
 * Os quatro termos são o que decide a compra (como começa, o produto, o
 * investimento, o que não acontece) e aparecem sempre, sem clique — inclusive
 * a faixa de valores, que deixa de ser um número que só o schema conhecia. As
 * seis respostas do FAQ são de consulta e ficam em <details>: o padrão nativo
 * tem teclado, leitor de tela e estado aberto/fechado de graça, funciona antes
 * de o JavaScript hidratar e sai no HTML prerenderizado com o texto inteiro.
 * O anel de foco é o global (:focus-visible em index.css), deslocado para
 * dentro (`focus-ring-inset`) porque o resumo ocupa a largura da caixa.
 *
 * Tudo é lido de content/offer.ts. Nada aqui é uma segunda cópia à mão: o texto
 * do schema e o da tela são o mesmo array, e tests/seo.test.ts (GEO-06, GEO-06b)
 * tranca isso sobre o HTML publicado.
 */
export default function OfferFaqSection() {
  return (
    <section
      id="condicoes-e-perguntas"
      aria-labelledby="condicoes-titulo"
      className="relative w-full px-4 pt-4 pb-16 md:pb-24 scroll-mt-4"
    >
      <div className="glass-panel max-w-5xl mx-auto rounded-3xl p-6 md:p-10">
        <h2
          id="condicoes-titulo"
          className="text-2xl md:text-4xl font-serif text-slate-900 leading-tight mb-2"
        >
          Condições e perguntas frequentes
        </h2>
        <p className="text-sm md:text-base text-slate-700 leading-relaxed max-w-2xl mb-6 md:mb-8">
          O que você precisa saber antes de conversar: como o trabalho começa, quanto costuma
          custar e o que acontece se o prazo não for cumprido.
        </p>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-10 md:mb-12">
          {OFFER_TERMS.map((t) => (
            <div key={t.label} className="glass-inset rounded-2xl p-4 md:p-5 flex flex-col gap-1.5">
              <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-dark">
                {t.label}
              </dt>
              <dd className="font-serif text-lg md:text-xl text-slate-900 leading-snug">
                {t.value}
              </dd>
              <dd className="text-sm text-slate-700 leading-relaxed">{t.detail}</dd>
            </div>
          ))}
        </dl>

        <h3
          id="perguntas-frequentes"
          className="text-xl md:text-2xl font-serif text-slate-900 leading-tight mb-4 scroll-mt-4"
        >
          Perguntas frequentes
        </h3>

        <div className="flex flex-col gap-2.5">
          {FAQ.map((item) => (
            <details key={item.question} className="group glass-inset rounded-2xl">
              <summary className="focus-ring-inset flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4 py-3.5 md:px-5 text-left text-sm md:text-base font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-slate-600 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                />
              </summary>
              <p className="px-4 pb-4 md:px-5 md:pb-5 text-sm md:text-[15px] text-slate-700 leading-relaxed max-w-3xl">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
