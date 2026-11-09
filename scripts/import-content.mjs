// One-off import of site content from a phpMyAdmin SQL dump.
// Usage: node scripts/import-content.mjs /path/to/website-db.sql
//
// Only tables in ALLOWED are ever parsed. Tables holding personal data, health
// data, accounts or tokens (emails, comments, users, personal_access_tokens...)
// are skipped at the statement level, so their rows never reach this process's
// output.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';

const ALLOWED = [
  'abouts', 'advantages', 'contacts', 'contact_windows', 'doctors', 'faqs',
  'pets', 'spects', 'prices', 'services', 'index_sliders', 'presses',
  'galleries', 'gallery_filters', 'four_example_titles', 'four_example_images',
  'spect_examples', 'spect_example_images', 'pet_videos',
];

const HTML_FIELDS = new Set([
  'description', 'text', 'desc', 'short_description',
]);
const LANGS = { 1: 'hy', 2: 'en' };
const OUT = path.resolve('src/content');

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error('Usage: node scripts/import-content.mjs /path/to/website-db.sql');
  process.exit(1);
}

/** Parses the VALUES part of an INSERT, starting at `i`; returns rows and end index. */
function parseValues(sql, start) {
  const rows = [];
  let i = start;
  for (;;) {
    while (sql[i] !== '(') {
      if (sql[i] === ';') return { rows, end: i };
      i++;
    }
    i++;
    const row = [];
    for (;;) {
      while (/\s/.test(sql[i])) i++;
      if (sql[i] === "'") {
        i++;
        let value = '';
        for (;;) {
          const c = sql[i];
          if (c === '\\') {
            const n = sql[i + 1];
            value += { n: '\n', r: '\r', t: '\t', 0: '\0' }[n] ?? n;
            i += 2;
          } else if (c === "'" && sql[i + 1] === "'") {
            value += "'";
            i += 2;
          } else if (c === "'") {
            i++;
            break;
          } else {
            value += c;
            i++;
          }
        }
        row.push(value);
      } else {
        let token = '';
        while (sql[i] !== ',' && sql[i] !== ')') token += sql[i++];
        token = token.trim();
        row.push(token === 'NULL' ? null : Number(token));
      }
      while (/\s/.test(sql[i])) i++;
      if (sql[i] === ',') {
        i++;
        continue;
      }
      i++; // closing paren
      break;
    }
    rows.push(row);
  }
}

function extractTable(sql, table) {
  const marker = `INSERT INTO \`${table}\` (`;
  const at = sql.indexOf(marker);
  if (at === -1) return [];
  const colsEnd = sql.indexOf(')', at + marker.length);
  const cols = sql
    .slice(at + marker.length, colsEnd)
    .split(',')
    .map((c) => c.trim().replaceAll('`', ''));
  const valuesAt = sql.indexOf('VALUES', colsEnd) + 'VALUES'.length;
  return parseValues(sql, valuesAt).rows.map((r) =>
    Object.fromEntries(cols.map((c, n) => [c, r[n]])),
  );
}

const clean = (html) =>
  sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
    exclusiveFilter: (f) =>
      ['p', 'ul', 'ol', 'li'].includes(f.tag) && !f.text.replace(/ /g, ' ').trim(),
  })
    .replace(/&nbsp;/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();

function prepare(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'created_at' || key === 'updated_at') continue;
    if (typeof value === 'string') {
      out[key] = HTML_FIELDS.has(key) ? clean(value) : value.replace(/\s+$/g, '');
    } else {
      out[key] = value;
    }
  }
  return out;
}

const sql = await readFile(dumpPath, 'utf8');
const shared = {};
const byLang = { hy: {}, en: {} };

for (const table of ALLOWED) {
  const rows = extractTable(sql, table).map(prepare);
  if (rows.length === 0) throw new Error(`No rows found for table ${table}`);
  if ('lang_id' in rows[0]) {
    for (const [id, lang] of Object.entries(LANGS)) {
      byLang[lang][table] = rows
        .filter((r) => String(r.lang_id) === id)
        .map(({ lang_id, ...rest }) => rest);
    }
  } else {
    shared[table] = rows;
  }
}

for (const lang of Object.keys(byLang)) {
  await mkdir(path.join(OUT, lang), { recursive: true });
  for (const [table, rows] of Object.entries(byLang[lang])) {
    await writeFile(path.join(OUT, lang, `${table}.json`), JSON.stringify(rows, null, 2) + '\n');
  }
}
await mkdir(path.join(OUT, 'shared'), { recursive: true });
for (const [table, rows] of Object.entries(shared)) {
  await writeFile(path.join(OUT, 'shared', `${table}.json`), JSON.stringify(rows, null, 2) + '\n');
}

const counts = Object.fromEntries(
  ALLOWED.map((t) => [
    t,
    shared[t] ? shared[t].length : `hy ${byLang.hy[t].length} / en ${byLang.en[t].length}`,
  ]),
);
console.table(counts);
