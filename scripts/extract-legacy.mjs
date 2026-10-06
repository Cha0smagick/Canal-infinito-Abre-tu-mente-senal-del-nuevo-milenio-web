// Extrae los catálogos actuales de las 4 páginas legacy ejecutando su <script> inline
// en un sandbox con stubs DOM automáticos (Proxy) y volcando las const que nos interesan.
//
// Dos usos:
//   1. Como script (`node scripts/extract-legacy.mjs`) escribe data/legacy-current.json.
//   2. Como módulo: `import { extractAll }` → devuelve el objeto en memoria SIN escribir
//      nada. Lo usa check-catalog.mjs para comparar el build contra la referencia congelada.
//
// Si la página ya fue generada por build-legacy.mjs, su catálogo vive en
// assets/js/legacy/<page>.js; ese fichero se carga en el sandbox ANTES del script inline
// para que `window.CI_LEGACY.<page>` exista y la extracción siga funcionando.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();

const WANT = {
  'programas.html': ['orig', 'adq', 'allProgs', 'vidCatalog', 'progVideoMap', 'progVidColors'],
  'videoteca.html': ['catalog', 'programInfo', 'programColors', 'progIds', 'progColorsMap'],
  'video.html': ['catalog', 'programInfo', 'programColors', 'progColorsMap'],
  'tv.html': ['progNames', 'progColors', 'catalog'],
};

// Stub universal: cualquier propiedad devuelve un objeto/array/función que acepta cualquier llamada.
function makeStub(name = 'stub') {
  const cache = new Map();
  const target = function () { return proxy(); };
  const proxy = new Proxy(target, {
    get(t, prop) {
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === 'toString') return () => '';
      if (prop === Symbol.iterator) return function* () {};
      if (prop === 'length') return 0;
      if (prop === 'style' || prop === 'classList' || prop === 'dataset') return proxy;
      if (prop === 'prototype') return proxy;
      if (!cache.has(prop)) cache.set(prop, proxy);
      return cache.get(prop);
    },
    set() { return true; },
    apply() { return proxy; },
    construct() { return proxy; },
    has() { return true; },
  });
  void name;
  return proxy;
}

function sandboxFor() {
  const el = () => {
    const node = {
      innerHTML: '', textContent: '', value: '', style: {}, dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      children: [], childNodes: [],
      setAttribute() {}, getAttribute: () => null, removeAttribute() {},
      appendChild(c) { return c; }, append() {}, remove() {}, insertBefore(c) { return c; },
      addEventListener() {}, removeEventListener() {}, focus() {}, blur() {},
      querySelector: () => null, querySelectorAll: () => [],
      closest: () => null, matches: () => false,
      getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }),
    };
    return node;
  };
  const doc = {
    body: el(), documentElement: el(), head: el(),
    getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [],
    createElement: () => el(), createTextNode: () => el(), createDocumentFragment: () => el(),
    addEventListener() {}, removeEventListener() {},
    cookie: '', title: '', readyState: 'complete',
  };
  const win = {
    document: doc, location: { search: '', hash: '', href: '', pathname: '' },
    history: { replaceState() {}, pushState() {} },
    addEventListener() {}, removeEventListener() {}, setTimeout: () => 0, clearTimeout() {},
    setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    MutationObserver: class { observe() {} disconnect() {} },
    scrollTo() {}, scrollY: 0, innerWidth: 1280, innerHeight: 800,
    navigator: { userAgent: 'node' }, getComputedStyle: () => ({ getPropertyValue: () => '' }),
    URL, URLSearchParams, fetch: () => Promise.reject(new Error('offline')),
  };
  win.window = win; win.self = win; win.top = win; win.globalThis = win;
  doc.defaultView = win;
  return win;
}

export function extractAll({ verbose = false } = {}) {
  const out = {};

  for (const [page, keys] of Object.entries(WANT)) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const m = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!m) { if (verbose) console.log(`!! ${page}: sin script inline`); continue; }
    const code = m[1];

    const win = sandboxFor();
    const sandbox = vm.createContext(win);

    // Catalogo generado (si la pagina ya fue construida): se carga primero.
    const legacyJs = /<script[^>]*\bsrc=["']([^"']*\/legacy\/[^"']+\.js)["']/i.exec(html);
    if (legacyJs) {
      const rel = legacyJs[1].replace(/^\.?\//, '');
      const p = path.join(ROOT, rel);
      if (fs.existsSync(p)) {
        try {
          vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { timeout: 20000, filename: rel });
        } catch (e) {
          if (verbose) console.log(`!! ${rel}: fallo al cargar -> ${e.message}`);
        }
      } else if (verbose) {
        console.log(`!! ${rel}: no existe (el build no se ha ejecutado?)`);
      }
    }

    const tail = `\n;globalThis.__OUT = { ${keys.map((k) => `${k}: typeof ${k} === 'undefined' ? null : ${k}`).join(', ')} };`;
    try {
      vm.runInContext(code + tail, sandbox, { timeout: 20000, filename: page });
    } catch (e) {
      if (verbose) console.log(`!! ${page}: la ejecucion fallo -> ${e.message}`);
      // aun asi intentamos leer lo que haya quedado definido
    }
    const got = win.__OUT;
    if (!got) { if (verbose) console.log(`!! ${page}: __OUT vacio`); continue; }
    out[page] = JSON.parse(JSON.stringify(got));
    if (verbose) {
      const desc = Object.entries(got)
        .map(([k, v]) => `${k}=${Array.isArray(v) ? '[' + v.length + ']' : v === null ? 'NULL' : typeof v === 'object' ? '{' + Object.keys(v).length + '}' : typeof v}`)
        .join('  ');
      console.log(`${page.padEnd(16)} ${desc}`);
    }
  }

  return out;
}

const esMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (esMain) {
  const out = extractAll({ verbose: true });
  const dest = path.join(ROOT, 'data', 'legacy-current.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 1), 'utf8');
  console.log(`\n-> data/legacy-current.json (${fs.statSync(dest).size} bytes)`);
}
