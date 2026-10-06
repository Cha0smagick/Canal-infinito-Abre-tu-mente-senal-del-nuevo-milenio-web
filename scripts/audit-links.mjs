/* Auditoria de enlaces externos.
 *
 * Recorre TODOS los HTML y los assets/js/*.js, extrae URLs http(s) y las sondea.
 * Clasifica el resultado distinguiendo tres cosas que antes se confundian:
 *
 *   OK          2xx
 *   BLOQUEADO   403 / 401 / 429  -> el sitio ahuyenta bots. NO esta caido.
 *   INACCESIBLE 000 / DNS / timeout -> no se pudo saber. La red del runner lo puede
 *               tapar igual que un sitio muerto. NO es prueba de nada.
 *   CAIDO       404 / 410        -> si es un fallo real y bloquea el CI.
 *   ERROR       5xx              -> fallo del servidor, reintentar.
 *
 * Uso:
 *   node scripts/audit-links.mjs            informe legible, no falla el proceso
 *   node scripts/audit-links.mjs --ci       sale != 0 si hay CAIDO, escribe informe.json
 *   node scripts/audit-links.mjs --json     solo imprime el informe JSON
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ARGS = new Set(process.argv.slice(2));
const CI = ARGS.has('--ci');
const JSON_ONLY = ARGS.has('--json');
const TIMEOUT_MS = 12000;

const SOURCE_FILES = [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => path.join(ROOT, f)),
  ...fs.readdirSync(path.join(ROOT, 'assets', 'js'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(ROOT, 'assets', 'js', f)),
];

/* Permite parentesisBalanceados porque las URLs de Wikipedia los llevan
 * (Infinito_(TV_channel)), pero exige que el parentesis que cierra balancee. */
const URL_RE = /https?:\/\/[^\s"'`<>\[\]{}]+/g;

function collect() {
  const seen = new Map(); // url -> Set<file>
  for (const file of SOURCE_FILES) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const raw of text.matchAll(URL_RE)) {
      const match = raw[0];
      // Si lo que viene justo despues es una interpolacion, la URL estaba
      // truncada por el template literal: no es una URL real, es un prefijo.
      const sigue = text[raw.index + match.length];
      if (sigue === '$' || sigue === '{') continue;
      // Si sigue un '+', es el arranque de una concatenacion: 'https://x/'+id
      if (sigue === '+') continue;
      // Igual, aunque la cadena este cerrada antes: 'https://x/'+id
      const fin = raw.index + match.length;
      if (/^['"`]\s*\+/.test(text.slice(fin, fin + 4))) continue;
      // Si lo que viene justo antes es una concatenacion JS (PREFIX + 'https://...'),
      // el texto solo contiene la cola de la URL: sin el prefijo no se puede
      // comprobar. Se omite en vez de reportar un 404 falso.
      const antes = text.slice(Math.max(0, raw.index - 12), raw.index);
      if (/[+]\s*['"`]$/.test(antes)) continue;
      // Prefijo asignado a una constante (var W = 'https://.../'). El espacio
      // antes del '=' lo distingue de un atributo HTML como href="https://...".
      if (/\s=\s*['"`]$/.test(antes)) continue;

      // Quita el parentesis de cierre que sobre cuando no abre ninguno.
      let url = match;
      while (url.endsWith(')') && (url.match(/\(/g) || []).length < (url.match(/\)/g) || []).length) {
        url = url.slice(0, -1);
      }
      url = url.replace(/[.,;:]+$/, '').replace(/['"`]+$/, '');

      // Descarta URLs de ejemplo, localhost y sites con placeholders.
      if (/localhost|127\.0\.0\.1|example\.com|EXAMPLE|\$\{|\{\{|USER_|REPO_/i.test(url)) continue;
      // Descarta hosts desnudos y la raiz de un dominio: en este sitio solo
      // aparecen como prefijo de un template literal, nunca como enlace real.
      try {
        if (new URL(url).pathname === '/') continue;
      } catch {
        continue;
      }
      if (!seen.has(url)) seen.set(url, new Set());
      seen.get(url).add(path.relative(ROOT, file).replace(/\\/g, '/'));
    }
  }
  return seen;
}

async function probe(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; CanalInfinitoEncyclopedia/1.0; +auditoria de enlaces)',
        accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'es,en;q=0.8',
      },
    });
    clearTimeout(timer);
    const code = r.status;
    if (code >= 200 && code < 300) return { code, estado: 'ok' };
    if (code === 401 || code === 403 || code === 429) return { code, estado: 'bloqueado' };
    if (code === 404 || code === 410) return { code, estado: 'caido' };
    if (code >= 500) return { code, estado: 'error' };
    return { code, estado: 'raro' };
  } catch (e) {
    clearTimeout(timer);
    return { code: 0, estado: 'inaccesible', nota: e?.name || 'error-de-red' };
  }
}

const urls = collect();
const resultados = [];

if (!JSON_ONLY) {
  console.log(`Auditando ${urls.size} URLs en ${SOURCE_FILES.length} archivos\n`);
}

for (const [url, files] of urls) {
  const r = await probe(url);
  resultados.push({ url, estado: r.estado, codigo: r.code, nota: r.nota || '', en: [...files] });
}

const por = (e) => resultados.filter((r) => r.estado === e);
const caidos = por('caido');
const bloqueados = por('bloqueado');
const inaccesibles = por('inaccesible');
const errores = por('error');
const raros = por('raro');
const ok = por('ok');

const informe = {
  generado: new Date().toISOString(),
  total: resultados.length,
  ok: ok.length,
  bloqueado: bloqueados.length,
  caido: caidos.length,
  inaccesible: inaccesibles.length,
  error: errores.length,
  raro: raros.length,
  resultados: resultados.sort((a, b) => a.url.localeCompare(b.url)),
};

if (!JSON_ONLY) {
  const bloque = (titulo, lista, nota) => {
    if (!lista.length) return;
    console.log(`\n== ${titulo} (${lista.length}) ==${nota ? ' ' + nota : ''}`);
    for (const r of lista) console.log(`  ${String(r.codigo).padStart(3)}  ${r.url}`);
  };
  bloque('CAIDO (falla real)', caidos);
  bloque('BLOQUEADO (ahuenta bots, no esta caido)', bloqueados);
  bloque('INACCESIBLE (la red no dejo saber)', inaccesibles);
  bloque('ERROR 5xx (reintentar)', errores);
  bloque('RARO', raros);
  console.log(
    `\nResumen: ${resultados.length} URLs · ${ok.length} ok · ${bloqueados.length} bloqueados · ` +
      `${inaccesibles.length} inaccesibles · ${caidos.length} caidos · ${errores.length} error`
  );
}

if (ARGS.has('--json')) {
  console.log(JSON.stringify(informe, null, 1));
} else {
  fs.writeFileSync(path.join(ROOT, 'informe-enlaces.json'), JSON.stringify(informe, null, 1), 'utf8');
  console.log('-> informe-enlaces.json');
}

if (CI && caidos.length) {
  console.error(`\nFALLA: ${caidos.length} enlace(s) responden 404/410:`);
  for (const r of caidos) console.error(`  ${r.url}`);
  process.exit(1);
}
