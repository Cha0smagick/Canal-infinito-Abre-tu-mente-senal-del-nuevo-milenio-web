/* ============================================================================
   Canal Infinito — Núcleo de la enciclopedia (assets/js/app.js)
   Dependencias: assets/js/data-lore.js  (window.CANAL_INFINITO)
   Sin frameworks. Todo se monta por data-attributes:
     <body data-page="enciclopedia">     -> marca la nav activa
     <div data-nav></div>               -> nav inyectada
     <div data-footer></div>            -> pie inyectado
     <div data-stat="videos"></div>     -> número con separador de miles
   ========================================================================== */
(function () {
  'use strict';

  const D = window.CANAL_INFINITO || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  const nf = new Intl.NumberFormat('es-ES');
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  /* ------------------------------------------------------------ NAVEGACIÓN */
  const PAGES = [
    { href: 'index.html', label: 'Inicio' },
    { href: 'enciclopedia.html', label: 'Enciclopedia' },
    { href: 'canal.html', label: 'El Canal' },
    { href: 'programas.html', label: 'Programas' },
    { href: 'videoteca.html', label: 'Videoteca' },
    { href: 'logos.html', label: 'Logos' },
    { href: 'enlaces.html', label: 'Enlaces' },
    { href: 'tv.html', label: 'Señor de TV' },
  ];

  /* Marca mínima: un globo meridianado en trazo dorado, sin degradados. */
  const LOGO_SVG =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="#c9a84c" stroke-width="1.4">' +
    '<circle cx="16" cy="16" r="14"/>' +
    '<ellipse cx="16" cy="16" rx="6" ry="14" stroke-width="1"/>' +
    '<path d="M2.5 16h27M5 9.5h22M5 22.5h22" stroke-width="1" opacity=".6"/>' +
    '</g></svg>';

  function slugify(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function renderNav() {
    const host = $('[data-nav]');
    if (!host) return;
    const page = document.body.dataset.page || '';
    const links = PAGES.map(
      (p) =>
        `<a href="${p.href}"${p.href === page ? ' aria-current="page"' : ''}>${esc(p.label)}</a>`
    ).join('');
    host.className = 'nav';
    host.innerHTML =
      `<div class="nav__inner">` +
      `<a class="nav__brand" href="index.html">${LOGO_SVG}` +
      `<span>Canal Infinito <small>Abre tu mente</small></span></a>` +
      `<button class="nav__burger" type="button" aria-expanded="false" aria-controls="navlinks">Menú</button>` +
      `<div class="nav__links" id="navlinks">${links}</div>` +
      `</div>`;

    const burger = $('.nav__burger', host);
    const menu = $('.nav__links', host);
    const setOpen = (open) => {
      menu.toggleAttribute('hidden', !open);
      burger.setAttribute('aria-expanded', String(open));
      burger.textContent = open ? 'Cerrar' : 'Menú';
    };
    setOpen(false);
    burger.addEventListener('click', () =>
      setOpen(burger.getAttribute('aria-expanded') !== 'true')
    );
    /* Cierra el menú al navegar y al pulsar Escape */
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });
  }

  function renderFooter() {
    const host = $('[data-footer]');
    if (!host) return;
    host.className = 'footer';
    host.innerHTML =
      `<div class="wrap">` +
      `<div class="footer__grid">` +
      `<div>` +
      `<h4>Canal Infinito — Enciclopedia</h4>` +
      `<p class="small faint">Archivo documental y sitio tributo sin fines de lucro dedicado al canal argentino Canal Infinito (1994–2015), sus programas originales, sus bloques y el archivo recuperado en video.</p>` +
      `<p class="small"><em class="tagline">«Abre tu mente»</em> · <em class="tagline">«Señal del nuevo milenio»</em></p>` +
      `</div>` +
      `<div>` +
      `<h4>Enciclopedia</h4><ul>` +
      PAGES.slice(0, 5).map((p) => `<li><a href="${p.href}">${esc(p.label)}</a></li>`).join('') +
      `</ul></div>` +
      `<div>` +
      `<h4>Archivo</h4><ul>` +
      `<li><a href="https://www.youtube.com/@lostmediacanalinfinito" rel="noopener">Canal de YouTube</a></li>` +
      `<li><a href="enlaces.html">Enlaces relacionados</a></li>` +
      `<li><a href="logos.html">Logos y archivo gráfico</a></li>` +
      `<li><a href="video.html?id=Oyc6Zu6WEic">Zona Infinito</a></li>` +
      `</ul></div>` +
      `</div>` +
      `<div class="footer__bottom">` +
      `<span>${nf.format((D.videos || []).length)} videos catalogados · ${nf.format((D.bloques || []).length)} bloques · ${nf.format((D.esloganes || []).length)} eslóganes</span>` +
      `<span>Datos generados el ${esc(D.meta && D.meta.generado) || '—'}</span>` +
      `<span>Contenido de propiedad de sus respectivos titulares · sin ánimo de lucro</span>` +
      `</div></div>`;
  }

  /* --------------------------------------------------- INDICE ANCLADO ACTIVO */
  function scrollSpy() {
    const links = $$('.toc a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach((a) => {
      const el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (el) map.set(el, a);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const a = map.get(en.target);
          if (!a || !en.isIntersecting) return;
          links.forEach((l) => l.classList.remove('is-active'));
          a.classList.add('is-active');
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    map.forEach((_, el) => io.observe(el));
  }

  /* ------------------------------------------- FICHA DE FILMOGRAFIA (fila) */
  const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

  function videoCard(v) {
    const tags = (v.tags || []).map((t) => `<span>${esc(t)}</span>`).join('');
    const meta = [v.dur ? esc(v.dur) : '', v.miembros ? 'solo miembros' : '']
      .filter(Boolean)
      .join(' · ');
    const href = `video.html?id=${encodeURIComponent(v.id)}`;
    return (
      `<article class="vcard" data-search="${esc(norm(v.titulo + ' ' + v.programa + ' ' + (v.tags || []).join(' ')))}">` +
      `<a class="vthumb" href="${href}" tabindex="-1" aria-hidden="true">` +
      `<img src="${thumbUrl(v.id)}" alt="" loading="lazy" decoding="async" width="320" height="180" ` +
      `onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'vthumb vthumb--ph',textContent:'—'}))">` +
      `</a>` +
      `<div class="vcard__body">` +
      `<p class="vcard__prog">${esc(v.programa)}</p>` +
      `<h3 class="vcard__title"><a href="${href}">${esc(v.titulo)}</a></h3>` +
      (tags ? `<p class="vcard__tags">${tags}</p>` : '') +
      `</div>` +
      (meta ? `<p class="vcard__meta">${meta}</p>` : '') +
      `</article>`
    );
  }

  /* Filtros + buscador genericos sobre un contenedor de fichas.
     Uso:  <div data-videogrid data-facet="programa"></div>            */
  function videogrids() {
    $$('[data-videogrid]').forEach((host) => {
      const facet = host.dataset.facet || 'programa';
      const state = { q: '', facet: 'todos', soloMiembros: false };
      const bar = host.parentNode.querySelector('[data-vgrid-controls]');
      const counter = bar && bar.querySelector('[data-vgrid-count]');
      const key = (v) => (facet === 'programa' ? v.programa : facet === 'tags' ? (v.tags || []).join('|') : v[facet]);

      const render = () => {
        const q = norm(state.q).trim();
        const list = D.videos.filter((v) => {
          if (state.facet !== 'todos' && key(v) !== state.facet) return false;
          if (state.soloMiembros && !v.miembros) return false;
          if (!q) return true;
          return norm(v.titulo + ' ' + v.programa + ' ' + (v.tags || []).join(' ')).includes(q);
        });
        host.innerHTML = list.length
          ? list.map(videoCard).join('')
          : `<p class="empty">Ningún video coincide con «${esc(state.q)}».</p>`;
        if (counter) counter.textContent = `${nf.format(list.length)} de ${nf.format(D.videos.length)} videos`;
        if (typeof window.updateVgridCount === 'function') window.updateVgridCount(list.length);
      };

      if (bar) {
        const values = [...new Set(D.videos.map(key))].filter(Boolean);
        const chips = [`<button class="chip chip-btn is-active" type="button" data-f="todos" aria-pressed="true">Todos</button>`]
          .concat(
            values.map(
              (f) => `<button class="chip chip-btn" type="button" data-f="${esc(f)}" aria-pressed="false">${esc(f)}</button>`
            )
          )
          .join('');
        bar.innerHTML =
          `<div class="searchbar">` +
          `<input type="search" data-vgrid-q placeholder="Buscar en el archivo" aria-label="Buscar videos">` +
          `<button class="chip chip-btn" type="button" data-vgrid-mem aria-pressed="false">Solo miembros</button>` +
          `<span class="searchbar__count" data-vgrid-count></span>` +
          `</div>` +
          `<div class="filters"><span class="filters__label">Filtrar por programa</span>${chips}</div>`;

        bar.querySelector('[data-vgrid-q]').addEventListener('input', (e) => {
          state.q = e.currentTarget.value;
          render();
        });
        bar.querySelector('[data-vgrid-mem]').addEventListener('click', (e) => {
          state.soloMiembros = !state.soloMiembros;
          e.currentTarget.setAttribute('aria-pressed', String(state.soloMiembros));
          e.currentTarget.classList.toggle('is-active', state.soloMiembros);
          render();
        });
        bar.addEventListener('click', (e) => {
          const b = e.target.closest('[data-f]');
          if (!b) return;
          state.facet = b.dataset.f;
          $$('[data-f]', bar).forEach((x) => {
            const on = x === b;
            x.setAttribute('aria-pressed', String(on));
            x.classList.toggle('is-active', on);
          });
          render();
        });
      }
      render();
    });
  }

  /* ------------------------------------------------ LISTAS GENERICAS (details)
     <div data-list="originales" data-columns="2"></div>                    */
  function lists() {
    $$('[data-list]').forEach((host) => {
      const items = D[host.dataset.list] || [];
      if (!items.length) {
        host.innerHTML = `<p class="empty">Sin datos.</p>`;
        return;
      }
      host.innerHTML = items
        .map((it) => {
          const title = it.nombre || it.name || '';
          const desc = it.descripcion || it.d || '';
          const extra = it.detalle || it.det || '';
          const meta = [it.era, it.genero].filter(Boolean).join(' · ');
          const st = it.estado && it.estado !== 'nd' ? it.estado : '';
          const link = it.video
            ? `<a class="btn btn--ghost btn--sm" href="video.html?id=${encodeURIComponent(it.video)}">Ver la pieza</a>`
            : '';
          return (
            `<article class="card" data-search="${esc(norm(title + ' ' + desc + ' ' + (it.genero || '') + ' ' + (it.era || '')))}">` +
            `<h4 class="card__t">${esc(title)}</h4>` +
            (meta ? `<p class="vcard__prog">${esc(meta)}</p>` : '') +
            `<p>${esc(desc)}</p>` +
            (st ? `<p class="small muted">Estado del archivo: ${esc(st)}</p>` : '') +
            (extra ? `<p class="small muted">${esc(extra)}</p>` : '') +
            (link ? `<div style="margin-top:.7rem">${link}</div>` : '') +
            `</article>`
          );
        })
        .join('');
      if (host.dataset.columns === '1') host.classList.add('prose--list');
      else host.classList.add('grid-2');
    });
  }

  /* ----------------------------------------------- BUSCADOR DE LA ENCICLOPEDIA
     Busca en el DOM ya renderizado cualquier elemento con [data-search].      */
  function globalSearch() {
    const input = $('[data-globalsearch]');
    if (!input) return;
    const panel = $('[data-globalsearch-results]');
    const targets = $$('[data-search]');
    const run = () => {
      const q = norm(input.value).trim();
      let visible = 0;
      targets.forEach((el) => {
        const hit = !q || (el.dataset.search || '').includes(q);
        el.classList.toggle('hide', !hit);
        if (hit) visible++;
      });
      if (panel) {
        panel.textContent = q
          ? `${nf.format(visible)} resultado(s) para «${input.value}»`
          : `${nf.format(targets.length)} fichas indexadas`;
      }
      $$('.toc a').forEach((a) => {
        const sec = document.getElementById(decodeURIComponent(a.hash.slice(1)));
        if (!sec) return;
        const n = sec.querySelectorAll('[data-search]:not(.hide)').length;
        const c = a.querySelector('.toc__count');
        if (c) c.textContent = n ? nf.format(n) : '';
      });
    };
    input.addEventListener('input', run);
    input.addEventListener('search', run);
    run();
    document.addEventListener('keydown', (e) => {
      const tag = (document.activeElement || {}).tagName || '';
      if (e.key === '/' && document.activeElement !== input && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ------------------------------------------------------ NÚMEROS DINÁMICOS */
  function stats() {
    const map = {
      videos: (D.videos || []).length,
      conDuracion: (D.videos || []).filter((v) => v.dur).length,
      miembros: (D.videos || []).filter((v) => v.miembros).length,
      esloganes: (D.esloganes || []).length,
      bloques: (D.bloques || []).length,
      originales: (D.originales || []).length,
      adquiridos: (D.adquiridos || []).length,
      devociones: (D.devociones || []).length,
      hallazgos: (D.hallazgos || []).length,
      programas: new Set((D.videos || []).map((v) => v.programa)).size,
    };
    $$('[data-stat]').forEach((el) => {
      const v = map[el.dataset.stat];
      if (v != null) el.textContent = nf.format(v);
    });
  }

  /* --------------------------------------------------------------- BOOT */
  function boot() {
    renderNav();
    renderFooter();
    stats();
    lists();
    videogrids();
    globalSearch();
    scrollSpy();
    $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* API mínima reutilizable por páginas concretas */
  window.CI = { $, $$, esc, nf, norm, slugify, videoCard, thumbUrl, PAGES, LOGO_SVG };
})();
