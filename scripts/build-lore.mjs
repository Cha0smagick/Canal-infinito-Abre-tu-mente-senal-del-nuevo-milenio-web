/* ============================================================================
   build-lore.mjs — Genera assets/js/data-lore.js (FUENTE ÚNICA DE VERDAD)
   Fusiona: programacion.json + data/catalog.json + [snapshots YT opcionales]
   Ejecutar:  node scripts/extract-catalog.mjs   (primero, desde programas.html)
              node scripts/build-lore.mjs
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const RAW = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const HAS = (p) => fs.existsSync(path.join(ROOT, p));

const prog = J('programacion.json');
/* Catálogo maestro: lo produce extract-catalog.mjs desde el <script> inline
   de programas.html. Es un fichero COMMITTED, así que el build es reproducible. */
if (!HAS('data/catalog.json')) {
  console.error('ERROR: falta data/catalog.json — ejecuta antes:  node scripts/extract-catalog.mjs');
  process.exit(1);
}
const ext = J('data/catalog.json');

/* Descripciones largas de los 88 videos y de los 21 programas con pieza de video.
   Vivian duplicadas dentro de los <script> inline de las paginas legacy.
   Se congelaron en data/legacy-extras.json (scripts/extract-legacy-extras.mjs)
   para que data-lore.js sea la UNICA fuente y las legacy se generen desde aqui. */
const ex = HAS('data/legacy-extras.json') ? J('data/legacy-extras.json') : null;
if (!ex) console.warn('AVISO: falta data/legacy-extras.json -> videos y programas quedaran sin descripcion.');

/* ---------------------------------------------------------------- 1. VIDEOS
   Re-deriva los 28 videos de youtube-data.txt con duración + flag "miembros".
   Regla: heading level=3 -> /url: /watch?v=ID (ventana +4)
          duración = escaneo hacia atrás hasta 9 líneas buscando "M:SS" o "H:MM:SS"
          miembros = "Primero para miembros" dentro de +20 líneas siguientes
--------------------------------------------------------------------------- */
function parseYouTubeSnapshot(file) {
  const lines = RAW(file).split(/\r?\n/);
  const out = new Map();
  const TITLE = /'heading "(.+)" \[level=3\]/;
  const URL = /\/url:\s*(?:https?:\/\/(?:www\.)?youtube\.com)?\/watch\?v=([A-Za-z0-9_-]{11})/;
  const DUR = /(?:^|\D)((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\D|$)/;

  /* Cada tarjeta del snapshot tiene esta forma exacta (10 líneas):
       - link [ref=X]:
       - /url: /watch?v=ID
       - generic [ref=Y]: DURACIÓN
       ...
       - heading "TÍTULO" [level=3]
       ...
       - generic [ref=I]: Primero para miembros
     => Se itera por las líneas /url (no por los headings) y se toma el título
        del primer heading level=3 dentro de +7 líneas. */
  lines.forEach((line, i) => {
    const u = URL.exec(line);
    if (!u) return;
    const id = u[1];

    let title = '';
    for (let j = i; j <= Math.min(i + 7, lines.length - 1); j++) {
      const h = TITLE.exec(lines[j]);
      if (h) { title = h[1]; break; }
    }

    /* duración: la línea siguiente al /url es "generic [ref=..]: M:SS"
       (el /url aparece 2x por tarjeta: miniatura y título) */
    let dur = '';
    for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
      const cand = lines[j].replace(/^[\s-]*/, '');
      if (/watch\?v=/.test(cand)) break;
      const d = DUR.exec(cand);
      if (d) { dur = d[1]; break; }
    }

    const member = /Primero para miembros|Members only/i.test(lines.slice(i, i + 16).join(' '));

    const prev = out.get(id);
    out.set(id, {
      id,
      title: title || (prev && prev.title) || '',
      dur: dur || (prev && prev.dur) || '',
      member: member || Boolean(prev && prev.member),
    });
  });
  return out;
}

/* Las duraciones y la marca "solo para miembros" NO salen de programas.html:
   se verificaron sobre los snapshots de accesibilidad del canal de archivo y
   quedaron congeladas en data/duraciones.json (ver extract-duraciones.mjs).
   Los snapshots .txt ya no se versionan; si alguien los recupera, se usan. */
const snapYT = HAS('youtube-data.txt') ? parseYouTubeSnapshot('youtube-data.txt') : new Map();
const snapOld = HAS('youtube-snapshot.txt') ? parseYouTubeSnapshot('youtube-snapshot.txt') : new Map();

if (snapYT.size) console.log('snapshots .txt encontrados: se usan en lugar de data/duraciones.json');

/* Formato unificado id -> { dur, miembro } */
const meta = new Map();
if (HAS('data/duraciones.json')) {
  const dj = J('data/duraciones.json');
  for (const [id, v] of Object.entries(dj.datos || {})) meta.set(id, { dur: v.d || '', miembro: Boolean(v.m), titulo: v.t || '' });
}
for (const src of [snapYT, snapOld]) {
  for (const [id, v] of src) {
    if (v.dur || v.member) {
      const prev = meta.get(id) || { titulo: '' };
      meta.set(id, { dur: v.dur || '', miembro: Boolean(v.member), titulo: v.title || prev.titulo || '' });
    }
  }
}
if (!meta.size) console.warn('AVISO: sin data/duraciones.json ni snapshots -> duracion y "solo miembros" quedaran vacias.');

