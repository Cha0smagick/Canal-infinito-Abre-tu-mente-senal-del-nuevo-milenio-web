// Deriva data/legacy-extras.json a partir de data/legacy-reference.json.
//
// QUE HACE Y POR QUE
// --------------------
// Las 4 paginas legacy (programas/videoteca/video/tv)majan DATO que no se puede
// derivar de programacion.json ni de data/catalog.json:
//   - las DESCRIPCIONES largas de cada uno de los 88 videos,
//   - las DESCRIPCIONES de los 21 programas,
//   - la paleta de color por programa,
//   - el vocabulario de 24 slugs que usa tv.html para nombrar sus 24 bloques.
// Ese dato NO es sludge: es contenido editorial. vive aca, una sola vez, y
// build-lore.mjs lo incorpora a data-lore.js (la fuente canonica) para que el
// build legacy ya no tenga que volver a leerlo de las paginas.
//
// CUANDO SE EJECUTA
//   Solo cuando cambia el contenido editorial. Es una operacion de una vez, no
//   parte del build diario: el build usa el JSON ya congelado.
//
//   node scripts/extract-legacy-extras.mjs
//
// REGLA DE ORO: este script NUNCA inventa texto. Todo lo que escribe sale de
// data/legacy-current.json (que a su vez se extrae ejecutando el <script> real
// de las paginas). Si falta algo, avisa y sale con codigo != 0.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
// Lee la REFERENCIA CONGELADA, no legacy-current.json: este ultimo se regenera
// al extraer de las paginas y quedaria vacio si se correran ya construidas.
const LEGACY = path.join(ROOT, 'data', 'legacy-reference.json');
const OUT = path.join(ROOT, 'data', 'legacy-extras.json');

// Los 21 progId canonicos (los mismos que usa data-lore.js para `progId`).
// Leemos el shape real de data-lore.js para no hardcodear la lista a mano.
function canonicalSlugs() {
  const file = path.join(ROOT, 'assets', 'js', 'data-lore.js');
  const code = fs.readFileSync(file, 'utf8');
  const win = { window: {} };
  win.window.window = win.window;
  vm.createContext(win);
  vm.runInContext(code + '\n;globalThis.__D = window.CANAL_INFINITO;', win, { timeout: 20000 });
  const D = win.__D;
  if (!D || !Array.isArray(D.videos)) throw new Error('data-lore.js no expone window.CANAL_INFINITO.videos');
  const slugs = new Set();
  for (const v of D.videos) if (v && typeof v.progId === 'string') slugs.add(v.progId);
  return { slugs, D };
}

// tv.html usa 24 claves propias. Diez estan rotas por el bug de acentos
// (mojibake: "aqui" -> "aqu", "produccion" -> "producci-n"). Son claves
// internas: solo se usan para indexar progNames y para agrupar. Corregirlas
// es seguro y deja de propagar el bug. La tabla es explicita a proposito:
// quiero que se vea que es una decision, no un regex magico.
const TV_SLUG_FIX = {
  'off-the-beaten-path-fuera-de-ruta': 'fuera-de-ruta',
  'fear-is-breathed-here-aqu-se-respira-el-miedo': 'aqui-se-respira-el-miedo',
  'aqu-se-respira-el-miedo': 'aqui-se-respira-el-miedo',
  'masones-misterio-y-poder': 'masones',
  'latinoam-rica-historias-perdidas': 'latinoamerica-historias-perdidas',
  'producci-n-original-infinito': 'produccion-original',
  'expedici-n': 'expedicion',
  'el-d-a-menos-pensado': 'el-dia-menos-pensado',
  'revista-a-o-cero': 'revista-ano-cero',
  'traves-a-infinito': 'travesia-infinito',
  // No estaba roto: es el mismo programa con el titulo en ingles. El archivo lo
  // agrupaba aparte del slug canonico, asi que aparecia como un grupo mas.
  'fear-is-breathed-here': 'aqui-se-respira-el-miedo',
};

