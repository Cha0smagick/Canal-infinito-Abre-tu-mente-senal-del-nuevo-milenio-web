/**
 * scan-decls.mjs — Mapa exacto de declaraciones de nivel superior dentro del
 * <script> inline de cada pagina legacy.
 *
 * Necesario para build-legacy.mjs: hay que saber, para cada pagina, que
 * variables declara la region del catalogo, en que orden, y si su
 * inicializador es un literal (object/array) — porque eso es lo que se puede
 * reconstruir desde data-lore.js.
 *
 * Escanea respetando: comillas simples/dobles, template literals con
 * interpolacion anidada, escapes, comentarios de linea y de bloque, y
 * profundidad de parentesis/llaves/corchetes.
 *
 * Uso: node scripts/scan-decls.mjs [pagina.html ...]
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Este modulo lo importa build-legacy.mjs: la tabla de declaraciones solo debe
 * imprimirse cuando se ejecuta como comando, nunca al importarse. */
export const esMain = process.argv[1] && pathResuelto() === fileURLToPath(import.meta.url);
function pathResuelto() {
  try { return fileURLToPath(new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href); }
  catch { return ''; }
}

const ROOT = process.cwd();
const PAGES = ['programas.html', 'videoteca.html', 'video.html', 'tv.html'];

/** Devuelve el contenido de cada <script> sin src= de la pagina. */
export function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/\bsrc\s*=/i.test(m[1])) continue;
    out.push({ attrs: m[1].trim(), code: m[2], index: m.index });
  }
  return out;
}

/**
 * Recorre `code` y devuelve una lista de eventos. No interpretamos JS, solo
 *walking de caracteres con un estado pequeno.
 */
function* tokens(code) {
  let i = 0;
  const n = code.length;
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  while (i < n) {
    const c = code[i];
    const d = code[i + 1];
    // Comentario de linea
    if (c === '/' && d === '/') {
      let j = code.indexOf('\n', i);
      if (j < 0) j = n;
      yield { t: 'comment', from: i, to: j };
      i = j;
      continue;
    }
    // Comentario de bloque
    if (c === '/' && d === '*') {
      let j = code.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      yield { t: 'comment', from: i, to: j };
      i = j;
      continue;
    }
    // Cadena simple
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === c) { j += 1; break; }
        if (code[j] === '\n') break; // cadena rota: salida defensiva
        j += 1;
      }
      yield { t: 'string', from: i, to: j };
      i = j;
      continue;
    }
    // Template literal (con ${} anidado que puede contener mas plantillas)
    if (c === '`') {
      let j = i + 1;
      let tplDepth = 0;
      while (j < n) {
        const e = code[j];
        if (e === '\\') { j += 2; continue; }
        if (e === '$' && code[j + 1] === '{') { tplDepth += 1; j += 2; continue; }
        if (tplDepth > 0 && e === '}') { tplDepth -= 1; j += 1; continue; }
        if (tplDepth > 0 && (e === '`' || e === '"' || e === "'")) {
          // reutiliza el escaner saltando la cadena dentro de la interpolacion
          let k = e === '`' ? j + 1 : j + 1;
          const q = e;
          while (k < n) {
            if (code[k] === '\\') { k += 2; continue; }
            if (code[k] === q) { k += 1; break; }
            k += 1;
          }
          j = k;
          continue;
        }
        if (tplDepth === 0 && e === '`') { j += 1; break; }
        j += 1;
      }
      yield { t: 'template', from: i, to: j };
      i = j;
      continue;
    }
    if (c === '(') { depthParen += 1; yield { t: 'open', ch: c, depth: depthParen, at: i }; i += 1; continue; }
    if (c === ')') { depthParen -= 1; yield { t: 'close', ch: c, depth: depthParen, at: i }; i += 1; continue; }
    if (c === '[') { depthBracket += 1; yield { t: 'open', ch: c, depth: depthBracket, at: i }; i += 1; continue; }
    if (c === ']') { depthBracket -= 1; yield { t: 'close', ch: c, depth: depthBracket, at: i }; i += 1; continue; }
    if (c === '{') { depthBrace += 1; yield { t: 'open', ch: c, depth: depthBrace, at: i }; i += 1; continue; }
    if (c === '}') { depthBrace -= 1; yield { t: 'close', ch: c, depth: depthBrace, at: i }; i += 1; continue; }
    yield { t: 'code', ch: c, at: i, dP: depthParen, dB: depthBracket, dC: depthBrace };
    i += 1;
  }
}

