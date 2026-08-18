import { describe, it, expect } from 'vitest';
import { buildBookingUrl } from '../src/lib/booking';

const BASE = 'https://cal.com/raul-vieira/30min';

describe('buildBookingUrl', () => {
  it('BOOK-01: pre-preenche nome e email na agenda', () => {
    const url = new URL(buildBookingUrl(BASE, { name: 'Nexa Interiores', email: 'a@b.com' }));
    expect(url.searchParams.get('name')).toBe('Nexa Interiores');
    expect(url.searchParams.get('email')).toBe('a@b.com');
  });

  it('BOOK-02: marca o modo embed, para a agenda nao renderizar a pagina inteira', () => {
    const url = new URL(buildBookingUrl(BASE, { name: 'Nexa', email: 'a@b.com' }));
    expect(url.searchParams.get('embed')).toBe('true');
  });

  it('BOOK-03: leva as notas quando existem, e omite quando nao', () => {
    const comNotas = new URL(
      buildBookingUrl(BASE, { name: 'Nexa', email: 'a@b.com', notes: 'Frentes 1, 3 e 5' })
    );
    expect(comNotas.searchParams.get('notes')).toBe('Frentes 1, 3 e 5');

    const semNotas = new URL(buildBookingUrl(BASE, { name: 'Nexa', email: 'a@b.com' }));
    expect(semNotas.searchParams.has('notes')).toBe(false);
  });

  it('BOOK-04: preserva query que ja exista na base', () => {
    const url = new URL(
      buildBookingUrl(`${BASE}?theme=light`, { name: 'Nexa', email: 'a@b.com' })
    );
    expect(url.searchParams.get('theme')).toBe('light');
    expect(url.searchParams.get('name')).toBe('Nexa');
  });

  it('BOOK-05: base vazia devolve string vazia, sem estourar', () => {
    expect(buildBookingUrl('', { name: 'Nexa', email: 'a@b.com' })).toBe('');
  });
});