const problems = [];
function need(cond, msg) { if (!cond) problems.push(msg); return cond; }

const raw = JSON.parse(fs.readFileSync(LEGACY, 'utf8'));
const { slugs, D } = canonicalSlugs();

// ---------------------------------------------------------------- videoDesc
// videoteca.catalog y video.catalog traen las MISMAS 88 descripciones
// (verificado: JSON.stringify equal). Usamos videoteca.
const vidCat = raw['videoteca.html']?.catalog;
need(Array.isArray(vidCat) && vidCat.length === 88, `videoteca.catalog deberia tener 88 items, hay ${Array.isArray(vidCat) ? vidCat.length : 'nada'}`);
const videoDesc = {};
const videoTitulo = {};
let sinDesc = 0;
for (const v of vidCat || []) {
  const id = v && v.id;
  if (typeof id !== 'string' || id.length !== 11) { problems.push(`video con id invalido: ${JSON.stringify(v && v.id)}`); continue; }
  if (typeof v.desc === 'string' && v.desc.trim()) videoDesc[id] = v.desc.trim();
  else sinDesc++;
  if (typeof v.title === 'string' && v.title.trim()) videoTitulo[id] = v.title.trim();
}
need(sinDesc === 0, `${sinDesc} videos sin desc en videoteca.catalog`);
need(Object.keys(videoDesc).length === 88, `videoDesc quedo con ${Object.keys(videoDesc).length} entradas, se esperaban 88`);

// ------------------------------------------------------------- programDesc
// videoteca.programInfo es MAS RICO que video.programInfo (mismo slugs, texto
// mas largo). El de videoteca es el canonico. Los slugs se mapean por nombre
// visible -> progId para no depender del orden de las dos paginas.
const nameToSlug = new Map();
for (const v of D.videos) if (v && v.programa && v.progId) nameToSlug.set(v.programa, v.progId);

const programDesc = {};
const programNames = {};
let progSinDesc = 0;
for (const [slug, info] of Object.entries(raw['videoteca.html']?.programInfo || {})) {
  const desc = info && typeof info.desc === 'string' ? info.desc.trim() : '';
  const nombre = info && typeof info.n === 'string' ? info.n : (info && typeof info.name === 'string' ? info.name : '');
  if (desc) programDesc[slug] = desc; else progSinDesc++;
  if (nombre) programNames[slug] = nombre;
}
need(progSinDesc === 0, `${progSinDesc} programas sin desc en videoteca.programInfo`);
need(Object.keys(programDesc).length === 21, `programDesc quedo con ${Object.keys(programDesc).length}, se esperaban 21`);

// Cada slug de programDesc debe existir como progId canonico, o ser uno de los
// 3 bloques extra que solo viven en las legacy (Travesia Infinito, Revista
// An o Cero, El Dia Menos Pensado ya estan; falta verificar los 3 sobrantes).
const unknownSlugs = Object.keys(programDesc).filter((s) => !slugs.has(s));
if (unknownSlugs.length) {
  // No es error: algunas paginas agrupan programas bajo slugs propios. Se
  // avisa para que quede documentado y se decide si se mapean.
  problems.push(`programDesc tiene ${unknownSlugs.length} slug(s) que no son progId canonicos: ${unknownSlugs.join(', ')}`);
}

// ------------------------------------------------------- colores y orden
// videoteca: programColors es un ARRAY de 24 hex; progColorsMap es el mapa real.
const programColors = Array.isArray(raw['videoteca.html']?.programColors)
  ? raw['videoteca.html'].programColors.slice()
  : [];
need(programColors.length === 24, `videoteca.programColors deberia tener 24, tiene ${programColors.length}`);

const progColorsMap = (raw['videoteca.html']?.progColorsMap && typeof raw['videoteca.html'].progColorsMap === 'object')
  ? { ...raw['videoteca.html'].progColorsMap }
  : {};
need(Object.keys(progColorsMap).length === 21, `videoteca.progColorsMap deberia tener 21, tiene ${Object.keys(progColorsMap).length}`);

