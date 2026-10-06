/* De-slop: quita adornos de la maquetacion de las paginas nuevas.
   1. el masthead sin canvas de particulas, sin halo y sin rejilla de fondo
   2. fuera los filetes decorativos <span class="bar"> (el kicker ya rotula)
   3. fuera la barra de progreso flotante
*/
import fs from 'node:fs';

const PAGES = ['index.html', 'enciclopedia.html', 'logos.html', 'enlaces.html', '404.html'];

const CUTS = [
  [/<canvas[^>]*id="particle-canvas"[^>]*><\/canvas>\s*/g, ''],
  [/<div class="hero__glow"[^>]*><\/div>\s*/g, ''],
  [/<div class="bggrid"[^>]*><\/div>\s*/g, ''],
  [/\s*<span class="bar"[^>]*><\/span>/g, ''],
  [/<div class="progress"[^>]*><\/div>\s*/g, ''],
];

for (const p of PAGES) {
  const before = fs.readFileSync(p, 'utf8');
  let t = before;
  for (const [re, to] of CUTS) t = t.replace(re, to);
  if (t !== before) {
    fs.writeFileSync(p, t, 'utf8');
    console.log(
      p + ': ' + before.length + ' -> ' + t.length + ' bytes (-' + (before.length - t.length) + ')'
    );
  } else {
    console.log(p + ': sin cambios');
  }
}
