import { m } from 'motion/react';
import { LineChart, Hammer, Check, ArrowUpRight, Award } from 'lucide-react';
import { CASES } from '../content/cases';
import { CONSULTANT, PHOTO_SRC, PHOTO_ALT } from '../content/consultant';
import { track } from '../lib/analytics';
import { useAgentIntent } from '../context/AgentIntentContext';

/**
 * Dobra 4 — a prova e quem executa, na mesma dobra.
 *
 * Estavam separadas em ProofSection e ConsultantSection. Para consultor solo
 * sao a mesma prova: nao adianta o caso funcionar se o visitante nao sabe quem
 * fez, nem adianta a credencial sem caso.
 *
 * A dobra carrega DUAS coisas: os casos e quem executa. Tudo o que nao for uma
 * dessas duas — etiqueta de frente, grade de metodo — foi retirado, porque numa
 * dobra que ja empilha tres cartoes mais um painel de consultor, cada elemento
 * a mais custa atencao no ponto exato em que a prova precisa dela.
 */

export default function CredibilitySection() {
  const { requestIntent } = useAgentIntent();
  return (
    <div className="w-full max-w-6xl mx-auto px-4 flex flex-col justify-center pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        {/* `flex w-fit mx-auto` e nao `inline-flex`: ver a nota em
            FrontsSection. A etiqueta e o <h2> `inline-block` dividiam a mesma
            linha, com a etiqueta jogada para a esquerda do titulo. */}
        <div className="glass-chip glass-accent flex w-fit mx-auto items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <LineChart size={14} className="text-accent" />
          <span className="text-accent-dark text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Parcerias frutíferas
          </span>
        </div>
        {/*
          O título já foi "Cada frente, com um caso atrás." e depois "Três
          operações, o mesmo método." Os dois descreviam a seção para dentro —
          contavam o que ELA é. Este aponta para fora: os cartões abaixo são
          parcerias que deram fruto, e a única coisa que o visitante precisa
          fazer com essa informação é se ver no próximo cartão.
        */}
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 leading-tight reading-surface glass-md-none inline-block px-4 py-2">
          A sua empresa pode ser a{' '}
          <span className="italic font-normal text-slate-500">próxima.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8">
        {CASES.map((c, i) => (
          <m.article
            key={c.segment}
            // Sem `opacity` na entrada: o motion serializa a variante inicial
            // no SSR, e com ela estes três cartões saíam publicados
            // invisíveis. Só o deslocamento sobrevive ao HTML — sem
            // JavaScript o cartão está lá, 16px fora do lugar. Ver a nota
            // longa em MarketEvidenceSection.
            initial={{ y: 16 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card glass-hover rounded-2xl p-5 flex flex-col gap-2 text-left"
          >
            <div className="flex items-center gap-1.5">
              {c.kind === 'entrega' ? (
                <Hammer size={12} className="text-slate-400 shrink-0" />
              ) : (
                <LineChart size={12} className="text-accent shrink-0" />
              )}
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold">
                {c.segment}
              </span>
            </div>

            {/*
              A etiqueta "Prova a frente N · Tag" saiu daqui. Ela repetia, em
              caixa alta e a três centímetros de distância, o que a dobra 3
              acabou de dizer — e cobrava do leitor um cruzamento de índices
              ("frente 2 era qual mesmo?") no exato momento em que ele deveria
              estar lendo o resultado. O campo `front` continua em cases.ts:
              o vínculo segue existindo no conteúdo, só não é mais desenhado.
            */}

            <p className="text-lg md:text-xl font-serif text-slate-900 leading-tight">{c.headline}</p>

            <dl className="text-xs text-slate-600 leading-relaxed flex flex-col gap-1.5 mt-1">
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Antes</dt>
                <dd>{c.before}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">O que entrou</dt>
                <dd>{c.intervention}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Prazo</dt>
                <dd>{c.timeframe}</dd>
              </div>
            </dl>

            {/*
              A linha de apuração é o que separa "resultado" de "alegação".
              Antes ela simplesmente sumia quando ausente — e o cartão ficava
              com um número grande, sem nenhum sinal de que ninguém o auditou.
              Era o pior dos mundos: a seção anunciava rigor no cabeçalho
              ("Como o número é apurado") e omitia a ausência em silêncio.
              Agora a falta é declarada. Some assim que `measurement` existir.
            */}
            {c.measurement ? (
              <p className="text-[11px] text-slate-500 border-t border-slate-900/10 pt-2.5 mt-auto">
                {c.measurement}
              </p>
            ) : c.kind === 'resultado' ? (
              <p className="text-[11px] text-amber-800/90 border-t border-slate-900/10 pt-2.5 mt-auto">
                Número informado pelo cliente, ainda sem apuração independente publicada.
              </p>
            ) : null}
          </m.article>
        ))}
      </div>

      {/*
        Aqui ficava a grade "Como o número é apurado" — quatro cartões de
        método (medimos antes, um gargalo por vez, prazo na proposta, medimos
        depois). Saiu: eram doze cartões empilhados numa dobra só, e o método
        competia por atenção com a prova sem ser o que fecha a venda. A
        exigência de apuração continua onde ela de fato morde: cada cartão de
        caso ainda declara sua `measurement`, e ainda imprime o aviso de "sem
        apuração independente" quando ela falta.
      */}

      <div className="glass-panel rounded-3xl p-6 md:p-8">
        {/* `items-start`: com `items-center` a foto ficava centralizada contra
            uma coluna de texto tres vezes mais alta, flutuando no meio de uma
            faixa vazia. No topo ela encosta no nome e na funcao, que e o que
            ela legenda. */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
          <div className="mx-auto md:mx-0">
            {PHOTO_SRC ? (
              <img
                src={PHOTO_SRC}
                alt={PHOTO_ALT}
                loading="lazy"
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border border-slate-200 shadow-lg"
              />
            ) : (
              <div className="glass-inset w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center">
                <span className="font-serif text-3xl text-slate-400">RV</span>
              </div>
            )}
          </div>

          <div className="flex flex-col text-center md:text-left">
            <div className="glass-inset inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 w-fit mx-auto md:mx-0">
              <Award size={12} className="text-accent" />
              <span className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                Quem executa
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-serif text-slate-900 mb-1 leading-tight">
              {CONSULTANT.name}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm italic mb-3">{CONSULTANT.role}</p>
            <div className="flex flex-col gap-3 mb-4 max-w-xl mx-auto md:mx-0">
              {CONSULTANT.bio.map((paragrafo) => (
                <p key={paragrafo} className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  {paragrafo}
                </p>
              ))}
            </div>

            <ul className="flex flex-col gap-2 mb-5 text-left max-w-xl mx-auto md:mx-0">
              {CONSULTANT.credentials.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check size={14} className="text-accent shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="leading-snug">{c}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => {
                  track('cta_click', { location: 'credibility' });
                  requestIntent('credibility');
                }}
                className="px-6 py-3.5 w-full md:w-auto bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
              >
                Fale com nosso agente <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
