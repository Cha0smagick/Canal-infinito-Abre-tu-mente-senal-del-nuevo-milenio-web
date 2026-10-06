/* ============================================================================
   extract-duraciones.mjs — Congela los metadatos de YouTube verificados

   Lee assets/js/data-lore.js (ya generado) y guarda en data/duraciones.json
   los datos que NO se derivan de programas.html sino de los snapshots de
   accesibilidad del canal de archivo: duracion real y marca "solo para
   miembros". Sin esto, regenerar el sitio perderia 29 duraciones y 12 marcas.

   Se ejecuta UNA vez. Despues, data/duraciones.json es la fuente y
   build-lore.mjs lo consume.

   Ejecutar:  node scripts/extract-duraciones.mjs
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(process.cwd());
const FILE = path.join(ROOT, 'assets/js/data-lore.js');
if (!fs.existsSync(FILE)) {
  console.error('ERROR: falta assets/js/data-lore.js');
  process.exit(1);
}

const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(FILE, 'utf8'), ctx, { timeout: 10000 });
const D = ctx.window.CANAL_INFINITO || {};

const out = {};
let conDur = 0;
let conMiemb = 0;
let conTitulo = 0;
for (const v of D.videos || []) {
  // El tituloFull del snapshot de YouTube suele ser mas largo y descriptivo
  // que el titulo del catalogo ("... (VHS RIP) #lostmedia"). Se conserva.
  const t = v.tituloFull && v.tituloFull !== v.titulo ? v.tituloFull : '';
  if (!v.dur && !v.miembros && !t) continue;
  out[v.id] = { d: v.dur || '', m: Boolean(v.miembros), t };
  if (v.dur) conDur++;
  if (v.miembros) conMiemb++;
  if (t) conTitulo++;
}

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'data', 'duraciones.json'),
  JSON.stringify(
    {
      _nota:
        'Metadatos de YouTube verificados sobre los snapshots de accesibilidad del canal ' +
        '@lostmediacanalinfinito. d = duracion M:SS · m = solo para miembros · ' +
        't = titulo completo del canal de archivo (suele traer "VHS RIP" / "#lostmedia"). No editar a mano.',
      _fuente: 'youtube-data.txt + youtube-snapshot.txt (snapshots Playwright, ya no versionados)',
      _generado: new Date().toISOString().slice(0, 10),
      datos: out,
    },
    null,
    1
  ),
  'utf8'
);

console.log('data/duraciones.json escrito');
console.log('  entradas      :', Object.keys(out).length, 'de', (D.videos || []).length);
console.log('  con duracion  :', conDur);
console.log('  solo miembros :', conMiemb);
console.log('  titulo largo  :', conTitulo);