/** Corta el codigo en "trozos" separando codigo real de comentarios/cadenas. */
export function codeOnly(code) {
  const parts = [];
  let last = 0;
  const mask = new Array(code.length).fill(true);
  for (const tk of tokens(code)) {
    if (tk.t === 'comment' || tk.t === 'string' || tk.t === 'template') {
      for (let k = tk.from; k < tk.to && k < mask.length; k += 1) mask[k] = false;
    }
  }
  for (let i = 0; i < code.length; i += 1) {
    if (mask[i] && !parts.length) parts.push({ from: i });
    if (mask[i] && parts.length) parts[parts.length - 1].to = i + 1;
  }
  void last;
  return parts.map((p) => code.slice(p.from, p.to)).join('');
}

/**
 * Devuelve las declaraciones de nivel superior: nombre, palabra clave,
 * rango del inicializador y tipo aparente del literal.
 */
export function topLevelDeclarations(code) {
  const mask = new Array(code.length).fill(true);
  for (const tk of tokens(code)) {
    if (tk.t === 'comment' || tk.t === 'string' || tk.t === 'template') {
      for (let k = tk.from; k < tk.to && k < mask.length; k += 1) mask[k] = false;
    }
  }
  const atTop = (i) => {
    let dP = 0; let dB = 0; let dC = 0;
    for (let k = 0; k < i; k += 1) {
      if (!mask[k]) continue;
      const c = code[k];
      if (c === '(') dP += 1; else if (c === ')') dP -= 1;
      else if (c === '[') dB += 1; else if (c === ']') dB -= 1;
      else if (c === '{') dC += 1; else if (c === '}') dC -= 1;
    }
    return dP === 0 && dB === 0 && dC === 0;
  };
  // Indices de codigo real, agrupados por "palabra"
  const declRe = /(^|[;{}\n])\s*(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g;
  const found = [];
  let m;
  while ((m = declRe.exec(code))) {
    const kw = m[2];
    const name = m[3];
    const eqAt = m.index + m[0].lastIndexOf('=');
    if (!atTop(eqAt)) continue;
    // tipo aparente del inicializador
    let j = eqAt + 1;
    while (j < code.length && /\s/.test(code[j])) j += 1;
    const first = code[j];
    const kind = first === '[' ? 'array' : first === '{' ? 'object'
      : first === 'f' && code.startsWith('function', j) ? 'function'
        : first === 'n' && code.startsWith('new ', j) ? 'new'
          : 'expr';
    // rango del inicializador: hasta ; en nivel superior o hasta , en nivel superior
    let dP = 0; let dB = 0; let dC = 0; let end = -1;
    for (let k = j; k < code.length; k += 1) {
      if (!mask[k]) continue;
      const c = code[k];
      if (c === '(') dP += 1;
      else if (c === ')') dP -= 1;
      else if (c === '[') dB += 1;
      else if (c === ']') dB -= 1;
      else if (c === '{') dC += 1;
      else if (c === '}') dC -= 1;
      else if ((c === ';' || c === ',') && dP === 0 && dB === 0 && dC === 0) { end = k; break; }
    }
    if (end < 0) end = code.length;
    found.push({ kw, name, declFrom: eqAt - m[0].length + m[1].length, initFrom: j, initTo: end, kind, initLen: end - j });
  }
  return found;
}

if (esMain) {
const targets = process.argv.slice(2).length ? process.argv.slice(2) : PAGES;
let problems = 0;

for (const page of targets) {
  const path = join(ROOT, page);
  if (!existsSync(path)) { console.log(`\n### ${page} — NO EXISTE`); problems += 1; continue; }
  const html = readFileSync(path, 'utf8');
  const scripts = inlineScripts(html);
  console.log(`\n### ${page} — ${scripts.length} <script> inline(s)`);
  scripts.forEach((s, si) => {
    const decls = topLevelDeclarations(s.code);
    console.log(`  -- script #${si} (offset ${s.index}, ${s.code.length} chars) -> ${decls.length} declaraciones`);
    for (const d of decls) {
      const preview = s.code.slice(d.initFrom, Math.min(d.initFrom + 90, d.initTo)).replace(/\s+/g, ' ');
      console.log(`     ${d.kw.padEnd(5)} ${d.name.padEnd(18)} ${d.kind.padEnd(9)} [${d.initFrom},${d.initTo}) len=${String(d.initLen).padStart(6)}  ${preview}`);
    }
  });
}

if (problems) console.log(`\n=== PROBLEMAS (${problems}) ===`);
else console.log('\n=== OK ===');
}
