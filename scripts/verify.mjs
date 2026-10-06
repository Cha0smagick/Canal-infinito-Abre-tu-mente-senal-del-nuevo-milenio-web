import fs from 'node:fs';
import path from 'node:path';

const PAGES = fs.readdirSync('.').filter((f) => f.endsWith('.html') && !f.startsWith('_'));
const LOCAL = new Set(fs.readdirSync('.').filter((f) => !f.startsWith('.') && f !== '.opencode' && f !== '.playwright-mcp'));

const problems = [];
const stats = [];

for (const f of PAGES) {
  const t = fs.readFileSync(f, 'utf8');

  /* --- ids duplicados --- */
  const ids = [...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];

  /* --- h1 --- */
  const h1 = (t.match(/<h1[\s>]/g) || []).length;

  /* --- lang + charset + viewport + title + description --- */
  const meta = {
    lang: /<html[^>]+lang="/.test(t),
    charset: /<meta[^>]+charset=/i.test(t),
    viewport: /name="viewport"/i.test(t),
    title: /<title>[\s\S]*?<\/title>/.test(t),
    desc: /name="description"/i.test(t),
    favicon: /rel="icon"/i.test(t),
    skip: /class="skip-link"/.test(t),
    dataPage: /<body[^>]+data-page=/.test(t),
  };

  /* --- enlaces y recursos locales --- */
  const refs = new Set();
  for (const m of t.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(u)) continue;
    // Las rutas construidas por concatenación de JS (src="'+ytThumb(v.id)+'")
    // no son rutas literales: se ignoran.
    if (u.includes("'") || u.includes('+') || u.includes('${')) continue;
    refs.add(u.split('#')[0].split('?')[0]);
  }
  const missingRefs = [...refs].filter((r) => r && !LOCAL.has(r) && !fs.existsSync(path.join('.', r)));

  /* --- anclas internas --- */
  const badAnchors = [];
  for (const m of t.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] && !ids.includes(m[1])) badAnchors.push(m[1]);
  }

  /* --- etiquetas sin cerrar (heurística) --- */
  const voids = new Set(['meta', 'link', 'br', 'hr', 'img', 'input', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);
  const stack = [];
  const unclosed = [];
  for (const m of t.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)>/g)) {
    const [, close, name, attrs, selfClose] = m;
    const n = name.toLowerCase();
    if (voids.has(n) || selfClose) continue;
    if (attrs.trim().endsWith('?')) continue;
    if (close) {
      const i = stack.lastIndexOf(n);
      if (i === -1) unclosed.push(`cierre sobrante </${n}>`);
      else stack.splice(i, 1);
    } else stack.push(n);
  }

  /* --- ids de YouTube únicos y presentes en el catálogo --- */
  const yt = new Set([...t.matchAll(/["']([A-Za-z0-9_-]{11})["']/g)].map((m) => m[1]).filter((x) => /\d/.test(x)));

  if (dupes.length) problems.push(`${f}: ids duplicados -> ${dupes.join(', ')}`);
  if (h1 !== 1) problems.push(`${f}: h1 = ${h1} (debe ser 1)`);
  const missMeta = Object.entries(meta).filter(([, v]) => !v).map(([k]) => k);
  if (missMeta.length) problems.push(`${f}: falta -> ${missMeta.join(', ')}`);
  if (missingRefs.length) problems.push(`${f}: recursos inexistentes -> ${missingRefs.join(', ')}`);
  if (badAnchors.length) problems.push(`${f}: anclas rotas -> ${[...new Set(badAnchors)].join(', ')}`);
  if (unclosed.length) problems.push(`${f}: etiquetas -> ${unclosed.slice(0, 6).join(' | ')}${stack.length ? ' | sin cerrar: ' + stack.slice(0, 6).join(',') : ''}`);

  stats.push({ file: f, kb: (Buffer.byteLength(t) / 1024).toFixed(1), ids: ids.length, ytIds: yt.size, h1 });
}

console.table(stats);
console.log('\n=== PROBLEMAS (' + problems.length + ') ===');
problems.forEach((p) => console.log(' - ' + p));
