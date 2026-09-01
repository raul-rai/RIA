import { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  QUALIFICATION_STEPS,
  validateField,
  type Qualification,
} from '../lib/qualification';
import { track } from '../lib/analytics';

/**
 * Os cinco passos, dentro da bolha do chat.
 *
 * Este componente nao conhece o agente: recebe um callback e devolve os cinco
 * campos. Um passo por vez porque cinco campos de uma vez dentro de um chat
 * viram formulario — e formulario dentro de conversa quebra as duas coisas.
 */
export default function QualificationFlow({
  onComplete,
  onCancel,
}: {
  onComplete: (q: Qualification) => void;
  /** Escape do passo 1: sem ele o visitante que abre a qualificacao e desiste
   *  no primeiro campo fica preso — "Voltar" so existe a partir do passo 2. */
  onCancel?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Qualification>>({});
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const step = QUALIFICATION_STEPS[index];
  const isLast = index === QUALIFICATION_STEPS.length - 1;

  const commit = (value: string) => {
    const problem = validateField(step.field, value);
    if (problem) {
      setError(problem);
      return;
    }

    const updated = { ...answers, [step.field]: value.trim() };
    setAnswers(updated);
    setError(null);
    track('qualification_step', { field: step.field, index });

    if (isLast) {
      track('qualification_completed', {});
      onComplete(updated as Qualification);
      return;
    }
    // Le do objeto atualizado, nao do estado velho de answers, porque o
    // proximo passo pode ja ter sido respondido antes (voltar e avancar de novo).
    const next = QUALIFICATION_STEPS[index + 1];
    setDraft(updated[next.field] ?? '');
    setIndex(index + 1);
  };

  const back = () => {
    if (index === 0) return;
    const previous = QUALIFICATION_STEPS[index - 1];
    setDraft(answers[previous.field] ?? '');
    setError(null);
    setIndex(index - 1);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-raised glass-accent mt-3 p-4 rounded-xl text-left"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
          {index + 1} de {QUALIFICATION_STEPS.length}
        </span>
        {index > 0 ? (
          <button
            type="button"
            onClick={back}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft size={11} /> Voltar
          </button>
        ) : onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft size={11} /> Voltar à conversa
          </button>
        ) : null}
      </div>

      <p className="text-sm text-slate-900 font-semibold leading-snug mb-3">{step.prompt}</p>

      {step.options ? (
        <div className="flex flex-col gap-2">
          {step.options.map((option) => {
            const isSelected = answers[step.field] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => commit(option.value)}
                aria-pressed={isSelected}
                className={`glass-inset text-left px-3.5 py-2.5 rounded-xl active:scale-[0.99] text-xs font-semibold ${
                  isSelected
                    ? 'glass-emerald text-emerald-950'
                    : 'glass-interactive text-slate-800'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit(draft);
          }}
          className="flex gap-2"
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(null); }}
            placeholder={step.placeholder}
            inputMode={step.field === 'phone' ? 'tel' : step.field === 'email' ? 'email' : 'text'}
            aria-label={step.prompt}
            aria-invalid={error !== null}
            className="glass-field flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Continuar"
            className="px-4 rounded-xl bg-slate-900 text-white hover:bg-accent active:scale-95 transition-all shrink-0"
          >
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] font-semibold text-red-700">
          {error}
        </p>
      )}

      {/*
        Aviso de tratamento (LGPD art. 9º).

        Este é o ponto exato em que a página deixa de ser anônima: daqui saem
        e-mail, telefone e faixa de faturamento para o webhook do n8n. Até
        ago/2026 não havia uma palavra sobre isso em lugar nenhum do site — nem
        aviso, nem política, nem base legal.

        Fica em todos os passos, não só no primeiro: quem entra no fluxo pelo
        meio (voltando de um erro, por exemplo) precisa ver a mesma informação.
      */}
      <p className="mt-3 pt-2.5 border-t border-slate-900/10 text-[10px] leading-snug text-slate-500">
        Estes dados vão para o meu sistema de atendimento e servem só para eu preparar e marcar a
        sessão — não são vendidos nem usados para anúncios. Você pode pedir a exclusão a qualquer
        momento.{' '}
        <Link
          to="/privacidade"
          target="_blank"
          className="text-accent font-semibold underline underline-offset-2 hover:text-accent-dark"
        >
          Política de privacidade
        </Link>
        .
      </p>
    </m.div>
  );
}
