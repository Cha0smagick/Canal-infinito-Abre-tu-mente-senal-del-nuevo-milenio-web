import fs from 'node:fs';
const D = JSON.parse(
  fs.readFileSync('assets/js/data-lore.js', 'utf8').replace(/^[\s\S]*?window\.CANAL_INFINITO\s*=\s*/, '').replace(/;\s*$/, '')
);
const show = (k) => {
  const v = D[k];
  console.log(`--- ${k}: ${Array.isArray(v) ? v.length : typeof v}`);
  if (Array.isArray(v) && v.length) console.log(JSON.stringify(v.slice(0, 3), null, 1));
};
['propiedades', 'esloganes', 'bloques', 'devociones', 'locutores'].forEach(show);
console.log('--- meta:', JSON.stringify(D.meta));
console.log('--- canal keys:', Object.keys(D.canal));
console.log('--- propiedades keys:', D.propiedades && D.propiedades[0] && Object.keys(D.propiedades[0]));
console.log('--- devociones sample:', JSON.stringify((D.devociones || []).slice(0, 5)));
console.log('--- bloques sample:', JSON.stringify((D.bloques || []).slice(0, 2)));
