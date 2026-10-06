/* ============================================================================
   build-legacy.mjs  —  genera las 4 páginas legacy desde datos, no a mano
   ----------------------------------------------------------------------------
   Que resuelve
   Las páginas programas / videoteca / video / tv tenían el catálogo de 88 videos
   y los listados de programas COPIADOS dentro de su <script> inline: 4 copias
   del mismo dato que podían desincronizarse sin que nadie se enterara.
   Este script las convierte en artefactos de build:

     1. Reconstruye cada variable de la región de catálogo desde
        assets/js/data-lore.js (fuente canónica) + data/legacy-extras.json
        (descripciones y colores congelados).
     2. Escribe assets/js/legacy/<page>.js  con  window.CI_LEGACY.<page> = {...}
     3. Sustituye en el HTML la región de constantes por una línea de
        destructuring que lee ese fichero.

   La lógica de cada página (los renderizadores, los modales, el reproductor)
   NO se toca: sus <script> inline siguen intactos.

   El arbitro es scripts/check-catalog.mjs: vuelve a ejecutar cada página ya
   generada y compara contra data/legacy-reference.json (congelada). Si el build
   cambiara un solo valor, el check falla y la web no se publica.

   Idempotente: si la página ya tiene window.CI_LEGACY, solo regenera los JS.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { topLevelDeclarations, codeOnly } from './scan-decls.mjs';

const ROOT = process.cwd();
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

/* ---------------------------------------------------------------- datos --- */

const win = { window: {} };
win.window.window = win.window;
vm.createContext(win);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/data-lore.js'), 'utf8'), win);
const D = win.window.CANAL_INFINITO;
const EX = J('data/legacy-extras.json');

/* Programas que la enciclopedia documenta pero que programas.html nunca
   mostro en su rejilla. No es un olvido del build: es como quedo la pagina.
   Si uno se los agrega, el sitio lo avisa el informe del check. */
const NO_ESTA_EN_PROGRAMAS_HTML = {
  originales: ['Extreme Makeover: Home Edition Latin America'],
  adquiridos: ['Survivor: Thailand / Palau / All-Stars / Marquesas / África'],
};

/* La legacy guarda las claves abreviadas y omite las que estan vacias.
   El orden importa para que el archivo generado sea estable (check-reproducible). */
const CLAVES = {
  originales: [
    ['n', 'nombre'], ['g', 'genero'], ['e', 'era'], ['d', 'descripcion'],
    ['vid', 'video'], ['st', 'estado'], ['det', 'detalle'],
  ],
  adquiridos: [
    ['n', 'nombre'], ['g', 'genero'], ['d', 'descripcion'],
    ['vid', 'video'], ['st', 'estado'], ['det', 'detalle'],
  ],
};

function legacyPrograma(src, tipo) {
  const out = {};
  for (const [corta, larga] of CLAVES[tipo]) {
    const v = src[larga];
    if (v !== undefined && v !== null && v !== '') out[corta] = v;
  }
  return out;
}

function programasLegacy(tipo) {
  const excluir = new Set(NO_ESTA_EN_PROGRAMAS_HTML[tipo]);
  return D[tipo].filter((p) => !excluir.has(p.nombre)).map((p) => legacyPrograma(p, tipo));
}

/* El catalogo de las 3 paginas de video, con la descripcion larga anadida. */
function catalogoVideo() {
  return D.videos.map((v) => ({
    id: v.id,
    title: v.titulo,
    programa: v.programa,
    progId: v.progId,
    pub: v.pub,
    desc: EX.videoDesc[v.id] || '',
    tags: v.tags,
  }));
}

function programInfo() {
  const out = {};
  for (const slug of Object.keys(EX.progColorsMap)) {
    out[slug] = { name: EX.programNames[slug] || slug, desc: EX.programDesc[slug] || '' };
  }
  return out;
}

