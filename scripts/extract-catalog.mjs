/* ============================================================================
   extract-catalog.mjs — Reconstruye el catálogo maestro desde programas.html

   El catálogo de 88 videos, los 33 originales y los 63 adquiridos viven en un
   <script> inline de programas.html. Este script lo evalúa en un sandbox y
   escribe data/catalog.json, de modo que build-lore.mjs tenga una entrada
   COMMITTED y no dependa de ficheros temporales.

   Ejecutar:  node scripts/extract-catalog.mjs
   Salida:    data/catalog.json
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(process.cwd());
const html = fs.readFileSync(path.join(ROOT, 'programas.html'), 'utf8');

/* --- localizar el <script> que declara las tablas --- */
const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((m) => m[1])
  .filter((src) => /\b(?:vidCatalog|allProgs|progVideoMap)\b/.test(src));

if (!blocks.length) {
  console.error('ERROR: no se encontro el script del catalogo en programas.html');
  process.exit(1);
}
const src = blocks.sort((a, b) => b.length - a.length)[0];

/* --- evaluarlo y capturar solo las tablas que nos interesan ---
   El script tambien arranca el DOM de la pagina; se le da un stub que
   responda a cualquier llamada y no ejecute nada. */
const noop = () => null;
const stubEl = {
  innerHTML: '', textContent: '', value: '', style: {},
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  dataset: {},
  appendChild: noop, setAttribute: noop, addEventListener: noop,
  querySelector: noop, querySelectorAll: () => [], getAttribute: noop,
};
const doc = {
  getElementById: () => stubEl,
  querySelector: () => stubEl,
  querySelectorAll: () => [],
  createElement: () => ({ ...stubEl }),
  addEventListener: noop,
  body: stubEl,
  readyState: 'complete',
};
const sandbox = {
  window: {},
  document: doc,
  localStorage: { getItem: () => null, setItem: noop },
  location: { search: '', hash: '' },
  setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop,
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  console,
};
sandbox.globalThis = sandbox;
const names = ['vidCatalog', 'allProgs', 'progVideoMap', 'progVidColors', 'orig', 'adq'];
const ctx = vm.createContext(sandbox);

try {
  vm.runInContext(src + '\n;__out={vidCatalog:typeof vidCatalog!=="undefined"?vidCatalog:[],allProgs:typeof allProgs!=="undefined"?allProgs:[],progVideoMap:typeof progVideoMap!=="undefined"?progVideoMap:{},progVidColors:typeof progVidColors!=="undefined"?progVidColors:{},orig:typeof orig!=="undefined"?orig:[],adq:typeof adq!=="undefined"?adq:[]};', ctx, { timeout: 10000 });
} catch (e) {
  console.error('ERROR al evaluar el script inline: ' + e.message);
  process.exit(1);
}

const out = sandbox.__out || {};
const pvm = Array.isArray(out.progVideoMap) ? out.progVideoMap[0] || {} : out.progVideoMap || {};

const data = {
  _nota: 'Generado por scripts/extract-catalog.mjs desde el <script> inline de programas.html. No editar a mano.',
  vidCatalog: out.vidCatalog || [],
  allProgs: out.allProgs || [],
  progVideoMap: pvm,
  orig: out.orig || [],
  adq: out.adq || [],
};

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'catalog.json'), JSON.stringify(data, null, 1), 'utf8');

console.log('data/catalog.json escrito');
console.log('  vidCatalog   :', data.vidCatalog.length);
console.log('  allProgs     :', data.allProgs.length);
console.log('  progVideoMap :', Object.keys(data.progVideoMap).length, 'claves');
console.log('  orig         :', data.orig.length);
console.log('  adq          :', data.adq.length);
if (!data.vidCatalog.length) {
  console.error('AVISO: vidCatalog vacio — el script inline cambio de forma.');
  process.exit(1);
}