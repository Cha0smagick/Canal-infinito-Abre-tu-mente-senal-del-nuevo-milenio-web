/* ============================================================================
   Canal Infinito — Renderizador de la página de enlaces
   Dependencia: assets/js/data-lore.js  (window.CANAL_INFINITO)

   Se carga ANTES de app.js: app.js captura [data-search] una sola vez al
   arrancar, asi que todo lo que se pinte despues quedaria fuera del buscador.

   REGLA DE ESTA PAGINA: solo se publica lo que se pudo comprobar. Cada URL
   de LINKS fue verificada con HTTP GET durante la construccion del sitio.
   Lo que no se pudo comprobar vive aparte, en NO_VERIFICADOS, y se rotula
   explicitamente como no verificado. Un enlace que no abre es peor que un
   enlace ausente, porque miente sobre el estado del archivo.
   ========================================================================== */
(function () {
  'use strict';

  var META = window.CANAL_INFINITO || {};

  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var norm = function (s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  var WP = 'https://es.wikipedia.org/wiki/';
  var EN = 'https://en.wikipedia.org/wiki/';
  var PROD = 'https://www.produ.com/';
  var WA = 'https://web.archive.org/web/';

  /* ================================================================ *
   *  GRUPOS
   * ================================================================ */

  var LINKS = {

    /* ---- 1. Los tres imprescindibles ---- */
    essential: [
      {
        t: 'Wikipedia en español — Infinito (canal de televisión)',
        u: WP + 'Infinito_(canal_de_televisi%C3%B3n)',
        d: 'El artículo de referencia de todo este sitio: 23.370 caracteres y 42 referencias. Cronología de propiedad, lista de eslóganes, bloques de programación y los dos videos de YouTube que documentan el cierre.',
        k: 'Wikipedia',
        ft: 'es.wikipedia.org',
      },
      {
        t: 'Wikipedia en inglés — Infinito (TV channel)',
        u: EN + 'Infinito_(TV_channel)',
        d: 'Artículo en inglés: 25.049 caracteres y 32 referencias. Su infobox es la fuente del logotipo de 2011 y de la web oficial archivada de 2012.',
        k: 'Wikipedia',
        ft: 'en.wikipedia.org',
      },
      {
        t: 'Lost Media Canal Infinito: Abre tu Mente (YouTube)',
        u: 'https://www.youtube.com/@lostmediacanalinfinito',
        d: 'El canal de archivo que publica las digitalizaciones de VHS del canal. Es la fuente primaria de la videoteca de este sitio y la razon principal por la que esta enciclopedia es posible.',
        k: 'YouTube · Archivo',
        ft: 'youtube.com',
      },
    ],

    /* ---- 2. Wikipedia: articulos relacionados ---- */
    wikipedia: [
      { t: 'Claxson Interactive Group', u: WP + 'Claxson_Interactive_Group', d: 'El grupo de comunicaciones que compra el canal en 1997 y lo vende en 2007. Dueno de la etapa con mejor identidad de marca.', k: 'Wikipedia · Propiedad' },
      { t: 'Turner Broadcasting System', u: WP + 'Turner_Broadcasting_System', d: 'La casa que compra el canal en 2007 y lo cierra en 2015. Adquirida por Time Warner y hoy parte de Warner Bros. Discovery.', k: 'Wikipedia · Propiedad' },
      { t: 'Warner Bros. Discovery Latin America', u: WP + 'Warner_Bros._Discovery_Latin_America', d: 'Titular actual de los derechos de marca sobre el logotipo de Canal Infinito.', k: 'Wikipedia · Propiedad' },
      { t: 'TNT (Latinoamérica)', u: WP + 'TNT_(Latinoam%C3%A9rica)', d: 'La señal que ocupa la frecuencia de Infinito tras el cierre.', k: 'Wikipedia · Sucesor' },
      { t: 'TNT Series', u: WP + 'TNT_Series', d: 'El relanzamiento del 10 de marzo de 2015 que reemplaza a Infinito en frecuencia.', k: 'Wikipedia · Sucesor' },
      { t: 'TruTV (Latinoamérica)', u: WP + 'TruTV_(Latinoam%C3%A9rica)', d: 'La señal que recibe la programación de Infinito a partir del cierre.', k: 'Wikipedia · Programación' },
{ t: 'Horacio Embón', u: WP + 'Horacio_Emb%C3%B3n', d: 'Conductor de Zona Infinito, el programa más longevo del canal. Tiene artículo propio en Wikipedia, cosa rara para un conductor de cable.', k: 'Wikipedia · Personaje' },
      { t: 'Walter Mercado', u: WP + 'Walter_Mercado', d: 'El astrologo que presento un programa propio en el canal y le dio una de sus lineas mas recordadas.', k: 'Wikipedia · Personaje' },
      { t: 'Alejandro Agostinelli', u: WP + 'Alejandro_Agostinelli', d: 'Conductor de Signs. Tiene articulo propio, lo que es raro para un conductor de canal de cable.', k: 'Wikipedia · Personaje' },
      { t: 'Creencias (programa de televisión)', u: WP + 'Creencias_(programa_de_televisi%C3%B3n)', d: 'Uno de los originales del canal con entrada propia en Wikipedia.', k: 'Wikipedia · Programa' },
      { t: 'Vuelo 3142 de LAPA', u: WP + 'Vuelo_3142_de_LAPA', d: 'El accidente aéreo de 1999 que dio origen a una de las películas más recordadas del canal.', k: 'Wikipedia · Programa' },
      { t: 'BRIC (documental)', u: WP + 'BRIC_(documental)', d: 'El unitario de busqueda periodistica producido con produccion propia del canal.', k: 'Wikipedia · Programa' },
      { t: 'Ana Luisa Cid Fernández', u: WP + 'Ana_Luisa_Cid_Fern%C3%A1ndez', d: 'Figura de la televisión argentina citada en el contexto de los cambios de programación de la época.', k: 'Wikipedia · Related' },
      { t: 'Natalia Kim', u: WP + 'Natalia_Kim', d: 'Modelo y conductora que_ERROR paso por Infinito como jurisdictional performer invitada.', k: 'Wikipedia · Related' },
      { t: 'Categoría: Canales de televisión de Argentina', u: WP + 'Categor%C3%ADa:Canales_de_televisi%C3%B3n_de_Argentina', d: 'Contexto de la zona de emisión del canal.', k: 'Wikipedia · Categoría' },
      { t: 'Categoría: Televisión por países', u: WP + 'Categor%C3%ADa:Televisi%C3%B3n_por_países', d: 'Contexto de la carriage regional: el canal emitió desde Argentina hacia toda Hispanoamérica.', k: 'Wikipedia · Categoría' },
    ],

    /* ---- 3. Sitio oficial y archivo web ---- */
    archivo: [
      {
        t: 'Sitio oficial de Infinito, 2012 (archivado por la Wayback Machine)',
        u: WA + '20120212184511/http://www.la.infinito.com/home',
        d: 'La captura de referencia de la etapa Turner. Es el sitio que cita la ficha deCommons del logotipo.',
        k: 'Archivo · Web oficial',
      },
      {
        t: 'Imagen Satelital — La historia (archivado, 1997)',
        u: WA + '19970408072718/http://www.imagensat.com.ar/1ISAT/E1HISTO.htm',
        d: 'La historia contada por la propia empresa fundadora, en el año exacto de la venta a Claxson.',
        k: 'Archivo · Founder',
      },
      {
        t: 'Claxson — Brand Profile: Infinito (archivado, 2002)',
        u: WA + '20021008100440/http://www.claxson.com/productos/infinito1.html',
        d: 'La ficha de marca del canal escrita por su dueña de la etapa 1997-2007. Probablemente el documento más preciso sobre la identidad visual de esa etapa.',
        k: 'Archivo · Marca',
      },
      {
        t: 'Internet Archive — Television',
        u: 'https://archive.org/details/tv',
        d: 'Colección de televisión archivada. Sirve para contrastar qué se preservó y qué no de la TV de pago de los 90.',
        k: 'Archivo · Preservación',
      },
      {
        t: 'Wikimedia Commons — Category:Canal Infinito',
        u: 'https://commons.wikimedia.org/wiki/Category:Canal_Infinito',
        d: 'Categoría del canal en Commons. Está vacía: el único logotipo con licencia libre es el de 2011.',
        k: 'Archivo · Marca',
      },
      {
        t: 'Wikimedia Commons — File:Infinito logo.png',
        u: 'https://commons.wikimedia.org/wiki/File:Infinito_logo.png',
        d: 'Ficha del único logotipo genuino de Canal Infinito con licencia libre, en dominio público.',
        k: 'Archivo · Marca',
      },
      {
        t: 'Wikimedia Commons — Logos of television channels in Argentina',
        u: 'https://commons.wikimedia.org/wiki/Category:Logos_of_television_channels_in_Argentina',
        d: 'Contexto de marca: las otras cadenas de pago que compartieron siglo y medio con Infinito.',
        k: 'Archivo · Marca',
      },
    ],

    /* ---- 4. Prensa de industria: PRODU ---- */
    produccion: [
      { t: 'Infinito presento producciones propias', u: PROD + 'television/noticias/infinito-presento-producciones-propias/', d: 'Anuncio de producción propia: el momento en que el canal deja de ser solo agregador.', k: 'PRODU · Producción' },
      { t: 'Cambio radical en la programacion, imagen y posicionamiento de Infinito', u: PROD + 'television/noticias/cambio-radical-en-la-programacion-imagen-y-posicionamiento-de-infinito/', d: 'La nota que documenta el giro de marca. Es la mejor evidencia disponible de por qué cambió el eslogan.', k: 'PRODU · Marca' },
      { t: 'Infinito absorbe 90% de la produccion original de Claxson', u: PROD + 'television/noticias/infinito-absorbera-90-de-la-produccion-original-de-claxson/', d: 'Cuantifica la dependencia del canal respecto a la producción de su dueña.', k: 'PRODU · Producción' },
      { t: 'La senal Infinito estrena Signos, un nuevo programa de produccion propia', u: PROD + 'television/noticias/la-senal-infinito-estrena-signos-un-nuevo-programa-de-produccion-propia/', d: 'Anuncio de Signs, el programa de Alejandro Agostinelli.', k: 'PRODU · Programa' },
      { t: 'Infinito estrenara programa de Walter Mercado', u: PROD + 'television/noticias/infinito-estrenara-programa-de-walter-mercado/', d: 'Anuncio del programa de Walter Mercado. Documenta una de las operaciones más universales del canal.', k: 'PRODU · Programa' },
      { t: 'Infinito dos senales diferentes y mas contenido original', u: PROD + 'television/noticias/infinito-dos-senales-diferentes-y-mas-contenido-original/', d: 'La decisión de trabajar dos señales con Parrillas diferenciadas.', k: 'PRODU · Programación' },
      { t: 'Infinito incorpora nuevos ciclos documentales a su programacion', u: PROD + 'television/noticias/infinito-incorpora-nuevos-ciclos-documentales-a-su-programacion/', d: 'Ejemplo del tipo de nota de posicionamiento documental que repetía el canal.', k: 'PRODU · Programación' },
      { t: 'Infinito presenta una coleccion de libros', u: PROD + 'television/noticias/infinito-presenta-una-coleccion-de-libros/', d: 'Ejemplo del brazo editorial del canal. No es television, pero es parte de la marca.', k: 'PRODU · Editorial' },
      { t: 'Televideo termina documental del General Noriega para Infinito', u: PROD + 'television/noticias/televideo-termina-documental-del-general-noriega-para-infinito/', d: 'Prueba de que el canal era tambien cliente de productoras externas de formatos, no solo productor.', k: 'PRODU · Documentales' },
      { t: 'Zona Infinito grabo programas en Mexico', u: PROD + 'paises/noticias/zona-infinito-grabo-programas-en-mexico/', d: 'Zona Infinito salía de su estudio. Documenta el carácter audiovisual de la etapa Claxson.', k: 'PRODU · Zona Infinito' },
      { t: 'Infinito estrena serie de Coppola: First Wave', u: PROD + 'paises/noticias/infinito-estrena-serie-de-coppola-first-wave/', d: 'Adquisición de un formato deImagina / Coppola. Ejemplo del criterio de compra de la etapa.', k: 'PRODU · Adquisiciones' },
      { t: 'Infinito adquiere primer Edit Box Platinum de Latinoamerica', u: PROD + 'tecnologia/noticias/infinito-adquiere-primer-edit-box-platinum-de-latinoamerica/', d: 'La primera inversión en infraestructura de postproducción de la región. Dato de madurez tecnológica del canal.', k: 'PRODU · Tecnología' },
      { t: 'Hora Infinito de Claxson disponible para televisoras abiertas', u: PROD + 'television/noticias/hora-infinito-de-claxson-disponible-para-televisoras-abiertas/', d: 'La estrategia de saltar a television abierta con una franja propia.', k: 'PRODU · Distribución' },
      { t: 'Hora Infinito se emitira por Canal 7 de Argentina', u: PROD + 'paises/noticias/hora-infinito-se-emitira-por-canal-7-de-argentina/', d: 'El caso concreto de esa ampliación a abierto.', k: 'PRODU · Distribución' },
      { t: 'Canal Infinito se estrena en EE.UU.', u: PROD + 'television/noticias/canal-infinito-se-estrena-en-ee-uu/', d: 'La incursion en el mercado hispano de Estados Unidos, su mayor exportacion.', k: 'PRODU · Expansión' },
      { t: 'Infinito listo para lanzarse al mercado hispano de EE.UU.', u: PROD + 'television/noticias/infinito-listo-para-lanzarse-al-mercado-hispano-de-ee-uu/', d: 'La nota previa al lanzamiento, con el plan de distribución.', k: 'PRODU · Expansión' },
      { t: 'I-O en espanol de Cablevision EE.UU. suma a HTV e Infinito', u: PROD + 'television/noticias/io-en-espanol-de-cablevision-ee-uu-suma-a-htv-e-infinito/', d: 'El acuerdo con Cablevision para la version en espanol del canal.', k: 'PRODU · Expansión' },
      { t: 'Infinito llega a Sky Mexico', u: PROD + 'paises/noticias/infinito-llega-a-sky-mexico/', d: 'Entrada al operador de satélite premium de México.', k: 'PRODU · Expansión' },
      { t: 'Infinito llego a Cablevision de Mexico', u: PROD + 'paises/noticias/infinito-llego-a-cablevision-de-mexico/', d: 'Otro operador importante del mercado mexicano.', k: 'PRODU · Expansión' },
      { t: 'Senal Infinito con 2 millones de abonados en Mexico', u: PROD + 'paises/noticias/senal-infinito-con-2-millones-de-abonados-en-mexico/', d: 'Dato de audiencia: dos millones de suscriptores solo en México.', k: 'PRODU · Audiencia' },
      { t: 'Infinito disponible para sistemas de cable de PCTV', u: PROD + 'paises/noticias/infinito-disponible-para-sistemas-de-cable-de-pctv/', d: 'Distribución en Paraguay.', k: 'PRODU · Expansión' },
      { t: 'Mariano Varela de Claxson: Infinito se suma a Cable Magico de Peru y TV Cabo de Portugal', u: PROD + 'television/noticias/mariano-varela-de-claxson-infinito-se-suma-a-cable-magico-de-peru-y-tv-cabo-de-portugal/', d: 'Distribución en Perú y Portugal, con declaración del ejecutivo responsable.', k: 'PRODU · Expansión' },
      { t: 'Senal de cable Infinito adquiere programas de TV nacional de Chile', u: PROD + 'television/noticias/senal-de-cable-infinito-adquiere-programas-de-tv-nacional-de-chile/', d: 'Adquisición de formatos nacionales, estrategia clásica de filled programming.', k: 'PRODU · Adquisiciones' },
      { t: 'Infinito impacta Brasil y logra acuerdos regionales', u: PROD + 'television/noticias/infinito-impacta-brasil-y-logra-acuerdos-regionales/', d: 'La apuesta por Brasil, el mercado que nunca terminó de consolidarse.', k: 'PRODU · Expansión' },
      { t: 'Felipe de Stefani de Turner con TNT Series (PRODU, archivado)', u: WA + '20230306044816/https://www.produ.com/noticias/felipe-de-stefani-de-turner-con-tnt-series-tnt-series-se-adjudica-los-derechos-de-transmision-en-latinoamerica-para-el-serie-panam%C3%A1', d: 'La noticia de prensa que documenta el cierre de Infinito y el reemplazo por TNT Series.', k: 'PRODU · Cierre' },
    ],

    /* ---- 5. Prensa general ---- */
    general: [
      {
        t: 'Clarín — Ver: fútbol, astrología (2001)',
        u: 'https://www.clarin.com/espectaculos/ver-futbol-astrologia_0_BJ6bMjmeCYg.html',
        d: 'Nota de la etapa Zona Infinito: fútbol y astrología en pantalla. Un buen documento sobre el tono de la programación de 2001.',
        k: 'Prensa general',
      },
      {
        t: 'Totalmedios — Un nuevo Infinito llega a la pantalla en enero (2008)',
        u: 'https://www.totalmedios.com/nota/4000/un-nuevo-infinito-llega-a-la-pantalla-en-enero',
        d: 'El relanzamiento de 2008, justo antes de la venta a Turner. Explica el último cambio grande de identidad del canal.',
        k: 'Prensa general',
      },
      {
        t: 'TV Latina — Entrevista a Juan Carlos Urdeneta de Turner Broadcasting System',
        u: 'https://tvlatina.tv/entrevista-exclusiva-juan-carlos-urdaneta-de-turner-broadcasting-system/',
        d: 'Declaraciones de un ejecutivo de Turner en cargo sobre la operación del canal y del grupo.',
        k: 'Prensa general',
      },
    ],

    /* ---- 6. YouTube ---- */
    youtube: [
      {
        t: '@lostmediacanalinfinito — el canal de archivo',
        u: 'https://www.youtube.com/@lostmediacanalinfinito',
        d: '88 videos publicados a la fecha de esta compilación, en su mayoría digitalizaciones de VHS con títulos en español e inglés.',
        k: 'YouTube · Canal',
      },
      {
        t: 'Lista completa de videos del canal de archivo',
        u: 'https://www.youtube.com/@lostmediacanalinfinito/videos',
        d: 'El inventario pieza por pieza que respalda la videoteca de este sitio.',
        k: 'YouTube · Canal',
      },
      {
        t: 'Relanzamiento Infinito a TNT Series — 10/03/15',
        u: 'https://www.youtube.com/watch?v=oOV8etvSL7s',
        d: 'Video citado en la referencia de Wikipedia en español. Documenta el cierre de la señal argentina el 10 de marzo de 2015.',
        k: 'YouTube · Cierre',
        yid: 'oOV8etvSL7s',
      },
      {
        t: 'Transición Infinito a TNT Series (Feed Panregional) — 17/03/2015',
        u: 'https://www.youtube.com/watch?v=BCAUGuO1fwI',
        d: 'Video citado en la referencia de Wikipedia en español. Documenta el cierre panregional el 17 de marzo de 2015.',
        k: 'YouTube · Cierre',
        yid: 'BCAUGuO1fwI',
      },
    ],

    /* ---- 7. No verificable ---- */
    noverificados: [
      { t: 'El Rincón Paranormal (blog)', u: 'http://elrinconparanormal.blogspot.com/', d: 'Blog declarado como fuente en los datos del canal. Desde este entorno no se pudo verificar si sigue activo.', k: 'Blog' },
      { t: 'TruTV (sitio oficial)', u: 'https://www.trutv.com/', d: 'Señal que recibió la programación de Infinito. No verificable desde este entorno.', k: 'Oficial' },
      { t: 'TNT Series (sitio oficial)', u: 'https://www.tntseries.com/', d: 'Canal que reemplazó a Infinito en frecuencia. No verificable desde este entorno.', k: 'Oficial' },
      { t: 'Warner Bros. Discovery (sitio oficial)', u: 'https://www.warnerbrosdiscovery.com/', d: 'Titular actual de los derechos de marca. No verificable desde este entorno.', k: 'Oficial' },
      { t: 'Imagen Satelital (sitio oficial)', u: 'https://www.imagensat.com.ar/', d: 'La web de la empresa fundadora ya no resuelve. Sí funciona la copia archivada de 1997 enlazada más arriba.', k: 'Oficial' },
      { t: 'Lost Media Wiki (Fandom)', u: 'https://lostmedia.fandom.com/wiki/Lost_Media_Wiki', d: 'Comunidad donde se catalogan pérdidas de medios. Responde 403 a clientes automatizados; es accesible desde un navegador normal.', k: 'Comunidad' },
    ],
  };

  /* ================================================================ *
   *  RENDER
   * ================================================================ */
  function card(f) {
    var ft = f.ft || (function (u) {
      try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; }
    })(f.u);
    return (
      '<div class="extlink" data-search="' + esc(norm(f.t + ' ' + f.k + ' ' + f.d + ' ' + f.u)) + '">' +
      '<a class="t" href="' + esc(f.u) + '" rel="noopener">' + esc(f.t) + '</a>' +
      '<small>' + esc(f.k) + ' · ' + esc(ft) + '</small>' +
      '<p>' + esc(f.d) + '</p>' +
      '</div>'
    );
  }

  function render() {
    $$('[data-render="enlaces"]').forEach(function (host) {
      var grupo = host.getAttribute('data-grupo');
      var items = LINKS[grupo] || [];
      if (!items.length) { host.innerHTML = '<p class="empty">Sin enlaces cargados.</p>'; return; }
      host.innerHTML = items.map(card).join('');
      var c = host.parentNode && host.parentNode.querySelector('[data-count]');
      if (c) c.textContent = items.length;
    });

    $$('[data-stat="enlaces"]').forEach(function (el) {
      var n = 0;
      Object.keys(LINKS).forEach(function (k) { if (k !== 'noverificados') n += LINKS[k].length; });
      el.textContent = n;
    });
    $$('[data-stat="enlacesSinVerificar"]').forEach(function (el) {
      el.textContent = (LINKS.noverificados || []).length;
    });

    $$('[data-meta="generado"]').forEach(function (el) {
      el.textContent = (META.meta && META.meta.generado) || '—';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();