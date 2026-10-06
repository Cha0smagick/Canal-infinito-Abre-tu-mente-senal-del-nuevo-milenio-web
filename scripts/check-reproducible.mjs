#!/usr/bin/env node
/* check-reproducible.mjs -- el build debe ser idempotente.
 *
 * Ejecuta build-lore.mjs + build-legacy.mjs dos veces seguidas y compara,
 * byte a byte, todo lo que generan:
 *   assets/js/data-lore.js
 *   assets/js/legacy/{programas,videoteca,video,tv}.js
 *   {programas,videoteca,video,tv}.html
 *
 * Si algo cambia entre la primera y la segunda pasada, el build depende del
 * estado previo del arbol y no es reproducible: eso es exactamente lo que
 * rompe un pipeline de CI, donde el checkout siempre esta limpio.
 *
 * Uso:  node scripts/check-reproducible.mjs
 * Salida: codigo 0 si las dos pasadas coinciden, 1 si no.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ARTEFACTOS = [
  'assets/js/data-lore.js',
  'assets/js/legacy/programas.js',
  'assets/js/legacy/videoteca.js',
  'assets/js/legacy/video.js',
  'assets/js/legacy/tv.js',
  'programas.html',
  'videoteca.html',
  'video.html',
  'tv.html',
];

const PASADAS = ['build-lore.mjs', 'build-legacy.mjs'];

function construir(pasada) {
  for (const s of PASADAS) {
    execFileSync(process.execPath, [path.join('scripts', s)], {
      cwd: RAIZ,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  const h = {};
  for (const rel of ARTEFACTOS) {
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) {
      h[rel] = 'AUSENTE';
      continue;
    }
    const buf = fs.readFileSync(abs);
    h[rel] = `${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16)} ${String(buf.length).padStart(7)} B`;
  }
  console.log(`  pasada ${pasada}`);
  for (const rel of ARTEFACTOS) console.log(`    ${h[rel]}  ${rel}`);
  return h;
}

console.log('=== check-reproducible: dos builds seguidos deben coincidir ===\n');
const a = construir(1);
console.log('');
const b = construir(2);

console.log('');
const distintos = ARTEFACTOS.filter((rel) => a[rel] !== b[rel]);
if (distintos.length === 0) {
  console.log(`RESULTADO: OK — las 2 pasadas son identicas en los ${ARTEFACTOS.length} artefactos`);
  process.exit(0);
}
console.log(`PROBLEMAS: ${distintos.length} artefacto(s) cambian entre pasadas:`);
for (const rel of distintos) {
  console.log(`  ${rel}\n    pasada 1: ${a[rel]}\n    pasada 2: ${b[rel]}`);
}
console.log('\nEl build no es idempotente. Suele ser una de estas causas:');
console.log('  - una fecha/hora generada dentro del artefacto;');
console.log('  - orden de iteracion dependiente del sistema;');
console.log('  - una constante que se lee del propio archivo que se esta escribiendo.');
process.exit(1);
