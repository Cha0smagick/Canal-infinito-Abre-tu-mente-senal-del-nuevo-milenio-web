import fs from 'node:fs';

/* Parche quirúrgico y aditivo para las 5 páginas heredadas.
   No se toca su <style> ni sus <script> inline (contienen los reproductores
   funcionales). Sólo se unifica: data-page, nav completa, favicon, description
   y pie con el mapa de navegación completo. */

const PAGES = [
  {
    file: 'canal.html',
    page: 'canal',
    title: 'Canal Infinito — El Canal',
    desc: 'Historia, propiedad, locutores y eslóganes del canal argentino Canal Infinito (1994-2015): de Imagen Satelital a Turner Broadcasting.',
  },
  {
    file: 'programas.html',
    page: 'programas',
    title: 'Canal Infinito — Programas',
    desc: 'Catálogo completo de Canal Infinito: programas originales y adquiridos, bloques de programación y detalle de cada emisión.',
  },
  {
    file: 'videoteca.html',
    page: 'videoteca',
    title: 'Canal Infinito — Videoteca',
    desc: 'Videoteca de Canal Infinito: piezas recuperadas del canal de archivo Lost Media, con buscador, filtro por programa y reproductor.',
  },
  {
    file: 'video.html',
    page: 'videoteca',
    title: 'Canal Infinito — Reproductor',
    desc: 'Reproductor de la videoteca de Canal Infinito con piezas recuperadas del archivo comunitario del canal.',
  },
  {
    file: 'tv.html',
    page: 'tv',
    title: 'Canal Infinito — Señor de TV',
    desc: 'Emisión encadenada del archivo recuperado de Canal Infinito, al estilo del bloque nocturno del canal.',
  },
];

/* Enlaces que faltaban en la nav heredada */
const EXTRA = [
  ['enciclopedia.html', 'Enciclopedia'],
  ['logos.html', 'Logos'],
  ['enlaces.html', 'Enlaces'],
];

const FOOTER_NAV = [
  ['index.html', 'Inicio'],
  ['enciclopedia.html', 'Enciclopedia completa'],
  ['canal.html', 'El canal'],
  ['programas.html', 'Programas'],
  ['videoteca.html', 'Videoteca'],
  ['logos.html', 'Logos y archivo gráfico'],
  ['enlaces.html', 'Enlaces relacionados'],
  ['tv.html', 'Señor de TV'],
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const report = [];

for (const P of PAGES) {
  let t = fs.readFileSync(P.file, 'utf8');
  const notes = [];

  /* 1. data-page en <body> ---------------------------------------------- */
  const bodyRe = /<body(\s[^>]*)?>/;
  if (!bodyRe.test(t)) throw new Error(`${P.file}: no encontré <body>`);
  t = t.replace(bodyRe, (m, attrs) => {
    let a = attrs || '';
    a = a.replace(/\s*data-page="[^"]*"/g, '');
    return `<body${a} data-page="${P.page}">`;
  });

  /* 2. title correcto (los heredados no tenían description) ------------- */
  t = t.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(P.title)}</title>`);

  if (!/<meta\s+name="description"/i.test(t)) {
    t = t.replace(
      /<title>[\s\S]*?<\/title>/i,
      (m) => `${m}\n<meta name="description" content="${esc(P.desc)}">\n<meta name="theme-color" content="#0a0a0f">`
    );
    notes.push('description+theme-color');
  }
  if (!/rel="icon"/i.test(t)) {
    t = t.replace(
      /(<meta name="viewport"[^>]*>)/i,
      `$1\n<link rel="icon" href="favicon.svg" type="image/svg+xml">`
    );
    notes.push('favicon');
  }

  /* 3. nav: inyectar los enlaces que faltaban -------------------------- */
  const ul = t.match(/<ul class="nav-links">/);
  if (!ul) throw new Error(`${P.file}: no encontré <ul class="nav-links">`);

  const has = (href) => t.includes(`"${href}"`);
  const missing = EXTRA.filter(([href]) => !has(href));

  if (missing.length) {
    const items = missing.map(([href, label]) => `\n    <li><a href="${href}">${label}</a></li>`).join('');
    /* justo después del <li> de Inicio para que quede en segundo lugar */
    t = t.replace(/(<ul class="nav-links">\s*\n\s*<li><a href="index\.html">[^<]*<\/a><\/li>)/, `$1${items}`);
    notes.push(`nav+${missing.length}`);
  }

  /* 4. pie con mapa de navegación completo ----------------------------- */
  const links = FOOTER_NAV.map(([href, label]) => `  <li><a href="${href}">${label}</a></li>`).join('\n');
  const footer = `<footer>
  <div class="footer-map">
    <div>
      <p style="font-family:'Playfair Display',serif;font-size:1.1rem;color:#7a6c5a">Canal Infinito</p>
      <p class="footer-tagline">"Realidad que supera la ficción"</p>
      <p style="margin:6px 0 16px">1994 — 2015</p>
      <p style="font-size:0.75rem;color:#3a2c1a">Sitio tributo sin fines de lucro</p>
    </div>
    <nav aria-label="Mapa del sitio">
      <ul class="footer-links">
${links}
      </ul>
    </nav>
  </div>
</footer>`;
  const fRe = /<footer>[\s\S]*?<\/footer>/;
  if (fRe.test(t)) {
    t = t.replace(fRe, footer);
    notes.push('footer');
  } else {
    notes.push('footer:NO-ENCONTRADO');
  }

  fs.writeFileSync(P.file, t);
  report.push({ file: P.file, page: P.page, notes: notes.join(',') || 'sin cambios' });
}

console.table(report);
