// Builds the amber logo and mark-only SVG from the conference logo artwork.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('../conference/assets/images/logo.svg', 'utf8');
const paths = [...src.matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]);
const isMark = (p) => /fill="#(6[BEF]|7[0-9A])/i.test(p);
const amber = (p) => p.replace(/fill="#[0-9a-f]{6}"/i, 'fill="#f2a21c"');
const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img">${body.join('')}</svg>\n`;
const mark = paths.filter(isMark).map(amber);
const text = paths.filter((p) => !isMark(p)).map((p) => p.replace(/fill="#[0-9a-f]{6}"/i, 'fill="#2a1a06"'));
const footerText = text.map((p) => p.replace('#2a1a06', '#ffffff'));
writeFileSync('public/img/logo.svg', svg('0 0 594 254', [...mark, ...text]));
writeFileSync('public/img/logo-light.svg', svg('0 0 594 254', [...mark, ...footerText]));
writeFileSync('public/img/mark.svg', svg('0 0 240 254', mark));
console.log({ total: paths.length, mark: mark.length, text: text.length });
