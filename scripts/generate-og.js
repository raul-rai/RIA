// scripts/generate-og.js
// Gera public/og-image.png (1200x630) para previews no WhatsApp e LinkedIn.
// Rodar: node scripts/generate-og.js
//
// A cor vem de BRAND, que e a mesma declarada em src/index.css como
// --color-accent. tests/brand.test.ts falha se as duas divergirem — o preview
// do WhatsApp tem que parecer a pagina que abre depois dele.
//
// Nota sobre a decisao D-05 do spec: ela fixava #00E5FF, escolhido quando o
// site tinha fundo #010408. O site virou branco; #00E5FF sobre branco da ~1,5:1
// e some. A familia teal abaixo mantem a intencao (ciano como cor da onda) num
// valor que sobrevive ao fundo claro.

import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BRAND = '#00707A';
const BRAND_DARK = '#005662';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/og-image.png');
const W = 1200;
const H = 630;

const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wave" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${BRAND}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="waveDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND_DARK}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${BRAND}" stop-opacity="0.06"/>
    </linearGradient>
  </defs>

  <!-- Onda, no mesmo registro claro da pagina -->
  <ellipse cx="250" cy="620" rx="760" ry="400" fill="url(#wave)"/>
  <ellipse cx="960" cy="540" rx="540" ry="300" fill="url(#waveDark)"/>

  <!-- Filete da marca -->
  <rect x="80" y="150" width="64" height="5" fill="${BRAND}"/>

  <text x="80" y="300" font-family="Georgia, 'Times New Roman', serif"
        font-size="150" font-weight="bold" fill="#0f172a">RIA</text>

  <text x="80" y="372" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="34" fill="#334155">Revolução da Inteligência Artificial</text>

  <text x="80" y="424" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="23" fill="${BRAND_DARK}" letter-spacing="1.5">Consultoria em IA para empresas · Brasil</text>
</svg>`;

await sharp({
  create: { width: W, height: H, channels: 3, background: '#ffffff' },
})
  .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

const sizeKB = Math.round(statSync(OUT).size / 1024);
console.log(`OG gerada em ${BRAND}: ${OUT}`);
console.log(`Tamanho: ${sizeKB} KB ${sizeKB > 250 ? '(ATENCAO: perto do limite de 300KB do WhatsApp)' : '(dentro do limite)'}`);
