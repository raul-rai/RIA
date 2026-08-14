// Baixa e otimiza os retratos das autoridades citadas no capitulo de prova.
//
// Por que existe: as imagens vinham direto de commons.wikimedia.org, em
// resolucao original (ate 1517px), sem width/height e sem CDN sob nosso
// controle — tres requisicoes cross-origin que podem falhar, mudar ou ser
// limitadas sem aviso, exatamente no bloco que sustenta a credibilidade.
//
// Uso: node scripts/fetch-authority-images.js

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/autoridades');

const SOURCES = [
  {
    slug: 'ricardo-amorim',
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ricardo_Amorim_1.jpg',
  },
  {
    slug: 'silvio-meira',
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Silvio_Meira_0038.jpg',
  },
  {
    slug: 'flavio-augusto',
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fl%C3%A1vio_Augusto_(cropped).jpg',
  },
];

// O card renderiza 320x208 CSS; 640px cobre telas 2x com folga.
const WIDTH = 640;
const HEIGHT = 416;

async function run() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const { slug, url } of SOURCES) {
    process.stdout.write(`  ${slug} ... `);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.log(`FALHOU (${res.status})`);
      continue;
    }
    const input = Buffer.from(await res.arrayBuffer());
    const output = await sharp(input)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top' })
      .webp({ quality: 78 })
      .toBuffer();

    writeFileSync(resolve(OUT_DIR, `${slug}.webp`), output);
    console.log(`${Math.round(output.length / 1024)} KB`);
  }

  console.log('\nPronto. Imagens em public/autoridades/');
  console.log('ATENCAO: verifique a licenca de cada arquivo no Wikimedia Commons');
  console.log('e mantenha a atribuicao exigida antes de publicar.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
