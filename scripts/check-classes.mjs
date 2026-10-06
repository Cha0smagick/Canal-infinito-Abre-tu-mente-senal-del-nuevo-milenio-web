/* Comprueba que cada clase usada en el HTML tenga definicion en theme.css
   O en el <style> inline de la propia pagina (las 5 paginas legacy llevan su
   propio CSS). Ignora los fragmentos que son concatenacion de JS, p.ej.
   class="p-card '+cls+'", porque no son nombres de clase literales. */
import fs from 'node:fs';

const css = fs.readFileSync('assets/css/theme.css', 'utf8');
const theme = new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));

const files = process.argv.slice(2);
let bad = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');

  // clases definidas por el <style> inline de esta pagina
  const own = new Set();
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const c of m[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) own.add(c[1]);
  }

  const used = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) {
      if (!c) continue;
      // "+cls+" / "'+(x||y).cls+'" -> concatenacion de JS, no un nombre literal
      if (/[+'"(){}]/.test(c)) continue;
      used.add(c);
    }
  }

  const missing = [...used].filter((c) => !theme.has(c) && !own.has(c));
  if (missing.length) {
    bad++;
    console.log(`\n=== ${f} :: used=${used.size} SIN DEFINIR=${missing.length}  (inline:${own.size})`);
    console.log('  ' + missing.join(' | '));
  } else {
    console.log(`ok  ${f.padEnd(22)} used=${String(used.size).padStart(3)}  todas definidas  (inline:${own.size})`);
  }
}

console.log(`\npaginas con clases sin definir: ${bad}`);