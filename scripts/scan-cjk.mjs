/* Escanea CJK / fullwidth en archivos de texto y reporta línea + contexto. */
import fs from 'node:fs';

const files = process.argv.slice(2);
const RE = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const ALSO_BAD = /[Ѐ-ӿ֐-׿؀-ۿ฀-๿]/; // cirílico, hebreo, árabe, tailandés

let total = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const hits = [];
  lines.forEach((ln, i) => {
    if (RE.test(ln) || ALSO_BAD.test(ln)) {
      const chars = [...ln].filter((c) => RE.test(c) || ALSO_BAD.test(c));
      hits.push({ n: i + 1, chars: [...new Set(chars)].join(''), ctx: ln.trim().slice(0, 150) });
      total++;
    }
  });
  if (hits.length) {
    console.log(`\n=== ${f} :: ${hits.length} suspect line(s) ===`);
    for (const h of hits) console.log(`  L${h.n} [${h.chars}] ${h.ctx}`);
  }
}
console.log(`\nTOTAL suspect lines: ${total}`);