// Orden de presentacion que usa videoteca para los filtros (progIds).
const programOrder = Array.isArray(raw['videoteca.html']?.progIds)
  ? raw['videoteca.html'].progIds.slice()
  : [];
need(programOrder.length === 21, `videoteca.progIds deberia tener 21, tiene ${programOrder.length}`);

// ------------------------------------------------------------------- tv
const tvNames = (raw['tv.html']?.progNames && typeof raw['tv.html'].progNames === 'object')
  ? { ...raw['tv.html'].progNames }
  : {};
need(Object.keys(tvNames).length === 24, `tv.progNames deberia tener 24 claves, tiene ${Object.keys(tvNames).length}`);

const tvColors = (raw['tv.html']?.progColors && typeof raw['tv.html'].progColors === 'object')
  ? { ...raw['tv.html'].progColors }
  : {};
need(Object.keys(tvColors).length === 24, `tv.progColors deberia tener 24 claves, tiene ${Object.keys(tvColors).length}`);

// Detectar que slugs usa de verdad tv.catalog y aplicar las correcciones.
const tvUsed = new Set((raw['tv.html']?.catalog || []).map((v) => v && v.prog).filter(Boolean));
need(tvUsed.size === 24, `tv.catalog usa ${tvUsed.size} slugs distintos, se esperaban 24`);

// Todo slug usado debe tener nombre Y color. Ademas, cada slug usado debe
// existir en TV_SLUG_FIX si esta roto, o en los nombres "limpios" si ya lo esta.
const sinNombre = [...tvUsed].filter((s) => !(s in tvNames));
need(sinNombre.length === 0, `tv usa ${sinNombre.length} slug(s) sin nombre: ${sinNombre.join(', ')}`);

const tvProgsLimpios = {};
for (const used of [...tvUsed].sort()) {
  const fix = TV_SLUG_FIX[used];
  tvProgsLimpios[used] = fix || used;
}
const faltantesFix = Object.keys(TV_SLUG_FIX).filter((s) => !tvUsed.has(s));
need(faltantesFix.length === 0, `TV_SLUG_FIX declara slugs que tv.catalog no usa: ${faltantesFix.join(', ')}`);

// Los destinos de la correccion deben existir tambien como nombre limpio,
// salvo cuando corrige a un slug canonico que ya existe.
const destinosOk = Object.values(tvProgsLimpios).filter((d) => tvNames[d] || slugs.has(d));
need(destinosOk.length === 24, `tras corregir, ${24 - destinosOk.length} destino(s) no tienen nombre`);

// video.html tiene su propia paleta (objeto de 21). Se conserva tal cual:
// son decisiones de diseno distintas (mas frias) y no hay motivo para unificarlas.
const videoColors = (raw['video.html']?.programColors && typeof raw['video.html'].programColors === 'object')
  ? { ...raw['video.html'].programColors }
  : {};
need(Object.keys(videoColors).length === 21, `video.programColors deberia tener 21 claves, tiene ${Object.keys(videoColors).length}`);

// programas.html declara su paleta como progVidColors (objeto de 21). Es la
// MISMA que videoColors, pero se extrae de programas.html y no se reusa el otro:
// si divergieran, el build tiene que honorar la que cada pagina espera.
const progVidColors = (raw['programas.html']?.progVidColors && typeof raw['programas.html'].progVidColors === 'object')
  ? { ...raw['programas.html'].progVidColors }
  : {};
need(Object.keys(progVidColors).length === 21, `programas.progVidColors deberia tener 21 claves, tiene ${Object.keys(progVidColors).length}`);