/* --------------------------------------------- 2. IDs extra en los HTML
   Escanea todas las páginas para detectar IDs de YouTube presentes en el sitio
   pero ausentes de vidCatalog -> "hallazgos" (no se inventan títulos).
--------------------------------------------------------------------------- */
const YT_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/g;
/* Los IDs también viven como literales sueltos dentro de los <script> de cada
   página:  "dxR2_l0Hda8": { ... }   ·   id:"dxR2_l0Hda8"
   Un ID real siempre mezcla letras y dígitos y no es una palabra de CSS/HTML. */
const BARE_ID_RE = /["']?([A-Za-z0-9_-]{11})["']?\s*:\s*(?:\{|["']https?:)/g;
const notAnId = (s) => !/[0-9]/.test(s);
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
/* progVideoMap puede venir como objeto plano o envuelto en un array de 1 */
const pvm = Array.isArray(ext.progVideoMap) ? ext.progVideoMap[0] || {} : ext.progVideoMap || {};
const known = new Set(ext.vidCatalog.map((v) => v.id));
Object.keys(pvm).forEach((k) =>
  (Array.isArray(pvm[k]) ? pvm[k] : [pvm[k]]).forEach((v) => v && known.add(v))
);
(ext.orig || []).forEach((p) => p.vid && known.add(p.vid));
(ext.adq || []).forEach((p) => p.vid && known.add(p.vid));
const snapIds = [...meta.keys()];
snapIds.forEach((id) => known.add(id));

/* Citas deliberadas de videos que NO pertenecen al catálogo del canal de
   archivo. Son fuentes primarias del cierre, citadas en enciclopedia.html
   #fuentes y enlazadas desde enlaces.html. No son huérfanos: se declaran
   aquí para que el control de hallazgos siga siendo útil. */
const CITAS_EXTERNAS = {
  oOV8etvSL7s: 'Relanzamiento Infinito a TNT Series — 10/03/2015 (cierre de la señal argentina)',
  BCAUGuO1fwI: 'Transición Infinito a TNT Series, feed panregional — 17/03/2015',
};
Object.keys(CITAS_EXTERNAS).forEach((id) => known.add(id));

const orphans = new Map(); // id -> Set(pages)
for (const f of pages) {
  const html = RAW(f);
  const found = new Set();
  for (const m of html.matchAll(YT_ID_RE)) found.add(m[1]);
  for (const m of html.matchAll(BARE_ID_RE)) if (!notAnId(m[1])) found.add(m[1]);
  for (const id of found) {
    if (known.has(id)) continue;
    if (!orphans.has(id)) orphans.set(id, new Set());
    orphans.get(id).add(f);
  }
}

/* ------------------------------------- 3. Merge del catálogo de videos (88)
   Enriquece cada entrada con duración real + flag de membresía + vistas.
--------------------------------------------------------------------------- */
const slugOf = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const videos = ext.vidCatalog.map((v) => {
  const s = meta.get(v.id) || {};
  return {
    id: v.id,
    titulo: v.title,
    tituloFull: s.titulo || v.title,
    programa: v.programa,
    progId: v.progId,
    pub: v.pub,
    desc: (ex && ex.videoDesc[v.id]) || '',
    tags: v.tags || [],
    dur: s.dur || '',
    miembros: Boolean(s.miembro),
    youtube: `https://www.youtube.com/watch?v=${v.id}`,
    embed: `https://www.youtube-nocookie.com/embed/${v.id}`,
  };
});

/* Videos con metadatos verificados que no tienen ficha de programa en el
   catalogo. Antes daba 0; se mantiene el control por si el catalogo crece. */
const catalogIds = new Set(videos.map((v) => v.id));
const sinFicha = [...meta.entries()]
  .filter(([id]) => !catalogIds.has(id))
  .map(([id, m]) => ({
    id,
    titulo: '',
    dur: m.dur,
    miembros: m.miembro,
    youtube: `https://www.youtube.com/watch?v=${id}`,
    embed: `https://www.youtube-nocookie.com/embed/${id}`,
  }));

/* --------------------------------------------- 4. Programas (originales/adq) */
const progNames = new Set((ext.orig || []).map((p) => p.n));
const originales = (ext.orig || []).map((p) => ({
  nombre: p.n,
  genero: p.g,
  era: p.e || '',
  descripcion: p.d || '',
  estado: p.st || 'nd',
  video: p.vid || null,
  detalle: p.det || '',
}));

const adquiridos = (ext.adq || []).map((p) => ({
  nombre: p.n,
  genero: p.g,
  descripcion: p.d || '',
  estado: p.st || 'nd',
  video: p.vid || null,
  detalle: p.det || '',
}));

