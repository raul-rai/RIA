import { m } from 'motion/react';
import { BarChart3, ArrowUpRight } from 'lucide-react';
import { EVIDENCE } from '../content/evidence';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * Capítulo 1, primeira metade — a evidência.
 *
 * NÃO substitui o SocialProofSection. As duas convivem no mesmo capítulo, nesta
 * ordem, e a ordem é o argumento: dado primeiro, rosto depois. Ver o array de
 * capítulos em pages/LandingPage.tsx, onde as duas aparecem dentro da mesma
 * dobra.
 *
 * (Este comentário já afirmou o contrário, e por meses. A substituição foi
 * planejada e não aconteceu: o SocialProofSection teve os problemas dele
 * corrigidos no lugar — o disclaimer de não-endosso voltou em
 * content/authorities.ts e a marcação deixou de pontuar o índice. Sem motivo
 * para remover, ele ficou. Um comentário que descreve o plano em vez do código
 * é pior que comentário nenhum: ele é lido com a confiança de documentação.)
 *
 * O que esta metade acrescenta: quatro estudos públicos, nomeados, datados e
 * linkados. O leitor pode conferir cada um — e é justamente por poder conferir
 * que o argumento pesa. Abrir o capítulo por aqui é o que permite que as vozes
 * venham depois como ilustração de um número, e não como o próprio argumento.
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
          /*
            A ENTRADA NÃO MEXE MAIS NA OPACIDADE, e é essa a correção.

            Era `initial={{ opacity: 0, y: 16 }}`. O motion serializa a variante
            inicial durante o SSR, então estes quatro cartões saíam no HTML
            publicado com `style="opacity:0"` — invisíveis até o JavaScript
            baixar, executar e hidratar. Mesmo defeito do PERF-01, só que abaixo
            da dobra, onde ninguém tinha ido olhar.

            Tirar só a opacidade resolve sem perder a animação: o HTML publicado
            agora traz `transform:translateY(16px)` e mais nada. Sem JavaScript o
            cartão está LÁ, legível, dezesseis pixels fora do lugar — o que
            ninguém percebe. Com JavaScript, a subida acontece igual a antes.

            Tentei antes fazer a entrada inteira em CSS com
            `animation-timeline: view()`. Não sobreviveu à medição: o `body`
            desta página tem `overflow-x: hidden`, o que faz o `overflow-y`
            computar para `auto` e transforma o body num scroll container de
            6750px que nunca rola. A `view()` resolve contra esse scrollport e
            devolve progresso negativo — os cartões ficavam presos em
            `opacity: 0` PARA SEMPRE, com JavaScript e tudo. Medido no
            navegador: -74,8% num cartão inteiramente visível. Trocar "invisível
            sem JS" por "invisível com JS" não é conserto.
          */
          return (
            <m.article
              key={e.source}
              initial={{ y: 16 }}
              whileInView={{ y: 0 }}
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
                {/*
                  `py-1.5 -my-1.5`: o alvo cresce, o desenho não muda.

                  A 11px com leading-snug o link media 15px de altura. O
                  critério 2.5.8 (WCAG 2.2 AA) pede 24px, e a isenção de "alvo
                  em linha" não vale aqui: este é um link autônomo no rodapé de
                  um cartão, não uma palavra sublinhada no meio de uma frase.
                  Quinze pixels num dedo, num celular, é o link que a pessoa
                  erra duas vezes antes de acertar.

                  O padding leva o alvo a 27px. A margem negativa devolve o
                  espaço ao layout, então a ficha da fonte continua encostada na
                  borda exatamente como antes — o que cresce é a área que
                  responde ao toque, não o cartão. Os 6px que transbordam para
                  baixo caem sobre o texto do método, que não é clicável: não há
                  alvo vizinho para atropelar.
                */}
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('cta_click', { location: 'evidence_source' })}
                  className="inline-flex items-start gap-1 py-1.5 -my-1.5 text-[11px] font-bold text-accent hover:text-accent-dark underline underline-offset-2 leading-snug"
                >
                  <span>
                    {e.source} ({e.year})
                  </span>
                  <ArrowUpRight size={11} className="shrink-0 mt-0.5" />
                </a>
                <p className="text-[10px] text-slate-500 leading-snug mt-1">{e.method}</p>
              </footer>
            </m.article>
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
