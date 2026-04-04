// scripts/generate-og.js
// Gera public/og-image.png (1200x630) para previews no WhatsApp e LinkedIn.
// Rodar uma vez: node scripts/generate-og.js
// Requer: npm install --save-dev sharp (feito no Plan 01)
// Source: https://sharp.pixelplumbing.com/api-constructor + api-composite

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/og-image.png');
const W = 1200;
const H = 630;

// SVG overlay: gradiente azul evocando o tsunami + texto branco
// Usa fontes web-safe (Arial/Helvetica) — sharp/librsvg não acessa fontes do sistema Windows
const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wave" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#2a42ec" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#2a42ec" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="waveDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2ab0" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#2a42ec" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <!-- Onda grande — evoca o tsunami do Hero -->
  <ellipse cx="250" cy="560" rx="700" ry="420" fill="url(#wave)" opacity="0.7"/>
  <!-- Onda secundária para profundidade -->
  <ellipse cx="900" cy="480" rx="500" ry="300" fill="url(#waveDark)" opacity="0.5"/>

  <!-- Marca: RIA -->
  <text
    x="80" y="290"
    font-family="Helvetica Neue, Arial, sans-serif"
    font-size="160"
    font-weight="bold"
    fill="#ffffff"
    opacity="0.95"
  >RIA</text>

  <!-- Tagline principal -->
  <text
    x="80" y="370"
    font-family="Helvetica Neue, Arial, sans-serif"
    font-size="34"
    fill="#ffffff"
    opacity="0.75"
  >Revolução da Inteligência Artificial</text>

  <!-- Subtítulo / proposta de valor -->
  <text
    x="80" y="420"
    font-family="Helvetica Neue, Arial, sans-serif"
    font-size="22"
    fill="#ffffff"
    opacity="0.50"
  >Consultoria em IA para empresas | Brasil</text>
</svg>`;

await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: '#000000',
  },
})
  .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

// Verificar tamanho após geração — alertar se próximo do limite WhatsApp
import { statSync } from 'fs';
const { size } = statSync(OUT);
const sizeKB = Math.round(size / 1024);
console.log(`OG image gerada: ${OUT}`);
console.log(`Tamanho: ${sizeKB}KB ${sizeKB > 250 ? 'ATENCAO: proximo do limite de 300KB do WhatsApp' : 'dentro do limite WhatsApp (< 300KB)'}`);