/* tv.html traia 24 claves de programa, 10 de ellas rotas por el bug de
   acentos ("expedici-n", "aqui-se-respira-el-miedo"...). Se corrigen con
   tvProgsLimpios. Dos de las 10 colisionan con una clave ya limpia, asi que
   el mapa pasa de 24 a 22 entradas. Verificado: las 22 se siguen usando. */
function tvMapa(origen) {
  const out = {};
  // Primero las claves que ya eran correctas, para que no las pise una correccion.
  for (const [k, v] of Object.entries(origen)) {
    const limpio = EX.tvProgsLimpios[k] || k;
    if (limpio === k) out[limpio] = v;
  }
  for (const [k, v] of Object.entries(origen)) {
    const limpio = EX.tvProgsLimpios[k] || k;
    if (limpio !== k && out[limpio] === undefined) out[limpio] = v;
  }
  return out;
}

/* --------------------------------------------------------- por pagina --- */

const PAGINAS = {
  'programas.html': {
    key: 'programas',
    region: ['orig', 'adq', 'allProgs', 'vidCatalog', 'progVideoMap', 'progVidColors'],
    build() {
      return {
        orig: programasLegacy('originales'),
        adq: programasLegacy('adquiridos'),
        vidCatalog: D.videos.map((v) => ({
          id: v.id, title: v.titulo, programa: v.programa,
          progId: v.progId, pub: v.pub, tags: v.tags,
        })),
        progVideoMap: EX.progVideoMap,
        progVidColors: EX.progVidColors,
      };
    },
    /* allProgs se deja como expresion: duplicaria orig+adq enteros en el
       archivo generado y no aporta nada (es orig.concat(adq) con una etiqueta). */
    sustituto:
      'const { orig, adq, vidCatalog, progVideoMap, progVidColors } = window.CI_LEGACY.programas;\n' +
      "const allProgs = [...orig.map((p) => ({ ...p, tp: 'original' })), ...adq.map((p) => ({ ...p, tp: 'acquired' }))];",
  },
  'videoteca.html': {
    key: 'videoteca',
    region: ['catalog', 'programInfo', 'programColors'],
    build() {
      return { catalog: catalogoVideo(), programInfo: programInfo(), programColors: EX.programColors };
    },
    sustituto: 'const { catalog, programInfo, programColors } = window.CI_LEGACY.videoteca;',
  },
  'video.html': {
    key: 'video',
    region: ['catalog', 'programInfo', 'programColors'],
    build() {
      return { catalog: catalogoVideo(), programInfo: programInfo(), programColors: EX.progVidColors };
    },
    sustituto: 'const { catalog, programInfo, programColors } = window.CI_LEGACY.video;',
  },
  'tv.html': {
    key: 'tv',
    region: ['progNames', 'progColors', 'catalog'],
    build() {
      return {
        progNames: tvMapa(EX.tvProgs),
        progColors: tvMapa(EX.tvColors),
        catalog: D.videos.map((v) => ({
          id: v.id,
          t: EX.tvTitles[v.id] || v.titulo,
          prog: EX.tvProgsLimpios[v.progId] || v.progId,
        })),
      };
    },
    sustituto: 'const { progNames, progColors, catalog } = window.CI_LEGACY.tv;',
  },
};

/* ------------------------------------------------------------- HTML --- */

const RE_SCRIPT = /<script\b(?![^>]*\bsrc=)[^>]*>/i;

function locateInlineScript(html) {
  const m = RE_SCRIPT.exec(html);
  if (!m) return null;
  const contentStart = m.index + m[0].length;
  const end = html.indexOf('</script>', contentStart);
  if (end < 0) return null;
  return { tagStart: m.index, contentStart, contentEnd: end, code: html.slice(contentStart, end) };
}