// ---------------------------------------------------------------- tvTitles
// tv.html NO usa el titulo largo del catalogo: usa un titulo LIMPIO y corto
// (verificado: solo 53 de 88 coinciden con data-lore.videos[].titulo, ninguno
// con tituloFull, y los otros 35 no existen en ninguna otra fuente). Son
// decisiones editoriales propias de la pagina, no duplicacion. Se congelan
// aqui, indexadas por id de video, para que el build pueda reconstruirlas.
const tvTitles = {};
let tvSinTitulo = 0;
for (const v of raw['tv.html']?.catalog || []) {
  const id = v && v.id;
  if (typeof id !== 'string' || id.length !== 11) { problems.push(`tv: video con id invalido: ${JSON.stringify(v && v.id)}`); continue; }
  if (typeof v.t === 'string' && v.t.trim()) tvTitles[id] = v.t.trim();
  else tvSinTitulo++;
}
need(tvSinTitulo === 0, `${tvSinTitulo} videos sin titulo corto en tv.catalog`);
need(Object.keys(tvTitles).length === 88, `tvTitles quedo con ${Object.keys(tvTitles).length} entradas, se esperaban 88`);

// Los ids de tv.catalog estan en el MISMO orden que catalog.json.vidCatalog.
// Eso no es una casualidad: ambos se derivan de la misma lista. Sialguna vez
// dejara de ser cierto, el build cruzaria titulos con el id equivocado.
const tvIds = (raw['tv.html']?.catalog || []).map((v) => v && v.id);
const loreIds = D.videos.map((v) => v && v.id);
const mismoOrden = tvIds.length === loreIds.length && tvIds.every((id, i) => id === loreIds[i]);
need(mismoOrden, `los ids de tv.catalog ya no estan en el mismo orden que data-lore.videos (${tvIds.length} vs ${loreIds.length}); revisar antes de generar`);

// programa.html: orig[33] + adq[63] -> allProgs[96]. Los nombres de programa y
// su genero/era ya estan en data-lore (originales 34 + adquiridos 64 = 98 con
// las 2 diferencias de programacion.json). Lo que NO esta es el mapeo
// nombre visible -> slug, que en esa pagina es progVideoMap.
const progVideoMap = (raw['programas.html']?.progVideoMap && typeof raw['programas.html'].progVideoMap === 'object')
  ? { ...raw['programas.html'].progVideoMap }
  : {};
need(Object.keys(progVideoMap).length === 21, `programas.progVideoMap deberia tener 21 claves, tiene ${Object.keys(progVideoMap).length}`);

// ------------------------------------------------------------------- salida
if (problems.length) {
  console.log('PROBLEMAS:');
  for (const p of problems) console.log(' - ' + p);
  process.exitCode = 1;
}

const extras = {
  _nota: 'Datos editoriales que las paginas legacy tenian y que no se derivan de programacion.json ni de data/catalog.json. Generado por scripts/extract-legacy-extras.mjs desde data/legacy-reference.json. Editar el JSON de datos, no este script.',
  videoDesc,
  programDesc,
  programNames,
  programOrder,
  programColors,
progColorsMap,
  videoColors,
  progVidColors,
  tvProgs: tvNames,
  tvColors,
  tvProgsLimpios,
  tvTitles,
  progVideoMap,
};

fs.writeFileSync(OUT, JSON.stringify(extras, null, 1), 'utf8');
const bytes = fs.statSync(OUT).size;
console.log(`-> data/legacy-extras.json (${bytes} bytes)`);
console.log(`   videoDesc ${Object.keys(videoDesc).length} · programDesc ${Object.keys(programDesc).length} · programOrder ${programOrder.length}`);
console.log(`   programColors ${programColors.length} hex · progColorsMap ${Object.keys(progColorsMap).length} · videoColors ${Object.keys(videoColors).length} · progVidColors ${Object.keys(progVidColors).length}`);
console.log(`   tvProgs ${Object.keys(tvNames).length} · tvColors ${Object.keys(tvColors).length} · slugs corregidos ${Object.keys(tvProgsLimpios).filter((k) => tvProgsLimpios[k] !== k).length}/${Object.keys(tvProgsLimpios).length}`);
console.log(`   tvTitles ${Object.keys(tvTitles).length} (ids en el mismo orden que data-lore: ${mismoOrden})`);
console.log(`   titulos largos extraidos ${Object.keys(videoTitulo).length}`);
if (problems.length) process.exitCode = 1;
