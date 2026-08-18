import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

describe('SEO meta tags (SEO-01 to SEO-05)', () => {
  it('SEO-01: has meta description', () => {
    expect(html).toContain('<meta name="description"');
  });

  it('SEO-02: has og:title', () => {
    expect(html).toContain('property="og:title"');
  });

  it('SEO-02: has og:description', () => {
    expect(html).toContain('property="og:description"');
  });

  it('SEO-02: has og:image with absolute URL', () => {
    expect(html).toContain('property="og:image"');
    expect(html).toMatch(/og:image.*content="https:\/\//);
  });

  it('SEO-02: has og:url', () => {
    expect(html).toContain('property="og:url"');
  });

  it('SEO-03: has twitter:card', () => {
    expect(html).toContain('name="twitter:card"');
  });

  it('SEO-04: has favicon link', () => {
    expect(html).toContain('href="/favicon.ico"');
  });

  it('SEO-05: has canonical link', () => {
    expect(html).toContain('rel="canonical"');
  });

  it('SEO-01+02: meta description is max 155 chars', () => {
    const match = html.match(/<meta name="description" content="([^"]+)"/);
    if (match) {
      expect(match[1].length).toBeLessThanOrEqual(155);
    }
    // If tag missing, SEO-01 test above already catches it
  });
});