/* Los que sólo viven en programacion.json (fuente canónica de texto) */
const pj = prog.programas || {};
const yaEnAdq = new Set(adquiridos.map((a) => a.nombre));
for (const a of pj.adquiridos || []) {
  if (!yaEnAdq.has(a.nombre)) {
    adquiridos.push({
      nombre: a.nombre,
      genero: a.genero || '',
      descripcion: a.descripcion || '',
      estado: 'nd',
      video: null,
      detalle: '',
    });
    yaEnAdq.add(a.nombre);
  }
}
const yaEnOrig = new Set(originales.map((a) => a.nombre));
for (const o of pj.originales || []) {
  if (!yaEnOrig.has(o.nombre)) {
    originales.push({
      nombre: o.nombre,
      genero: o.genero || '',
      era: o.era || '',
      descripcion: o.descripcion || '',
      estado: 'nd',
      video: null,
      detalle: '',
    });
    yaEnOrig.add(o.nombre);
  }
}

/* Los 21 programas con material en video (los que la videoteca, el reproductor
   de un video y la "senal" de tv.html tienen ficha). Orden: el de la videoteca.
   Descripcion: la version mas rica de las dos legacy (verificar que la otra
   difiere -> drift corregido al elegir esta como canonica). */
const videosPorProg = new Map();
for (const v of videos) videosPorProg.set(v.progId, (videosPorProg.get(v.progId) || 0) + 1);
const programas = (ex ? ex.programOrder : []).map((slug) => ({
  slug,
  nombre: ex.programNames[slug] || slug,
  descripcion: ex.programDesc[slug] || '',
  videos: videosPorProg.get(slug) || 0,
}));

/* ------------------------------------- 5. Filas del canal (de programacion.json) */
const canal = prog.canal || {};
const esloganes = (canal.esloganes || []).map((s) =>
  typeof s === 'string' ? { anios: '', texto: s } : s
);

const bloques = (prog.bloques_programacion || []).map((b) => ({
  nombre: b.nombre,
  descripcion: b.descripcion,
  slug: slugOf(b.nombre),
}));

const devociones = Array.isArray(prog.devociones) ? prog.devociones.slice() : [];

/* ---------------------------------------------------------- 6. Ensamblado */
const DATA = {
  meta: {
    generado: new Date().toISOString().slice(0, 10),
    canalYoutube: '@lostmediacanalinfinito',
    canalYoutubeUrl: 'https://www.youtube.com/@lostmediacanalinfinito',
    canalYoutubeVideos: 'https://www.youtube.com/@lostmediacanalinfinito/videos',
    blog: 'http://elrinconparanormal.blogspot.com/',
    pais: 'Argentina',
    esloganOficial: 'Abre tu mente',
    esloganHistorico: 'Señal del nuevo milenio',
  },
  canal: {
    nombre: canal.nombre || 'Canal Infinito',
    tipo: canal.tipo || 'Canal de televisión por suscripción',
    pais: canal.pais || 'Argentina',
    fundacion: canal.fundacion || '',
    cierre: canal.cierre || '',
    fundador: canal.fundador || '',
    propiedades: canal.propietarios || [],
    reemplazado_por: canal.reemplazado_por || '',
    programacion_movida_a: canal.programacion_movida_a || '',
    locutores: canal.locutores || [],
  },
  esloganes,
  bloques,
  originales,
  adquiridos,
  programas,
  devociones,
  videos,
  sinFicha,
  hallazgos: [...orphans.entries()].map(([id, set]) => ({ id, en: [...set] })),
};

fs.mkdirSync(path.join(ROOT, 'assets', 'js'), { recursive: true });
const out = `/* GENERADO AUTOMÁTICAMENTE por scripts/build-lore.mjs — NO EDITAR A MANO
 * Fuente única de verdad de la Enciclopedia Canal Infinito.
 * ${DATA.meta.generado}
 */
window.CANAL_INFINITO = ${JSON.stringify(DATA, null, 2)};
`;
fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'data-lore.js'), out, 'utf8');

/* ------------------------------------------------------------- 7. Reporte */
console.log('escritura: assets/js/data-lore.js', (out.length / 1024).toFixed(1) + ' KB');
console.log('eslóganes       :', esloganes.length);
console.log('bloques         :', bloques.length);
console.log('originales      :', originales.length, '(prog.json extra:', originales.length - ext.orig.length + ')');
console.log('adquiridos      :', adquiridos.length, '(prog.json extra:', adquiridos.length - ext.adq.length + ')');
console.log('devociones      :', devociones.length);
console.log('programas piec. :', programas.length, '| videos con desc:', videos.filter((v) => v.desc).length);
console.log('videos          :', videos.length);
console.log('  con duración  :', videos.filter((v) => v.dur).length);
console.log('  solo miembros :', videos.filter((v) => v.miembros).length);
console.log('sin ficha (snap):', sinFicha.length);
console.log('hallazgos HTML  :', DATA.hallazgos.length, '(IDs en páginas sin catalogar)');
if (DATA.hallazgos.length) console.log('  ', DATA.hallazgos.slice(0, 20).map((h) => h.id).join(' '));