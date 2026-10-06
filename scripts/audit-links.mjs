/* Verifica que cada URL de wikimedia.org / los dominios clave usada por
   render-logos.js y render-enlaces.js siga respondiendo. */
import fs from 'node:fs';

const html = fs.readFileSync('assets/js/render-logos.js', 'utf8') + fs.readFileSync('assets/js/render-enlaces.js', 'utf8');
const urls = [...new Set([...html.matchAll(/'((?:https?:)?\/\/[^']+?)'/g)].map((m) => m[1]))].filter((u) =>
  /wikimedia|wikipedia|web\.archive|archive\.org|produ\.com|clarin|totalmedios|tvlatina|youtube|tntseries|trutv|warnerbrosdiscovery|imagensat|blogspot|fandom/.test(u)
).map((u) => (u.startsWith('http') ? u : 'https:' + u));

console.log('checking ' + urls.length + ' urls\n');
let bad = 0;
for (const u of urls) {
  let code = 'ERR';
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12000);
    const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: ac.signal, headers: { 'user-agent': 'Mozilla/5.0 canal-infinito-audit' } });
    clearTimeout(t);
    code = r.status;
  } catch (e) {
    code = '000';
  }
  if (code !== 200 && code !== 403) { bad++; console.log(`  ${code}  ${u}`); }
}
console.log(`\nproblems (not 200/403): ${bad}`);