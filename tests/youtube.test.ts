import { describe, it, expect } from 'vitest';
import { playerSrc } from '../src/lib/youtube';

describe('playerSrc: monta o embed nocookie', () => {
  it('YT-01: usa o dominio sem cookie e o id extraido do embed', () => {
    const src = playerSrc('https://www.youtube-nocookie.com/embed/abc123?autoplay=1');
    expect(src.startsWith('https://www.youtube-nocookie.com/embed/abc123?')).toBe(true);
  });

  it('YT-02: aplica start e end quando informados', () => {
    const src = playerSrc('https://www.youtube-nocookie.com/embed/abc123', 30, 90);
    const u = new URL(src);
    expect(u.searchParams.get('start')).toBe('30');
    expect(u.searchParams.get('end')).toBe('90');
  });

  it('YT-03: sem end, nao inclui o parametro end', () => {
    const src = playerSrc('https://www.youtube-nocookie.com/embed/abc123', 30);
    expect(new URL(src).searchParams.has('end')).toBe(false);
  });

  it('YT-04: extrai id da forma v=', () => {
    const src = playerSrc('https://www.youtube.com/watch?v=xyz789');
    expect(src).toContain('/embed/xyz789?');
  });
});
