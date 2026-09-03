import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { Check, Layers, ArrowRight } from 'lucide-react';
import { FRONTS } from '../content/fronts';
import { resolveFirstFront, countChecked } from '../lib/fronts';
import { useVulnerability } from '../context/VulnerabilityContext';
import { useAgentIntent } from '../context/AgentIntentContext';
import { track } from '../lib/analytics';

/**
 * Dobra 3 — o catalogo.
 *
 * Substitui o antigo checklist de pilares. A mecanica de marcar continua, o
 * conteudo passa a declarar o que a RIA vende. A frente 1 chega pre-resolvida
 * pelo diagnostico da dobra 2: e a mesma coisa que aquela dobra mediu, e deixar
 * o visitante remarcar do zero era perder a costura entre as duas.
 */
export default function FrontsSection() {
  const { requestIntent } = useAgentIntent();
  const { frontsChecked, toggleFront, hasNoWebsite, websiteScore } = useVulnerability();

  /**
   * A pre-resolucao roda uma vez por veredito do diagnostico. Sem a trava, todo
   * render reescreveria a marcacao e o visitante nao conseguiria discordar do
   * proprio diagnostico — clicar na frente 1 nao teria efeito.
   */
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const verdict = resolveFirstFront({ hasNoWebsite, websiteScore });
    if (verdict === null) return;
    const key = String(verdict);
    if (applied.current === key) return;
    applied.current = key;
    if (frontsChecked[0] !== verdict) toggleFront(0);
  }, [hasNoWebsite, websiteScore, frontsChecked, toggleFront]);

  const marcadas = countChecked(frontsChecked);
  const faltam = FRONTS.length - marcadas;
  const primeiraVazia = resolveFirstFront({ hasNoWebsite, websiteScore }) === false;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col justify-center pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        {/*
          `flex w-fit mx-auto`, e NAO `inline-flex`.

          Com `inline-flex` a etiqueta era uma caixa inline, e o irmao dela — o
          `reading-surface` do titulo — e `inline-block`. Duas caixas inline
          dentro de um bloco `text-center` cabem na MESMA linha enquanto
          couberem na largura: 197px da etiqueta + 672px do titulo = 869px, e
          havia 896px. A etiqueta nao ficava acima do titulo; ficava ao lado
          dele, encostada na esquerda e alinhada pela linha de base de um bloco
          de tres linhas — parecia solta no meio do nada.

          `flex` tira a etiqueta do fluxo inline e a devolve para a linha
          dela; `w-fit mx-auto` centraliza sem depender do `text-center` do
          pai. Mesmo conserto em CredibilitySection, que tinha o defeito
          identico.
        */}
        <div className="glass-chip glass-accent flex w-fit mx-auto items-center gap-2 px-3.5 py-1.5 rounded-full mb-4">
          <Layers size={14} className="text-cyan-700" />
          <span className="text-cyan-800 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
            As três frentes
          </span>
        </div>
        {/*
          O véu de leitura, resgatado do aceaf08.

          Este cabeçalho cai DIRETO sobre a onda, e nesta dobra a onda está no
          tom mais escuro do gradiente. Sem véu, o `text-slate-900` do título e
          o `text-slate-600` do parágrafo disputam contraste com a água — é o
          mesmo problema que CredibilitySection e o cabeçalho do CTA já
          resolvem com esta classe.

          O commit que trouxe isto na `main` (aceaf08) foi descartado por outro
          motivo: ele subia o catálogo de três para seis frentes, e a decisão
          registrada foi manter três. Mas a correção de legibilidade não tinha
          nada a ver com a contagem, e jogá-la fora junto seria perder um
          conserto de contraste por tabela.

          SEM `glass-md-none`, ao contrário da dobra do CTA: lá quem perde a
          leitura é o mobile; aqui é o desktop, onde o cabeçalho é maior e
          cobre mais área escura.
        */}
        <div className="reading-surface inline-block px-5 py-3.5 md:px-8 md:py-4 max-w-2xl">
          <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-3">
            É aqui que a IA entra <span className="italic font-normal text-slate-500">na sua operação.</span>
          </h2>
          <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
            Três frentes, e é isso que eu implanto. Elas entram DEPOIS de o diagnóstico dizer qual delas
            paga primeiro — marque as que a sua empresa já cobre.
          </p>
        </div>
      </div>

      {/*
        Tres colunas, nao duas.

        `lg:grid-cols-2` com tres cartoes deixava o terceiro sozinho na
        esquerda e meia grade vazia na direita — o buraco era a primeira coisa
        que se via na dobra. Tres colunas fecham a fileira, e sao a mesma
        contagem que o titulo promete: "as tres frentes" viram tres cartoes
        lado a lado. Tambem alinha o ritmo com a dobra seguinte, que ja usa
        `md:grid-cols-3`.
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl mx-auto w-full">
        {FRONTS.map((front, i) => {
          const isChecked = frontsChecked[i];
          const destacada = i === 0 && primeiraVazia && !isChecked;
          const tom = isChecked
            ? 'glass-emerald glass-selected'
            : destacada
              ? 'glass-red glass-selected'
              : '';
          return (
            /* O cartao deixa de ser <button> porque passou a conter um: o
               toggle "ja cubro" e o atalho "falar sobre" sao irmaos, nunca
               aninhados — <button> dentro de <button> e HTML invalido. */
            <div key={front.id} className={`glass-card glass-hover flex flex-col rounded-2xl ${tom}`}>
              <m.button
                type="button"
                onClick={() => {
                  toggleFront(i);
                  track('front_toggle', { id: front.id, checked: !isChecked });
                }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={isChecked}
                className="text-left flex gap-3.5 p-4"
              >
                <span
                  className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                    isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400/70 bg-white/50'
                  }`}
                >
                  {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                    Frente {front.id}
                  </span>
                  <span
                    className={`block text-xs md:text-sm font-bold leading-snug mb-1 ${
                      isChecked ? 'text-emerald-950' : 'text-slate-900'
                    }`}
                  >
                    {front.label}
                  </span>
                  <span className="block text-[11px] md:text-xs text-slate-600 leading-snug">
                    {front.promise}
                  </span>
                  {destacada && (
                    <span className="block mt-2 text-[11px] font-bold text-red-800 leading-snug">
                      {hasNoWebsite
                        ? 'Você acabou de dizer que ainda não tem site. Esta é a primeira.'
                        : `Seu site tirou ${websiteScore}/100 no diagnóstico. Esta é a primeira.`}
                    </span>
                  )}
                </span>
              </m.button>

              {/* So nos cartoes vazios: pedir uma frente que voce acabou de
                  declarar coberta nao e um estado que precise existir. */}
              {!isChecked && (
                <button
                  type="button"
                  onClick={() => {
                    track('cta_click', { location: 'front_card', front_id: front.id });
                    requestIntent('front-pick', front.id);
                  }}
                  className="self-start mx-4 mb-3 py-2.5 min-h-11 inline-flex items-center gap-1.5 text-[11px] font-bold text-accent hover:text-accent-dark underline underline-offset-2"
                >
                  Falar sobre esta frente <ArrowRight size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-6 md:mt-8">
        <p className="text-sm md:text-base text-slate-800 font-semibold mb-4">
          Você cobre <span className="font-serif text-lg md:text-2xl">{marcadas}</span> de 3.
          {faltam > 0 && (
            <>
              {' '}As {faltam} que faltam são a pauta da sua sessão.
            </>
          )}
        </p>
        <button
          onClick={() => {
            track('cta_click', { location: 'fronts_section' });
            requestIntent('fronts-agenda');
          }}
          className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg"
        >
          Montar minha pauta <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
