// Gera os favicons a partir do retrato self-hostado (public/raul.pedro.webp).
// Uso: node scripts/generate-favicon.js
import { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(rootDir, 'public', 'raul.pedro.webp');
const publicDir = path.join(rootDir, 'public');

// Recorte quadrado centrado no rosto (imagem original: 864x1184).
const FACE_CROP = { left: 140, top: 40, width: 600, height: 600 };

const PNG_SIZES = [16, 32, 180];
const ICO_SIZES = [16, 32, 48];

function renderAt(size) {
  return sharp(source)
    .extract(FACE_CROP)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer();
}

// Empacota PNGs em um .ico (o formato aceita PNG embutido desde o Vista).
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: icone
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // paleta
    entry.writeUInt8(0, 3); // reservado
    entry.writeUInt16LE(1, 4); // planos
    entry.writeUInt16LE(32, 6); // bits por pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function main() {
  for (const size of PNG_SIZES) {
    const data = await renderAt(size);
    const name = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`;
    await writeFile(path.join(publicDir, name), data);
    console.log(`${name} (${size}x${size}, ${(data.length / 1024).toFixed(1)} kB)`);
  }

  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, data: await renderAt(size) });
  }
  const ico = packIco(icoImages);
  await writeFile(path.join(publicDir, 'favicon.ico'), ico);
  console.log(`favicon.ico (${ICO_SIZES.join('/')}, ${(ico.length / 1024).toFixed(1)} kB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
