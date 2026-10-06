/* ============================================================================
   Canal Infinito — Renderizadores de la enciclopedia
   Dependencia: assets/js/data-lore.js  (window.CANAL_INFINITO)

   Se carga ANTES de app.js a propósito: app.js captura la lista de
   [data-search] una sola vez, al arrancar. Si este archivo renderizara
   después, sus fichas quedarían fuera del buscador global.

   Cada elemento generado lleva data-search normalizado, que es lo que
   consume el buscador global de app.js.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.CANAL_INFINITO || {};
  var CANAL = D.canal || {};

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  /* idéntico a app.js#norm — el buscador compara con este criterio */
  var norm = function (s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  function empty(host, msg) {
    host.innerHTML = '<p class="empty">' + esc(msg || 'Sin datos.') + '</p>';
  }

  /* ------------------------------------------------- 1. LOS 7 ESLOGANES */
  function renderEsloganes() {
    var items = D.esloganes || [];
    $$('[data-render="esloganes"]').forEach(function (host) {
      if (!items.length) return empty(host, 'Sin eslóganes registrados.');
      host.innerHTML = items
        .map(function (s, i) {
          var texto = s.eslogan || s.texto || s.nombre || '';
          var periodo = s.periodo || s.anios || '';
          var oficial = s.periodo === '2004-2008';
          return (
            '<article class="card" data-search="' +
            esc(norm(periodo + ' ' + texto + ' eslogan lema canal infinito')) +
            '">' +
            '<div class="flex" style="justify-content:space-between;align-items:flex-start">' +
            '<p class="kicker" style="margin:0">' + esc(periodo) + '</p>' +
            (oficial
              ? '<span class="chip chip--ok">Eslogan oficial</span>'
              : '<span class="chip chip--muted">' + String(i + 1).padStart(2, '0') + '</span>') +
            '</div>' +
            '<p class="quote" style="margin:.55rem 0 .5rem">«' + esc(texto) + '»</p>' +
            '</article>'
          );
        })
        .join('');
    });
  }

  /* --------------------------------------------- 2. PROPIEDAD Y BROADCASTING */
  var PROP_CTX = {
    'Imagen Satelital':
      'Operadora satelital argentina. Lanzó el canal el 4 de noviembre de 1994 con el claim «24 horas de documentales». Sin locución estable: la identidad del canal todavía no estaba construida.',
    'Claxson Interactive Group (Cisneros)':
      'Brazo audiovisual del Grupo Cisneros. Etapa de máxima producción propia: nacen Zona Infinito, Mundo Infinito y Signos. Los eslóganes se vuelven más agresivos («Existe otra realidad»).',
    'Time Warner / Turner Broadcasting System':
      'Ingreso en la orbita de Warner. La marca se conserva pero la estrategia pasa a ser de linea de cable satelital del grupo. El canal queda expuesto a las decisiones de la central y esto prepara el cierre de 2015.',
  };

  function renderPropiedades() {
    var items = CANAL.propiedades || [];
    $$('[data-render="propiedades"]').forEach(function (host) {
      if (!items.length) return empty(host, 'Sin propietarios registrados.');
      host.innerHTML = items
        .map(function (p) {
          var nombre = p.nombre || '';
          var periodo = p.periodo || '';
          return (
            '<tr data-search="' + esc(norm(periodo + ' ' + nombre + ' propietario dueno propiedad ownership')) + '">' +
            '<td class="nowrap"><strong>' + esc(periodo) + '</strong></td>' +
            '<td>' + esc(nombre) + '</td>' +
            '<td class="small muted">' + esc(PROP_CTX[nombre] || '—') + '</td>' +
            '</tr>'
          );
        })
        .join('');
    });
  }

  /* ------------------------------------------------------ 3. LOS 20 BLOQUES */
  function renderBloques() {
    var items = D.bloques || [];
    $$('[data-render="bloques"]').forEach(function (host) {
      if (!items.length) return empty(host, 'Sin bloques registrados.');
      host.innerHTML = items
        .map(function (b, i) {
          var nombre = b.nombre || '';
          var desc = b.descripcion || '';
          return (
            '<article class="card" data-search="' + esc(norm(nombre + ' ' + desc + ' bloque programacion')) + '">' +
            '<div class="flex" style="justify-content:space-between;align-items:flex-start">' +
            '<h4 style="margin:0">' + esc(nombre) + '</h4>' +
            '<span class="chip chip--muted">' + String(i + 1).padStart(2, '0') + '</span>' +
            '</div>' +
            '<p style="margin-top:.45rem">' + esc(desc) + '</p>' +
            '</article>'
          );
        })
        .join('');
    });
  }

  /* -------------------------------------------------------- 4. DEVOCIONES */
  function renderDevociones() {
    var items = D.devociones || [];
    $$('[data-render="devociones"]').forEach(function (host) {
      if (!items.length) return empty(host, 'Sin devociones registradas.');
      host.innerHTML = items
        .map(function (d) {
          var nombre = typeof d === 'string' ? d : d.nombre || '';
          return (
            '<span class="chip chip--purple" data-search="' +
            esc(norm(nombre + ' devocion favorito icónico')) +
            '">' + esc(nombre) + '</span>'
          );
        })
        .join('');
    });
  }

  /* ----------------------------------------------------------- 5. METADATOS */
  function renderMeta() {
    var g = (D.meta && D.meta.generado) || '';
    $$('[data-meta="generado"]').forEach(function (el) {
      el.textContent = g || '—';
    });
  }

  /* ------------------------------------------- 6. FILTROS DE LISTA (locales)
     Filtrado independiente del buscador global: cada lista tiene su propio
     input para no mezclar el filtro con la búsqueda de toda la enciclopedia. */
  function wireListFilters() {
    $$('[data-list-search]').forEach(function (input) {
      var key = input.dataset.listSearch;
      var host = $('[data-list="' + key + '"]');
      if (!host) return;

      var apply = function () {
        var q = norm(input.value).trim();
        var kids = Array.prototype.slice.call(host.children);
        if (!kids.length) return; /* app.js todavía no renderizó */
        var n = 0;
        kids.forEach(function (el) {
          var hit = !q || (el.dataset.search || '').includes(q);
          el.classList.toggle('hide', !hit);
          if (hit) n++;
        });
        var out = input.parentElement.querySelector('.searchbar__count');
        if (!out) {
          out = document.createElement('span');
          out.className = 'searchbar__count';
          input.parentElement.appendChild(out);
        }
        out.textContent = q
          ? new Intl.NumberFormat('es-ES').format(n) + ' de ' + kids.length + ' · «' + input.value + '»'
          : new Intl.NumberFormat('es-ES').format(kids.length) + ' fichas';
      };

      input.addEventListener('input', apply);
      input.addEventListener('search', apply);
      /* el host lo puebla app.js en su boot (mismo turno de DOMContentLoaded) */
      setTimeout(apply, 0);
    });
  }

  /* ----------------------------------------------------------------- BOOT */
  function boot() {
    renderEsloganes();
    renderPropiedades();
    renderBloques();
    renderDevociones();
    renderMeta();
    wireListFilters();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
