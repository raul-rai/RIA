import { describe, it, expect } from 'vitest';
import {
  QUALIFICATION_STEPS,
  validateField,
  isComplete,
  buildQualificationPayload,
  labelFor,
} from '../src/lib/qualification';

describe('QUALIFICATION_STEPS: cinco passos, na ordem do spec', () => {
  it('QUAL-01: sao cinco passos na ordem empresa, email, telefone, faturamento, budget', () => {
    expect(QUALIFICATION_STEPS.map((s) => s.field)).toEqual([
      'company',
      'email',
      'phone',
      'revenue',
      'aiBudget',
    ]);
  });

  it('QUAL-02: faturamento e budget sao faixas, os outros sao texto livre', () => {
    const byField = Object.fromEntries(QUALIFICATION_STEPS.map((s) => [s.field, s]));
    expect(byField.revenue.options).toBeDefined();
    expect(byField.aiBudget.options).toBeDefined();
    expect(byField.company.options).toBeUndefined();
    expect(byField.email.options).toBeUndefined();
    expect(byField.phone.options).toBeUndefined();
  });

  it('QUAL-03: todo passo tem a pergunta que o agente faz', () => {
    for (const s of QUALIFICATION_STEPS) {
      expect(s.prompt.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('validateField', () => {
  it('QUAL-04: empresa vazia ou de uma letra nao passa', () => {
    expect(validateField('company', '')).not.toBeNull();
    expect(validateField('company', ' ')).not.toBeNull();
    expect(validateField('company', 'A')).not.toBeNull();
    expect(validateField('company', 'Nexa Interiores')).toBeNull();
  });

  it('QUAL-05: email sem arroba ou sem dominio nao passa', () => {
    expect(validateField('email', 'raul')).not.toBeNull();
    expect(validateField('email', 'raul@')).not.toBeNull();
    expect(validateField('email', 'raul@gmail')).not.toBeNull();
    expect(validateField('email', 'raul@gmail.com')).toBeNull();
  });

  it('QUAL-06: telefone aceita 10 ou 11 digitos e ignora mascara', () => {
    expect(validateField('phone', '(16) 99787-9837')).toBeNull();
    expect(validateField('phone', '1699787983')).toBeNull();
    expect(validateField('phone', '169978')).not.toBeNull();
    expect(validateField('phone', '169978798370000')).not.toBeNull();
  });

  it('QUAL-07: faixas so aceitam valor da lista', () => {
    expect(validateField('revenue', 'inventado')).not.toBeNull();
    expect(validateField('revenue', 'ate-100k')).toBeNull();
    expect(validateField('aiBudget', 'inventado')).not.toBeNull();
    expect(validateField('aiBudget', 'nao-defini')).toBeNull();
  });
});

describe('isComplete', () => {
  it('QUAL-08: so e completo com os cinco campos validos', () => {
    expect(isComplete({ company: 'Nexa', email: 'a@b.com' })).toBe(false);
    expect(
      isComplete({
        company: 'Nexa',
        email: 'a@b.com',
        phone: '16997879837',
        revenue: 'ate-100k',
        aiBudget: 'nao-defini',
      })
    ).toBe(true);
  });
});

describe('buildQualificationPayload', () => {
  const qualification = {
    company: 'Nexa Interiores',
    email: 'contato@nexa.com.br',
    phone: '(16) 99787-9837',
    revenue: '100k-500k',
    aiBudget: '1k-5k',
  };

  it('QUAL-09: leva os cinco campos mais as duas notas e o caminho', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      hasNoWebsite: false,
      googleScore: 63,
      agenticScore: 41,
      path: 'otimizar',
    });

    expect(payload.action).toBe('qualification');
    expect(payload.sessionId).toBe('sess-1');
    expect(payload.qualification.company).toBe('Nexa Interiores');
    expect(payload.context.googleScore).toBe(63);
    expect(payload.context.agenticScore).toBe(41);
    expect(payload.context.path).toBe('otimizar');
    expect(payload.context.hasNoWebsite).toBe(false);
  });

  it('QUAL-16: o contexto nao carrega mais o indice sintetico nem as frentes', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      hasNoWebsite: false,
      googleScore: 63,
      agenticScore: 41,
      path: 'otimizar',
    });
    // Cada campo que saiu do contrato tem seu nome travado: o workflow do n8n
    // deixa de recebe-los, e o retorno de qualquer um seria uma mudanca de
    // contrato silenciosa.
    expect(payload.context).not.toHaveProperty('vulnerabilityIndex');
    expect(payload.context).not.toHaveProperty('websiteScore');
    expect(payload.context).not.toHaveProperty('frontsCovered');
    expect(payload.context).not.toHaveProperty('frontsMissing');
    expect(Object.keys(payload.context).sort()).toEqual(
      ['agenticScore', 'googleScore', 'hasNoWebsite', 'path']
    );
  });

  it('QUAL-17: as duas notas chegam separadas, sem nota geral', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      hasNoWebsite: false,
      googleScore: 90,
      agenticScore: 10,
      path: null,
    });
    expect(payload.context.googleScore).toBe(90);
    expect(payload.context.agenticScore).toBe(10);
    expect(JSON.stringify(payload.context)).not.toMatch(/overall|geral|average|media/i);
  });

  it('QUAL-10: o telefone sai so com digitos, pronto para discar', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      hasNoWebsite: false,
      googleScore: null,
      agenticScore: null,
      path: null,
    });
    expect(payload.qualification.phone).toBe('16997879837');
  });

  it('QUAL-11: sem site, o contexto diz isso e nao manda nota nenhuma', () => {
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      hasNoWebsite: true,
      googleScore: null,
      agenticScore: null,
      path: 'novo',
    });
    expect(payload.context.hasNoWebsite).toBe(true);
    expect(payload.context.googleScore).toBeNull();
    expect(payload.context.agenticScore).toBeNull();
    expect(payload.context.path).toBe('novo');
  });

  it('QUAL-18: nota nao medida segue null, nunca vira zero', () => {
    // Uma medicao que falhou e a outra que chegou: o lado que falhou precisa
    // continuar null no payload. Zero o n8n leria como site reprovado.
    const payload = buildQualificationPayload({
      sessionId: 'sess-1',
      qualification,
      hasNoWebsite: false,
      googleScore: null,
      agenticScore: 55,
      path: 'otimizar',
    });
    expect(payload.context.googleScore).toBeNull();
    expect(payload.context.agenticScore).toBe(55);
  });
});

describe('labelFor', () => {
  it('QUAL-12: faixa de faturamento conhecida vira o texto legivel', () => {
    expect(labelFor('revenue', '100k-500k')).toBe('R$ 100 mil a R$ 500 mil/mês');
  });

  it('QUAL-13: faixa de budget de IA conhecida vira o texto legivel', () => {
    expect(labelFor('aiBudget', '1k-5k')).toBe('R$ 1.000 a R$ 5.000/mês');
  });

  it('QUAL-14: campo de texto livre passa direto, sem opcoes para traduzir', () => {
    expect(labelFor('company', 'Nexa Interiores')).toBe('Nexa Interiores');
    expect(labelFor('email', 'contato@nexa.com.br')).toBe('contato@nexa.com.br');
  });

  it('QUAL-15: chave desconhecida degrada para o proprio valor, nao para vazio', () => {
    expect(labelFor('revenue', 'inventado')).toBe('inventado');
    expect(labelFor('aiBudget', 'inventado')).toBe('inventado');
  });
});