function regionEn(code, nombres) {
  const decls = topLevelDeclarations(code);
  const map = new Map(decls.map((d) => [d.name, d]));
  const faltan = nombres.filter((n) => !map.has(n));
  if (faltan.length) throw new Error(`faltan declaraciones: ${faltan.join(', ')}`);
const dentro = nombres.map((n) => map.get(n));
  // scan-decls entrega declFrom como el final de la declaracion anterior, no como
  // el inicio de esta. El inicio real se localiza en el codigo con comentarios y
  // cadenas enmascarados (misma longitud, mismos offsets), buscando hacia atras la
  // palabra clave seguida del "=" que abre el valor.
  const mask = codeOnly(code);
  const inicioDe = (name, initFrom) => {
    for (const kw of ['const ', 'let ', 'var ']) {
      const i = mask.lastIndexOf(kw + name, initFrom);
      if (i < 0) continue;
      const j = i + kw.length + name.length;
      if (/^\s*=[^=]/.test(mask.slice(j, j + 60))) return i;
    }
    throw new Error('no se encontro donde se declara ' + name);
  };
  const from = Math.min(...dentro.map((d) => inicioDe(d.name, d.initFrom)));
  const to = Math.max(...dentro.map((d) => d.initTo));
  return { from, to, quitados: dentro.reduce((a, d) => a + d.initLen, 0) };
}

function escribirJs(key, payload) {
  const dir = path.join(ROOT, 'assets', 'js', 'legacy');
  fs.mkdirSync(dir, { recursive: true });
  const cabecera = [
    '/* GENERADO POR scripts/build-legacy.mjs — NO EDITAR A MANO.',
    ' * Fuente: assets/js/data-lore.js + data/legacy-extras.json',
    ' * Cambia los datos o el build, nunca este archivo.',
    ' * Lo verifica scripts/check-catalog.mjs contra data/legacy-reference.json.',
    ' */',
    '',
  ].join('\n');
  const cuerpo =
    'window.CI_LEGACY = window.CI_LEGACY || {};\n' +
    `window.CI_LEGACY.${key} = ${JSON.stringify(payload)};\n`;
  fs.writeFileSync(path.join(dir, `${key}.js`), cabecera + cuerpo, 'utf8');
  return (cabecera + cuerpo).length;
}

/* --------------------------------------------------------------- run --- */

const informe = [];
let cambiosHtml = 0;

for (const [pagina, spec] of Object.entries(PAGINAS)) {
  const pHtml = path.join(ROOT, pagina);
  const antes = fs.statSync(pHtml).size;
  let html = fs.readFileSync(pHtml, 'utf8');

  const payload = spec.build();
  const bytesJs = escribirJs(spec.key, payload);

  const yaGenerada = /window\.CI_LEGACY\./.test(html);
  if (yaGenerada) {
    informe.push(`${pagina.padEnd(16)} solo JS  ${pagina} sin cambios (ya generada)`);
    continue;
  }

  const loc = locateInlineScript(html);
  if (!loc) throw new Error(`${pagina}: no se encontro el <script> inline`);
  const { from, to, quitados } = regionEn(loc.code, spec.region);

  // Primero se sustituye el contenido (offsets anteriores a contentStart intactos),
  // despues se inserta la etiqueta (tagStart es anterior a contentStart).
  const nuevo = loc.code.slice(0, from) + spec.sustituto + loc.code.slice(to);
  html = html.slice(0, loc.contentStart) + nuevo + html.slice(loc.contentEnd);
  const tag = `<script src="assets/js/legacy/${spec.key}.js"></script>\n`;
  html = html.slice(0, loc.tagStart) + tag + html.slice(loc.tagStart);

  fs.writeFileSync(pHtml, html, 'utf8');
  cambiosHtml++;
  const despues = fs.statSync(pHtml).size;
  informe.push(
    `${pagina.padEnd(16)} inline ${String(loc.code.length).padStart(6)} -> ${String(nuevo.length).padStart(5)} chars  ` +
    `(-${quitados} de catalogo)  html ${antes} -> ${despues} bytes  js ${bytesJs} bytes`,
  );
}

console.log('build-legacy');
for (const l of informe) console.log('  ' + l);
console.log(`  paginas reescritas: ${cambiosHtml}/${Object.keys(PAGINAS).length}`);
