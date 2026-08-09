import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');

const imagesToOptimize = []; // Sem PNGs pendentes de conversao no momento.

async function optimizeImages() {
  for (const img of imagesToOptimize) {
    const inputPath = path.join(publicDir, img);
    const outputPath = path.join(publicDir, img.replace('.png', '.webp'));

    if (fs.existsSync(inputPath)) {
      console.log(`Optimizing ${img}...`);
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath);
      
      const origSize = fs.statSync(inputPath).size;
      const newSize = fs.statSync(outputPath).size;
      console.log(`Saved ${img.replace('.png', '.webp')} - Reduced from ${(origSize/1024/1024).toFixed(2)}MB to ${(newSize/1024).toFixed(2)}KB`);
    } else {
      console.log(`File not found: ${inputPath}`);
    }
  }
}

optimizeImages().catch(console.error);
