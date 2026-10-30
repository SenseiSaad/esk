import sharp from 'sharp';
import { readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, parse } from 'node:path';

const SRC = '../Cuberto-newWebsite-Clone/projectImages';
const OUT = 'public/work';
mkdirSync(OUT, { recursive: true });

for (const f of readdirSync(SRC).filter((f) => f.endsWith('.png'))) {
  const { name } = parse(f);
  for (const w of [640, 1100]) {
    const info = await sharp(join(SRC, f))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 76, effort: 5 })
      .toFile(join(OUT, `${name}-${w}.webp`));
    console.log(`${name}-${w}.webp`, info.width + 'x' + info.height, (info.size / 1024).toFixed(0) + 'KB');
  }
}
copyFileSync('../Cuberto-newWebsite-Clone/videos/cover(4).mp4', 'public/video/gungear.mp4');
