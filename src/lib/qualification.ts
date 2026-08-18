import type { FrontId } from '../content/fronts';
import { FRONTS } from '../content/fronts';
import { missingFronts } from './fronts';

/**
 * Qualificacao previa da sessao estrategica.
 *
 * Os cinco campos sao capturados por input controlado, nunca extraidos do texto
 * livre pelo LLM. O agente conversa; o dado estruturado entra por aqui. Modelo
 * errando telefone ou faturamento e exatamente o dado que nao pode chegar sujo
 * — e quem paga a conta e o Raul, ligando para um numero que nao existe.
 */

export type QualificationField = 'company' | 'email' | 'phone' | 'revenue' | 'aiBudget';

export interface Qualification {
  company: string;
  email: string;
  phone: string;
  revenue: string;
  aiBudget: string;
}

export interface QualificationOption {
  value: string;
  label: string;
}

export interface QualificationStep {
  field: QualificationField;
  /** A pergunta como o agente faz. */
  prompt: string;
  /** Placeholder do campo livre. Ausente quando o passo e de faixa. */
  placeholder?: string;
  /** Presente so nos passos de faixa. */
  options?: QualificationOption[];
}

export const REVENUE_OPTIONS: QualificationOption[] = [
  { value: 'ate-100k', label: 'Até R$ 100 mil/mês' },
  { value: '100k-500k', label: 'R$ 100 mil a R$ 500 mil/mês' },
  { value: '500k-1m', label: 'R$ 500 mil a R$ 1 milhão/mês' },
  { value: 'acima-1m', label: 'Acima de R$ 1 milhão/mês' },
];

export const AI_BUDGET_OPTIONS: QualificationOption[] = [
  { value: 'nao-defini', label: 'Ainda não defini' },
  { value: 'ate-1k', label: 'Até R$ 1.000/mês' },
  { value: '1k-5k', label: 'R$ 1.000 a R$ 5.000/mês' },
  { value: 'acima-5k', label: 'Acima de R$ 5.000/mês' },
];

export const QUALIFICATION_STEPS: QualificationStep[] = [
  {
    field: 'company',
    prompt: 'Perfeito. Para eu preparar a sessão: qual o nome da sua empresa?',
    placeholder: 'Nome da empresa',
  },
  {
    field: 'email',
    prompt: 'Para onde eu mando a confirmação e o mapa dos gargalos?',
    placeholder: 'seu@email.com.br',
  },
  {
    field: 'phone',
    prompt: 'E um telefone, caso a chamada caia.',
    placeholder: '(00) 00000-0000',
  },
  {
    field: 'revenue',
    prompt: 'Qual a faixa de faturamento mensal da empresa hoje?',
    options: REVENUE_OPTIONS,
  },
  {
    field: 'aiBudget',
    prompt: 'E quanto vocês já reservam por mês para inteligência artificial?',
    options: AI_BUDGET_OPTIONS,
  },
];

/** Digitos puros. Mascara e coisa de tela, nao de dado. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateField(field: QualificationField, value: string): string | null {
  const trimmed = value.trim();

  switch (field) {
    case 'company':
      return trimmed.length >= 2 ? null : 'Escreva o nome da empresa.';

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) ? null : 'Confira o e-mail.';

    case 'phone': {
      const digits = onlyDigits(trimmed);
      return digits.length === 10 || digits.length === 11
        ? null
        : 'Telefone com DDD, 10 ou 11 dígitos.';
    }

    case 'revenue':
      return REVENUE_OPTIONS.some((o) => o.value === trimmed) ? null : 'Escolha uma faixa.';

    case 'aiBudget':
      return AI_BUDGET_OPTIONS.some((o) => o.value === trimmed) ? null : 'Escolha uma faixa.';
  }
}

export function isComplete(partial: Partial<Qualification>): partial is Qualification {
  return QUALIFICATION_STEPS.every((step) => {
    const value = partial[step.field];
    return typeof value === 'string' && validateField(step.field, value) === null;
  });
}

export interface QualificationPayloadInput {
  sessionId: string;
  qualification: Qualification;
  vulnerabilityIndex: number | null;
  hasNoWebsite: boolean;
  websiteScore: number | null;
  frontsChecked: boolean[];
}

export interface QualificationPayload {
  action: 'qualification';
  sessionId: string;
  qualification: Qualification;
  context: {
    vulnerabilityIndex: number | null;
    hasNoWebsite: boolean;
    websiteScore: number | null;
    frontsCovered: number;
    frontsMissing: FrontId[];
  };
}

const FRONT_IDS: FrontId[] = FRONTS.map((front) => front.id);

export function buildQualificationPayload(
  input: QualificationPayloadInput
): QualificationPayload {
  return {
    action: 'qualification',
    sessionId: input.sessionId,
    qualification: {
      ...input.qualification,
      phone: onlyDigits(input.qualification.phone),
    },
    context: {
      vulnerabilityIndex: input.vulnerabilityIndex,
      hasNoWebsite: input.hasNoWebsite,
      websiteScore: input.websiteScore,
      frontsCovered: input.frontsChecked.filter(Boolean).length,
      frontsMissing: missingFronts(input.frontsChecked, FRONT_IDS),
    },
  };
}
