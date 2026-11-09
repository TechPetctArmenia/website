// Downloads the media referenced by the imported content from the old API host.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://api.petct-armenia.am/public/img';
const SOURCES = [
  ['index_sliders', 'image', 'slider-images'], ['abouts', 'img', 'about_us'],
  ['abouts', 'video', 'about_us'], ['doctors', 'image', 'doctors'],
  ['contact_windows', 'img', 'contact_window'], ['presses', 'img', 'press'],
  ['galleries', 'img_name', 'gallery'],
  ['shared:four_example_images', 'img_name', 'four_examples'],
  ['shared:spect_example_images', 'img_name', 'spect_page'],
  ['shared:pet_videos', 'video_name', 'video'], ['shared:pet_videos', 'poster_name', 'video'],
];
const load = async (f) => JSON.parse(await readFile(f, 'utf8'));
const wanted = new Set();
for (const [table, field, folder] of SOURCES) {
  const files = table.startsWith('shared:')
    ? [`src/content/shared/${table.slice(7)}.json`]
    : [`src/content/hy/${table}.json`, `src/content/en/${table}.json`];
  for (const f of files) for (const r of await load(f)) if (r[field]) wanted.add(`${folder}/${r[field]}`);
}
let ok = 0;
const failed = [];
for (const rel of wanted) {
  const isVideo = rel.endsWith('.mp4');
  const dest = path.join(isVideo ? 'public/media' : 'src/assets/media', rel);
  await mkdir(path.dirname(dest), { recursive: true });
  try { await access(dest); ok++; continue; } catch {}
  const res = await fetch(`${BASE}/${rel}`);
  if (!res.ok) { failed.push(`${rel} (${res.status})`); continue; }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  ok++;
}
console.log(`downloaded ${ok}/${wanted.size}`);
if (failed.length) console.log('FAILED:\n' + failed.join('\n'));
