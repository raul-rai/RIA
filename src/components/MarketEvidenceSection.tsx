import { motion } from 'motion/react';
import { BarChart3, ArrowUpRight } from 'lucide-react';
import { EVIDENCE } from '../content/evidence';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * Capítulo 1 — a evidência.
 *
 * Substitui SocialProofSection, que exibia nome, foto, biografia e citação de
 * três figuras públicas reais numa página comercial, com checkbox que convertia
 * a concordância do visitante em pontuação de vulnerabilidade. Três problemas
 * de uma vez: uso comercial de imagem sem autorização, sugestão de endosso que
 * nunca existiu (o disclaimer foi removido no commit 4b24851), e um índice que
 * pagava por concordar com o vendedor.
 *
 * O que entra no lugar faz o mesmo trabalho retórico com mais força e sem risco:
 * quatro estudos públicos, nomeados, datados e linkados. O leitor pode conferir
 * cada um — e é justamente por poder conferir que o argumento pesa.
 *
 * Sem checkbox aqui, de propósito. Esta dobra informa; ela não pontua.
 */
export default function MarketEvidenceSection() {
  const { requestIntent } = useAgentIntent();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-0 pointer-events-auto flex flex-col justify-center">
      <div className="mb-6 md:mb-10 text-center">
        <div className="glass-chip glass-amber inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <BarChart3 size={14} className="text-amber-600" />
          <span className="text-amber-800 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            O que os dados dizem
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 mb-2 leading-tight">
          Quase todo mundo já usa IA.{' '}
          <span className="italic font-normal text-slate-500">Quase ninguém tira retorno.</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-2xl mx-auto font-light leading-relaxed">
          Quatro estudos públicos, com fonte e ano. Confira cada um — é por isso que eles estão aqui,
          e não uma opinião minha.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-5xl mx-auto w-full">
        {EVIDENCE.map((e, i) => {
          const Icon = e.icon;
          return (
            <motion.article
              key={e.source}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-5 flex flex-col gap-2 text-left"
            >
              <div className="flex items-baseline gap-3">
                <Icon size={16} className="text-accent shrink-0 self-center" />
                <span className="text-3xl md:text-4xl font-serif font-black text-slate-900 leading-none">
                  {e.value}
                </span>
              </div>

              <p className="text-sm md:text-base text-slate-800 leading-snug font-medium">{e.claim}</p>

              <p className="text-[12px] md:text-[13px] text-slate-600 leading-snug italic">
                {e.takeaway}
              </p>

              {/*
                A ficha da fonte é o produto desta seção, não um rodapé
                decorativo. Instituição + ano + método, com link que abre o
                estudo. É o que separa "dado" de "alegação" — e é exatamente o
                que os motores generativos citam quando reproduzem uma página.
              */}
              <footer className="mt-auto pt-3 border-t border-slate-900/10">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('cta_click', { location: 'evidence_source' })}
                  className="inline-flex items-start gap-1 text-[11px] font-bold text-accent hover:text-accent-dark underline underline-offset-2 leading-snug"
                >
                  <span>
                    {e.source} ({e.year})
                  </span>
                  <ArrowUpRight size={11} className="shrink-0 mt-0.5" />
                </a>
                <p className="text-[10px] text-slate-500 leading-snug mt-1">{e.method}</p>
              </footer>
            </motion.article>
          );
        })}
      </div>

      <div className="text-center mt-6 md:mt-8">
        <p className="text-slate-700 text-xs md:text-sm max-w-2xl mx-auto mb-4 leading-relaxed">
          Repare no que os dois primeiros números, juntos, dizem: o problema deixou de ser{' '}
          <strong className="font-bold text-slate-900">adotar</strong> IA e passou a ser{' '}
          <strong className="font-bold text-slate-900">escolher onde</strong>. É essa escolha que eu
          faço primeiro — e é ela que decide se o projeto entra nos 5% ou nos 95%.
        </p>
        <button
          onClick={() => {
            track('cta_click', { location: 'evidence' });
            requestIntent('hero-cold');
          }}
          className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg"
        >
          Descobrir onde é, na minha operação <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}
