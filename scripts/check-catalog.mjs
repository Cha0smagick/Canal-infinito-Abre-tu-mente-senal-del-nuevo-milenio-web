/* ============================================================================
   check-catalog.mjs  —  arbitro del build legacy
   ----------------------------------------------------------------------------
   Vuelve a ejecutar las 4 paginas legacy YA generadas, extrae sus catalogos y
   los compara contra data/legacy-reference.json (congelada antes de tocar nada).

   Si el build cambiara un solo valor, este script sale con codigo 1 y
   .github/workflows/verify.yml detiene el despliegue.

   Tres diferencias son INTENCIONALES y estan documentadas aqui; el check las
   aplica a la referencia antes de comparar y las reporta aparte, para que no
   pasen desapercibidas:

     1. tv.html progNames / progColors: 24 claves -> 22. Diez slugs venian
        corruptos por el bug de acentos y se corrigen; dos de ellos colisionan
        con una clave ya correcta.
     2. tv.html catalog[].prog: los slugs corruptos, ahora corregidos.
     3. video.html programInfo: el texto era MAS POBRE que el de videoteca.html.
        Se unifica en el texto rico. Es una correccion de drift, no un cambio
        de contenido.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { extractAll } from './extract-legacy.mjs';

const ROOT = process.cwd();
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const EX = J('data/legacy-extras.json');
const REF = J('data/legacy-reference.json');

const S = (v) => JSON.stringify(v);
const tipo = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
const MAX = 25;

/* ------------------------------------------------------------- cambios --- */

function tvNormalizar(origen) {
  const out = {};
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

const TV_CORRUP = Object.keys(EX.tvProgsLimpios).filter((k) => EX.tvProgsLimpios[k] !== k);
const TV_COLAPSAN = TV_CORRUP.filter((k) => Object.prototype.hasOwnProperty.call(EX.tvProgsLimpios, EX.tvProgsLimpios[k]) === false);

const esperado = JSON.parse(S(REF));
const deliberados = [];

{
  const t = esperado['tv.html'];
  const antesN = Object.keys(t.progNames).length;
  t.progNames = tvNormalizar(t.progNames);
  t.progColors = tvNormalizar(t.progColors);
  const progFix = new Set();
  for (const v of t.catalog) {
    const limpio = EX.tvProgsLimpios[v.prog] || v.prog;
    if (limpio !== v.prog) { progFix.add(v.prog + ' -> ' + limpio); v.prog = limpio; }
  }
  deliberados.push(`tv.html: ${TV_CORRUP.length} slugs de programa corregidos (${TV_CORRUP.join(', ')})`);
  deliberados.push(`tv.html: progNames ${antesN} -> ${Object.keys(t.progNames).length} claves (2 correcciones colisionaban con una clave ya correcta)`);
  deliberados.push(`tv.html: ${progFix.size} titulos con slug de programa corregido`);

  const vi = esperado['video.html'].programInfo;
  const vd = esperado['videoteca.html'].programInfo;
  const rico = Object.keys(vi).filter((k) => S(vi[k]) !== S(vd[k])).length;
  esperado['video.html'].programInfo = vd;
  deliberados.push(`video.html: programInfo unificado con el texto de videoteca.html (${rico} de ${Object.keys(vi).length} programas tenian texto mas corto)`);
}
void TV_COLAPSAN;

/* --------------------------------------------------------------- diff --- */

const difs = [];
function comparar(a, b, ruta) {
  if (difs.length >= MAX) return;
  const ta = tipo(a), tb = tipo(b);
  if (ta !== tb) { difs.push(`${ruta}: tipo ${ta} contra ${tb}`); return; }
  if (ta === 'array') {
    if (a.length !== b.length) { difs.push(`${ruta}: ${a.length} elementos contra ${b.length}`); return; }
    for (let i = 0; i < a.length; i++) comparar(a[i], b[i], `${ruta}[${i}]`);
    return;
  }
  if (ta === 'object') {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (S(ka) !== S(kb)) {
      const soloA = ka.filter((k) => !kb.includes(k)).slice(0, 6);
      const soloB = kb.filter((k) => !ka.includes(k)).slice(0, 6);
      difs.push(`${ruta}: claves ${ka.length} contra ${kb.length}${soloA.length ? ' | solo en referencia: ' + soloA.join(', ') : ''}${soloB.length ? ' | solo en generado: ' + soloB.join(', ') : ''}`);
      return;
    }
    for (const k of ka) comparar(a[k], b[k], `${ruta}.${k}`);
    return;
  }
  if (a !== b) difs.push(`${ruta}: ${S(a)} contra ${S(b)}`);
}

const actual = extractAll();

console.log('check-catalog — el build reproduce el catalogo original?');
console.log('\ncambios deliberados respecto al original:');
for (const d of deliberados) console.log('  · ' + d);

console.log('\ncomparacion:');
for (const page of Object.keys(esperado)) {
  if (!actual[page]) { difs.push(`${page}: no se pudo extraer`); continue; }
  const antes = difs.length;
  comparar(actual[page], esperado[page], page);
  const n = difs.length - antes;
  console.log(`  ${page.padEnd(16)} ${n === 0 ? 'identico' : n + ' diferencia(s)'}`);
}

console.log('');
if (difs.length) {
  console.log('=== DIFERENCIAS NO INTENCIONADAS ===');
  for (const d of difs) console.log('  ' + d);
  if (difs.length >= MAX) console.log(`  ... (se cortaron las diferencias en ${MAX})`);
  console.log('\nRESULTADO: FALLA');
  process.exit(1);
}
console.log('RESULTADO: OK — las 4 paginas legacy generan exactamente el catalogo original');
