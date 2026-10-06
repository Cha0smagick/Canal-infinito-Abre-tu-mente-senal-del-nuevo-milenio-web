/* ============================================================================
   Canal Infinito — Renderizador de la página de logos
   Dependencia: assets/js/data-lore.js  (window.CANAL_INFINITO)

   Se carga ANTES de app.js: app.js captura [data-search] una sola vez al
   arrancar, así que todo lo que se pinte después quedaría fuera del buscador.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.CANAL_INFINITO || {};
  var CANAL = D.canal || {};
  var META = D.meta || {};

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var norm = function (s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  /* ------------------------------------------------------------ LOCKUPS
     El eslogan SIEMPRE aparece en serif itálica, con barra dorada debajo.
     Nunca en caja alta recta: ese gesto es la constante del canal.        */
  function renderLockups() {
    var items = D.esloganes || [];
    $$('[data-render="esloganes"]').forEach(function (host) {
      if (!items.length) { host.innerHTML = '<p class="empty">Sin eslóganes registrados.</p>'; return; }
      host.innerHTML = items
        .map(function (s) {
          var txt = s.eslogan || s.texto || s.nombre || '';
          var per = s.periodo || s.anios || '';
          var oficial = per === '2004-2008';
          return (
            '<article class="lockup" data-search="' + esc(norm(per + ' ' + txt + ' lockup eslogan variante marca')) + '">' +
            (oficial ? '<span class="lockup__of">eslogan oficial</span>' : '') +
            '<span class="lockup__y">' + esc(per) + '</span>' +
            '<span class="lockup__txt">' + esc(txt) + '</span>' +
            '<span class="lockup__bar" aria-hidden="true"></span>' +
            '</article>'
          );
        })
        .join('');
    });
  }

  /* ------------------------------------------------- MARCA POR ETAPA
     Cada dueño coincidió con una fase de la identidad verbal: el color de la
     marca cambió con el eslogan, no con la casa matriz.                   */
  var ETAPAS = {
    'Imagen Satelital': {
      eslogan: '24 horas de documentales',
      nota: 'Etapa fundacional. Sin locución estable ni identidad gráfica cerrada: el canal todavía se parecía a un agregador de documentales.',
      lockup: 'Sin lockup propio documentado',
    },
    'Claxson Interactive Group (Cisneros)': {
      eslogan: 'Existe otra realidad y sólo un canal te la muestra',
      nota: 'Etapa de construcción de marca. Aparece el sistema de rótulos que el canal conserva hasta el cierre y la locución de Diego Guerrero.',
      lockup: 'Barra dorada + serif itálica',
    },
    'Time Warner / Turner Broadcasting System': {
      eslogan: 'Realidad que supera la ficción',
      nota: 'Etapa de catálogo. La marca se conserva pero la estrategia pasa a ser de línea de cable satelital; el canal ya no crece, y su identidad verbal se vuelve la del archivo.',
      lockup: 'Serif itálica, tratamiento más sobrio',
    },
  };

  function renderEtapas() {
    var items = CANAL.propiedades || [];
    $$('[data-render="propiedades"]').forEach(function (host) {
      if (!items.length) { host.innerHTML = '<p class="empty">Sin etapas registradas.</p>'; return; }
      host.innerHTML = items
        .map(function (p) {
          var nombre = p.nombre || '';
          var per = p.periodo || '';
          var e = ETAPAS[nombre] || { eslogan: '—', nota: '', lockup: '' };
          return (
            '<article class="card" data-search="' + esc(norm(per + ' ' + nombre + ' etapa marca propiedad eslogan')) + '">' +
            '<p class="kicker" style="margin:0">' + esc(per) + '</p>' +
            '<h4 class="card__t">' + esc(nombre) + '</h4>' +
            '<p class="quote" style="margin:.4rem 0 .6rem">«' + esc(e.eslogan) + '»</p>' +
            '<div class="chips" style="margin-bottom:.6rem"><span class="chip chip--muted">' + esc(e.lockup) + '</span></div>' +
            '<p>' + esc(e.nota) + '</p>' +
            '</article>'
          );
        })
        .join('');
    });
  }

  /* ==================================================================== *
   *  LOGOTIPOS VERIFICADOS
   *
   *  Sólo se incluye material con licencia que autoriza la reproducción y
   *  cuya ficha en Wikimedia Commons se comprobó HTTP 200 durante la
   *  verificación. Los archivos se sirven desde upload.wikimedia.org: este
   *  sitio no los copia, los enlaza, y junto a cada uno se reproduce la
   *  ficha de crédito completa.
   *
   *  Hallazgo central de la búsqueda: existe UN solo logotipo genuino de
   *  Canal Infinito documentado con licencia libre — Infinito logo.png — y
   *  está catalogado en 2011, es decir de la última etapa (Turner). No hay
   *  en Commons ni ningún logotipo de 1994 ni de la etapa Claxson, y la
   *  categoría "Canal Infinito" de Commons está vacía. Eso es un dato
   *  sobre el archivo, no una falta de este sitio: el resto de este capítulo
   *  reconstruye el sistema, no el original.
   * ==================================================================== */
  var W = 'https://upload.wikimedia.org/wikipedia/commons/';
  var C = 'https://commons.wikimedia.org/wiki/File:';

  var LOGOS = [
    {
      key: 'principal',
      nombre: 'Infinito',
      img: W + 'b/b1/Infinito_logo.png',
      commons: C + 'Infinito_logo.png',
      ficha: 'File:Infinito logo.png',
      dim: '800 × 170 px · PNG',
      anio: '2011',
      etapa: 'Turner',
      lic: 'Dominio público',
      aut: 'Turner Broadcasting System Inc.',
      nota: 'Único logotipo genuino de Canal Infinito con licencia libre documentada. Corresponde a la última etapa, la de Turner, y es el que usa Wikipedia en el infobox del artículo en inglés. Su fuente original citada es la web oficial del canal.',
      oficial: true,
    },
    {
      key: 'fundador',
      nombre: 'Imagen Satelital',
      img: W + 'e/e3/I_sat.jpg',
      commons: C + 'I_sat.jpg',
      ficha: 'File:I sat.jpg',
      dim: '840 × 336 px · JPG',
      anio: '2012',
      etapa: 'Fundador',
      lic: 'Dominio público',
      aut: 'Imagen Satelital S.A., a Time Warner Company',
      nota: 'La casa que fundó y explotó el canal entre 1994 y 1997. Se incluye porque sin ella no se entiende de dónde salió la estación: el canal fue el último trofeo de una señal satelital, no una idea de canal de documentales.',
    },
    {
      key: 'isat',
      nombre: 'I.Sat',
      img: W + '2/20/I.Sat_logo.svg',
      thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/I.Sat_logo.svg/960px-I.Sat_logo.svg.png',
      commons: C + 'I.Sat_logo.svg',
      ficha: 'File:I.Sat logo.svg',
      dim: '100 × 36 px · SVG',
      anio: '2010',
      etapa: 'Fundador',
      lic: 'Dominio público',
      aut: 'I.Sat',
      nota: 'La marca hermana que Imagen Satelital operaba en paralelo. Comparte tipografía y gesto de barra con la marca del canal.',
    },
    {
      key: 'turner',
      nombre: 'Turner (1965–2015)',
      img: W + 'a/a7/Turner_logo.svg',
      thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Turner_logo.svg/960px-Turner_logo.svg.png',
      commons: C + 'Turner_logo.svg',
      ficha: 'File:Turner logo.svg',
      dim: '1001 × 198 px · SVG',
      anio: '—',
      etapa: 'Turner 2007–2015',
      lic: 'Dominio público',
      aut: 'Turner Broadcasting System',
      nota: 'El logotipo que el canal lució durante los últimos ocho años de su vida, superpuesto a la palabra Infinito.',
    },
    {
      key: 'tbs2015',
      nombre: 'Turner Broadcasting System 2015',
      img: W + '3/3a/Turner_Broadcasting_System_2015.svg',
      thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Turner_Broadcasting_System_2015.svg/960px-Turner_Broadcasting_System_2015.svg.png',
      commons: C + 'Turner_Broadcasting_System_2015.svg',
      ficha: 'File:Turner Broadcasting System 2015.svg',
      dim: '1000 × 176 px · SVG',
      anio: '2015',
      etapa: 'Cierre',
      lic: 'Dominio público',
      aut: 'Caspar Nonner — Troika Studio',
      nota: 'La versión de Turner estrenada el mismo año del cierre del canal. Es, literalmente, el último logotipo de la casa a la que Infinito pertenecía.',
    },
    {
      key: 'turner2015png',
      nombre: 'Turner 2015 (variante PNG)',
      img: W + '3/3a/Turner-2015.png',
      commons: C + 'Turner-2015.png',
      ficha: 'File:Turner-2015.png',
      dim: '320 × 320 px · PNG',
      anio: '2015',
      etapa: 'Cierre',
      lic: 'CC BY-SA 4.0',
      aut: 'Henryagudelocastellanos',
      nota: 'Variante cuadrada del logotipo de Turner de 2015, con la misma licencia libre pero copyleft. Se incluye con su atribución obligatoria.',
    },
    {
      key: 'tntseries',
      nombre: 'TNT Series (logo cuadrado)',
      img: W + '8/86/TNT_Series.png',
      commons: C + 'TNT_Series.png',
      ficha: 'File:TNT Series.png',
      dim: '2000 × 2370 px · PNG',
      anio: '2016',
      etapa: 'Sucesor',
      lic: 'Dominio público',
      aut: 'Joeran',
      nota: 'La estación que reemplazó a Infinito en frecuencia el 10 y 17 de marzo de 2015. Es el final documentado de la historia de marca del canal.',
    },
    {
      key: 'tntserie',
      nombre: 'TNT Serie (2009)',
      img: W + '3/36/TNT_Serie.svg',
      thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/TNT_Serie.svg/960px-TNT_Serie.svg.png',
      commons: C + 'TNT_Serie.svg',
      ficha: 'File:TNT Serie.svg',
      dim: '163 × 193 px · SVG',
      anio: '2009',
      etapa: 'Sucesor',
      lic: 'Dominio público',
      aut: 'Turner Network Television',
      nota: 'Variante original de TNT Serie, anterior al relanzamiento. Coincide con la época en que la programación de Infinito migró a TruTV.',
    },
    {
      key: 'tntseriehd',
      nombre: 'TNT Serie HD',
      img: W + 'c/cf/TNT_Serie_HD.svg',
      thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/TNT_Serie_HD.svg/960px-TNT_Serie_HD.svg.png',
      commons: C + 'TNT_Serie_HD.svg',
      ficha: 'File:TNT Serie HD.svg',
      dim: '318 × 193 px · SVG',
      anio: '—',
      etapa: 'Sucesor',
      lic: 'Dominio público',
      aut: 'Turner Network Television',
      nota: 'Variante en alta definición de TNT Serie.',
    },
    {
      key: 'retro',
      nombre: 'Retro',
      img: W + 'c/c0/Retro_logo%27.jpg',
      commons: C + 'Retro_logo%27.jpg',
      ficha: "File:Retro logo'.jpg",
      dim: '190 × 107 px · JPG',
      anio: '2013',
      etapa: 'Canal hermano',
      lic: 'Dominio público',
      aut: 'Nickelmax',
      nota: 'Retro fue un canal sibling de Warner/Discovery en Latinoamérica en la misma línea de documental y misterio. Comparte el mismo origen documental y el mismo tono de marca que Infinito.',
    },
    {
      key: 'silver',
      nombre: 'Silver',
      img: W + '1/19/Silver_logo.svg',
      thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Silver_logo.svg/960px-Silver_logo.svg.png',
      commons: C + 'Silver_logo.svg',
      ficha: 'File:Silver logo.svg',
      dim: '28 × 21 px · SVG',
      anio: '—',
      etapa: 'Canal hermano',
      lic: 'Dominio público',
      aut: 'Sin autor identificado',
      nota: 'Otro canal de la misma familia. El archivo es muy pequeño (28 × 21 px), así que se muestra como referencia de inventario, no como pieza gráfica.',
      chico: true,
    },
  ];

  function renderLogosVerificados() {
    var host = $('[data-render="logos-verificados"]');
    if (!host) return;
    if (!LOGOS.length) { host.innerHTML = '<p class="empty">Sin logotipos verificados.</p>'; return; }

    host.innerHTML = LOGOS.map(function (L) {
      var src = L.thumb || L.img;
      var chips = [
        '<span class="chip chip--ok">' + esc(L.lic) + '</span>',
        '<span class="chip chip--muted">' + esc(L.etapa) + '</span>',
        (L.oficial ? '<span class="chip chip--gold">logotipo del canal</span>' : ''),
      ].join('');
      return (
        '<article class="card card--sm logo-card' + (L.chico ? ' logo-card--tiny' : '') + '" data-search="' +
        esc(norm(L.nombre + ' ' + L.anio + ' ' + L.etapa + ' ' + L.lic + ' ' + L.aut + ' logotipo logo ' + L.ficha)) + '">' +
        '<div class="markbox markbox--dark">' +
        '<img class="mark" src="' + esc(src) + '" alt="Logotipo de ' + esc(L.nombre) + '" loading="lazy" decoding="async" width="480" height="160">' +
        '</div>' +
        '<h4 class="card__t" style="margin-top:.7rem">' + esc(L.nombre) + '</h4>' +
        '<p class="faint small" style="margin:.15rem 0 .5rem">' + esc(L.dim) + ' · ' + esc(L.anio) + ' · ' + esc(L.aut) + '</p>' +
        '<div class="chips chips-wrap" style="margin-bottom:.55rem">' + chips + '</div>' +
        '<p class="small">' + esc(L.nota) + '</p>' +
        '<p class="extlink__credit small" style="margin-top:.6rem">' +
        'Ficha: <a href="' + esc(L.commons) + '" rel="noopener">' + esc(L.ficha) + '</a> en Wikimedia Commons' +
        '</p>' +
        '</article>'
      );
    }).join('');
  }

  /* -------------------------------------------------- FUENTES DE MARCA
     Sólo entradas comprobadas. Este sitio no rehostea logos: enlaza.     */
  var FUENTES = [
    {
      t: 'Wikimedia Commons — File:Infinito logo.png',
      u: C + 'Infinito_logo.png',
      d: 'Ficha del único logotipo genuino de Canal Infinito con licencia libre. Declara dominio público, autoría de Turner Broadcasting System Inc. y fecha 2011.',
      k: 'Marca · Commons',
    },
    {
      t: 'Wikimedia Commons — Category:Canal Infinito',
      u: 'https://commons.wikimedia.org/wiki/Category:Canal_Infinito',
      d: 'Categoría del canal en Commons. Está vacía: la ausencia de logotipo por etapa es un hecho del archivo, no un vacío de búsqueda. Sirve como control negativo honesto.',
      k: 'Marca · Commons',
    },
    {
      t: 'Wikimedia Commons — Category:Logos of television channels in Argentina',
      u: 'https://commons.wikimedia.org/wiki/Category:Logos_of_television_channels_in_Argentina',
      d: 'Contexto de marca: el resto de las cadenas de pago que compartieron el siglo y medio con Infinito. Sirve para comparar jerarquías visuales.',
      k: 'Marca · Commons',
    },
    {
      t: 'Wikipedia en español — Infinito (canal de televisión)',
      u: 'https://es.wikipedia.org/wiki/Infinito_(canal_de_televisi%C3%B3n)',
      d: 'Artículo principal en español: 23.370 caracteres y 42 referencias. Contiene la cronología de propiedad, la lista de eslóganes y los dos videos de YouTube que documentan el cierre.',
      k: 'Referencia · Wikipedia',
    },
    {
      t: 'Wikipedia en inglés — Infinito (TV channel)',
      u: 'https://en.wikipedia.org/wiki/Infinito_(TV_channel)',
      d: 'Artículo en inglés: 25.049 caracteres y 32 referencias. Su infobox es la fuente del logotipo de 2011 y de la web oficial archivada de 2012.',
      k: 'Referencia · Wikipedia',
    },
    {
      t: 'Lost Media Canal Infinito: Abre tu Mente',
      u: 'https://www.youtube.com/@lostmediacanalinfinito',
      d: 'Canal de archivo que publica las digitalizaciones de VHS del canal. Es la fuente primaria de casi todo este sitio.',
      k: 'Archivo · YouTube',
    },
    {
      t: 'Lista completa de videos del canal de archivo',
      u: 'https://www.youtube.com/@lostmediacanalinfinito/videos',
      d: 'El inventario que respalda la videoteca de este sitio, pieza por pieza.',
      k: 'Archivo · YouTube',
    },
    {
      t: 'Internet Archive — Television',
      u: 'https://archive.org/details/tv',
      d: 'Colección de televisión archivada; útil para contrastar qué se preservó y qué no de la TV de pago de los 90.',
      k: 'Preservación',
    },
  ];

  function renderFuentes() {
    $$('[data-render="fuentes-marca"]').forEach(function (host) {
      if (!FUENTES.length) { host.innerHTML = '<p class="empty">Sin fuentes cargadas.</p>'; return; }
      host.innerHTML = FUENTES.map(function (f) {
        return (
          '<div class="extlink" data-search="' + esc(norm(f.t + ' ' + f.k + ' ' + f.d)) + '">' +
          '<span class="extlink__icon" aria-hidden="true">◈</span>' +
          '<div>' +
          '<a class="t" href="' + esc(f.u) + '" rel="noopener">' + esc(f.t) + '</a>' +
          '<small>' + esc(f.k) + '</small>' +
          '<p>' + esc(f.d) + '</p>' +
          '</div>' +
          '</div>'
        );
      }).join('');
    });
  }

  /* ----------------------------------------------------------------- BOOT */
  function boot() {
    renderLockups();
    renderEtapas();
    renderLogosVerificados();
    renderFuentes();
    $$('[data-meta="generado"]').forEach(function (el) {
      el.textContent = (META && META.generado) || '—';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();