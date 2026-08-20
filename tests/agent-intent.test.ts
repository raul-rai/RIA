import { describe, it, expect } from 'vitest';
import { shouldInject } from '../src/lib/agent-intent';
import type { InjectionGuardInput } from '../src/lib/agent-intent';

const base: InjectionGuardInput = {
  stage: 'chat',
  isTyping: false,
  messages: [{ role: 'assistant', content: 'Olá.' }],
  candidateUserMessage: 'Quero montar minha pauta.',
};

describe('shouldInject: quando a mensagem do botao entra na conversa', () => {
  it('GUARD-01: conversa parada em chat aceita a injecao', () => {
    expect(shouldInject(base)).toBe(true);
  });

  it('GUARD-02: qualificacao em andamento bloqueia — o lead esta digitando telefone', () => {
    expect(shouldInject({ ...base, stage: 'qualifying' })).toBe(false);
  });

  it('GUARD-03: agenda aberta bloqueia — a conversao ja estava ganha', () => {
    expect(shouldInject({ ...base, stage: 'booking' })).toBe(false);
  });

  it('GUARD-04: agente respondendo bloqueia — duas falas do bot sairiam fora de ordem', () => {
    expect(shouldInject({ ...base, isTyping: true })).toBe(false);
  });

  it('GUARD-05: mesma fala do lead na sequencia bloqueia — clique duplo nao duplica', () => {
    expect(
      shouldInject({
        ...base,
        messages: [
          { role: 'assistant', content: 'Olá.' },
          { role: 'user', content: 'Quero montar minha pauta.' },
          { role: 'assistant', content: 'Pauta anotada.' },
        ],
      })
    ).toBe(false);
  });

  it('GUARD-06: fala igual mais antiga nao bloqueia — so a ultima do lead conta', () => {
    expect(
      shouldInject({
        ...base,
        messages: [
          { role: 'user', content: 'Quero montar minha pauta.' },
          { role: 'assistant', content: 'Pauta anotada.' },
          { role: 'user', content: 'Somos uma metalúrgica.' },
          { role: 'assistant', content: 'Entendi.' },
        ],
      })
    ).toBe(true);
  });

  it('GUARD-07: intencao diferente sempre passa — e o lead voltando com dado novo', () => {
    expect(
      shouldInject({
        ...base,
        messages: [
          { role: 'user', content: 'Quero me adaptar primeiro — antes do meu concorrente. Por onde eu começo?' },
          { role: 'assistant', content: 'Começa por saber onde está o vazamento.' },
        ],
      })
    ).toBe(true);
  });
});
