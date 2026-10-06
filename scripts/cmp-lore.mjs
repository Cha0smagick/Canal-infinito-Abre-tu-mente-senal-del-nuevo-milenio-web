/* Comparacion estricta de dos data-lore.js.
   Comprueba TAMBIEN las claves que desaparecen, no solo las que quedan.
   Uso:  node scripts/cmp-lore.mjs <antes.js> <despues.js>
   Las claves NUEVAS (presentes solo en uno de los dos) se agrupan y se listan
   aparte: son cambios deliberados de esquema, no corrupcion. */
import fs from 'node:fs';
import vm from 'node:vm';

const g = (f) => {
  const c = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(f, 'utf8'), c, { timeout: 15000 });
  return c.window.CANAL_INFINITO;
};
const A = g(process.argv[2]);
const B = g(process.argv[3]);
if (!A || !B) {
  console.error('ERROR: alguno de los dos ficheros no defines window.CANAL_INFINITO');
  process.exit(1);
}

let diffs = 0;
const S = (v) => String(JSON.stringify(v));
const note = (msg) => { diffs++; console.log('  DIFF ' + msg); };
const nuevas = new Map(); // clave -> 'solo en nuevo' | 'solo en antiguo' | ambos
const marca = (k, lado) => nuevas.set(k + ' (' + lado + ')', true);

const revisar = (a, b, prefijo) => {
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (S(a[k]) === S(b[k])) continue;
    if (a[k] === undefined) { marca(prefijo + k, 'solo en el nuevo'); continue; }
    if (b[k] === undefined) { marca(prefijo + k, 'solo en el antiguo'); continue; }
    note(prefijo + k + ': ' + S(a[k]).slice(0, 120) + ' -> ' + S(b[k]).slice(0, 120));
  }
};

// campos de primer nivel (videos y hallazgos se tratan aparte)
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
  if (k === 'videos' || k === 'hallazgos') continue;
  if (S(A[k]) === S(B[k])) continue;
  if (A[k] === undefined) { marca(k, 'solo en el nuevo'); continue; }
  if (B[k] === undefined) { marca(k, 'solo en el antiguo'); continue; }
  if (A[k] && B[k] && typeof A[k] === 'object' && typeof B[k] === 'object') {
    revisar(A[k], B[k], k + '.');   // drilled: mete por clave, no por indice
  } else {
    note(k + ': ' + S(A[k]).slice(0, 120) + ' -> ' + S(B[k]).slice(0, 120));
  }
}

// videos: por id, bidireccional
const ma = new Map((A.videos || []).map((v) => [v.id, v]));
const mb = new Map((B.videos || []).map((v) => [v.id, v]));
for (const id of new Set([...ma.keys(), ...mb.keys()])) {
  const a = ma.get(id);
  const b = mb.get(id);
  if (!a) { note(id + ' SOLO en el nuevo'); continue; }
  if (!b) { note(id + ' SOLO en el antiguo'); continue; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (S(a[k]) === S(b[k])) continue;
    if (a[k] === undefined) { marca('videos[].' + k, 'solo en el nuevo'); continue; }
    if (b[k] === undefined) { marca('videos[].' + k, 'solo en el antiguo'); continue; }
    note(id + '.' + k + ': ' + S(a[k]).slice(0, 140) + ' -> ' + S(b[k]).slice(0, 140));
  }
}

console.log('claves nuevas/eliminadas (cambio deliberado de esquema):');
if (!nuevas.size) console.log('  (ninguna)');
for (const k of [...nuevas.keys()].sort()) console.log('  + ' + k);
console.log('\nvideos: A=' + (A.videos || []).length + ' B=' + (B.videos || []).length);
console.log('hallazgos: A=' + S(A.hallazgos) + ' B=' + S(B.hallazgos));
console.log(diffs === 0
  ? 'RESULTADO: IDENTICOS (salvo hallazgos y claves nuevas)'
  : 'RESULTADO: ' + diffs + ' diferencia(s) real(es) fuera de hallazgos');
process.exit(diffs === 0 ? 0 : 1);
