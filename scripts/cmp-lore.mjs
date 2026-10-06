/* Comparacion estricta de dos data-lore.js.
   Comprueba TAMBIEN las claves que desaparecen, no solo las que quedan. */
import fs from 'node:fs';
import vm from 'node:vm';

const g = (f) => {
  const c = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(f, 'utf8'), c, { timeout: 15000 });
  return c.window.CANAL_INFINITO;
};
const A = g(process.argv[2]);
const B = g(process.argv[3]);

let diffs = 0;
const S = (v) => JSON.stringify(v);
const note = (msg) => { diffs++; console.log('  DIFF ' + msg); };

// campos de primer nivel
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
  if (S(A[k]) === S(B[k])) continue;
  if (k === 'videos' || k === 'hallazgos') continue;
  note(k + ': ' + S(A[k]).slice(0, 120) + ' -> ' + S(B[k]).slice(0, 120));
}

// videos: por id, bidireccional
const ma = new Map(A.videos.map((v) => [v.id, v]));
const mb = new Map(B.videos.map((v) => [v.id, v]));
for (const id of new Set([...ma.keys(), ...mb.keys()])) {
  const a = ma.get(id);
  const b = mb.get(id);
  if (!a) { note(id + ' SOLO en nuevo'); continue; }
  if (!b) { note(id + ' SOLO en antiguo'); continue; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (S(a[k]) !== S(b[k])) note(id + '.' + k + ': ' + S(a[k]) + ' -> ' + S(b[k]));
  }
}

console.log('\nvideos: A=' + A.videos.length + ' B=' + B.videos.length);
console.log('hallazgos: A=' + S(A.hallazgos) + ' B=' + S(B.hallazgos));
console.log(diffs === 0 ? 'RESULTADO: IDENTICOS (salvo hallazgos)' : 'RESULTADO: ' + diffs + ' diferencia(s) fuera de hallazgos');