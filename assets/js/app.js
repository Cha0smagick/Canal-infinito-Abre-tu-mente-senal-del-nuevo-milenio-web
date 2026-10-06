/* ============================================================================
   Canal Infinito — Núcleo de la enciclopedia (assets/js/app.js)
   Dependencias: assets/js/data-lore.js  (window.CANAL_INFINITO)
   Sin frameworks. Todo se monta por data-attributes:
     <body data-page="enciclopedia">     -> marca la nav activa
     <div data-nav></div>               -> nav inyectada
     <div data-footer></div>            -> pie inyectado
     <div data-stat="videos"></div>     -> número con ThousandSeparator
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

  const LOGO_SVG =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#f0d060"/><stop offset="1" stop-color="#c9a84c"/>' +
    '</linearGradient></defs>' +
    '<circle cx="16" cy="16" r="14" fill="none" stroke="url(#cg)" stroke-width="1.5"/>' +
    '<ellipse cx="16" cy="16" rx="6" ry="14" fill="none" stroke="url(#cg)" stroke-width="1"/>' +
    '<path d="M2 16h28M4 9.5h24M4 22.5h24" stroke="url(#cg)" stroke-width="1" opacity=".65"/>' +
    '<circle cx="16" cy="16" r="2.6" fill="url(#cg)"/></svg>';

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
      `<span>Canal Infinito<small>Abre tu mente</small></span></a>` +
      `<button class="nav__burger" type="button" aria-expanded="false" aria-controls="navlinks" aria-label="Abrir menú">☰</button>` +
      `<div class="nav__links" id="navlinks">${links}</div>` +
      `</div>`;

    const burger = $('.nav__burger', host);
    const menu = $('.nav__links', host);
    burger.addEventListener('click', () => {
      const open = menu.hasAttribute('hidden');
      if (open) menu.removeAttribute('hidden');
      else menu.setAttribute('hidden', '');
      burger.setAttribute('aria-expanded', String(open));
      burger.textContent = open ? '✕' : '☰';
    });
    /* Cierra el menú al navegar y al pulsar Escape */
    $$('a', menu).forEach((a) => a.addEventListener('click', () => menu.setAttribute('hidden', '')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hasAttribute('hidden')) {
        menu.setAttribute('hidden', '');
        burger.setAttribute('aria-expanded', 'false');
        burger.textContent = '☰';
        burger.focus();
      }
    });
  }

  function renderFooter() {
    const host = $('[data-footer]');
    if (!host) return;
    const v = (D.videos || []).length;
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

  /* ------------------------------------------------- CANVAS DE PARTÍCULAS */
  function particles(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let w = 0;
    let h = 0;
    let pts = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(70, Math.round((w * h) / 26000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.5 + 0.4,
      }));
    };
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(201,168,76,.5)';
        ctx.fill();
      }
      /* enlaces sutiles entre partículas cercanas */
      ctx.strokeStyle = 'rgba(201,168,76,.10)';
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12000) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(loop);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------- BARRA DE PROGRESO + TOC */
  function progressBar() {
    const bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

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
          if (!a) return;
          if (en.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-active'));
            a.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    map.forEach((_, el) => io.observe(el));
  }

  /* --------------------------------------------------------- TARJETA VIDEO */
  const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

  function videoCard(v) {
    const dur = v.dur ? `<span class="vthumb__dur">${esc(v.dur)}</span>` : '';
    const mem = v.miembros ? `<span class="vthumb__mem">★ Solo miembros</span>` : '';
    const tags = (v.tags || [])
      .map((t) => `<span class="chip chip--muted">${esc(t)}</span>`)
      .join('');
    const ph = `<div class="vthumb vthumb--ph">▶</div>`;
    return (
      `<article class="vcard" data-search="${esc(norm(v.titulo + ' ' + v.programa + ' ' + (v.tags || []).join(' ')))}">` +
      `<a class="vthumb" href="video.html?id=${encodeURIComponent(v.id)}" aria-label="Ver ${esc(v.titulo)}">` +
      `<img src="${thumbUrl(v.id)}" alt="" loading="lazy" decoding="async" width="320" height="180" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'vthumb vthumb--ph',textContent:'▶'}))">` +
      `<span class="vthumb__play" aria-hidden="true">▶</span>${mem}${dur}</a>` +
      `<div class="vcard__body">` +
      `<span class="vcard__prog">${esc(v.programa)}</span>` +
      `<h3 class="vcard__title"><a href="video.html?id=${encodeURIComponent(v.id)}">${esc(v.titulo)}</a></h3>` +
      `<div class="vcard__tags chips">${tags}</div>` +
      `</div></article>`
    );
  }

  /* Filtros + buscador genéricos sobre un contenedor de tarjetas.
    Uso:  <div data-videogrid data-facet="programa"></div>            */
  function videogrids() {
    $$('[data-videogrid]').forEach((host) => {
      const facet = host.dataset.facet || 'programa';
      const state = { q: '', facet: 'todos', soloMiembros: false };
      const bar = host.parentNode.querySelector('[data-vgrid-controls]');
      const counter = bar && bar.querySelector('[data-vgrid-count]');

      const facetValues = [...new Set(D.videos.map((v) => (facet === 'programa' ? v.programa : facet === 'tags' ? (v.tags || []).join('|') : v[facet])))].filter(
        Boolean
      );

      const render = () => {
        const q = norm(state.q).trim();
        const list = D.videos.filter((v) => {
          if (state.facet !== 'todos') {
            const val = facet === 'programa' ? v.programa : facet === 'tags' ? (v.tags || []).join('|') : v[facet];
            if (val !== state.facet) return false;
          }
          if (state.soloMiembros && !v.miembros) return false;
          if (!q) return true;
          return norm(v.titulo + ' ' + v.programa + ' ' + (v.tags || []).join(' ')).includes(q);
        });
        host.innerHTML = list.length
          ? list.map(videoCard).join('')
          : `<p class="empty" style="grid-column:1/-1">Ningún video coincide con «${esc(state.q)}».</p>`;
        if (counter) counter.textContent = `${nf.format(list.length)} de ${nf.format(D.videos.length)} videos`;
        if (typeof window.updateVgridCount === 'function') window.updateVgridCount(list.length);
      };

      if (bar) {
        const chips = [`<button class="chip chip--muted chip-btn" type="button" data-f="todos" aria-pressed="true">Todos</button>`]
          .concat(
            facetValues.map(
              (f) => `<button class="chip chip--muted chip-btn" type="button" data-f="${esc(f)}" aria-pressed="false">${esc(f)}</button>`
            )
          )
          .join('');
        bar.innerHTML =
          `<div class="searchbar">` +
          `<input type="search" data-vgrid-q placeholder="Buscar en el archivo…" aria-label="Buscar videos">` +
          `<button class="chip chip--muted chip-btn" type="button" data-vgrid-mem aria-pressed="false">★ Solo miembros</button>` +
          `<span class="searchbar__count" data-vgrid-count></span>` +
          `</div>` +
          `<div class="filters" style="margin-top:.7rem"><span class="filters__label">Filtrar</span>${chips}</div>`;

        const input = bar.querySelector('[data-vgrid-q]');
        input.addEventListener('input', () => {
          state.q = input.value;
          render();
        });
        bar.querySelector('[data-vgrid-mem]').addEventListener('click', (e) => {
          state.soloMiembros = !state.soloMiembros;
          e.currentTarget.setAttribute('aria-pressed', String(state.soloMiembros));
          e.currentTarget.classList.toggle('chip--gold', state.soloMiembros);
          render();
        });
        bar.addEventListener('click', (e) => {
          const b = e.target.closest('[data-f]');
          if (!b) return;
          state.facet = b.dataset.f;
          $$('[data-f]', bar).forEach((x) => {
            x.setAttribute('aria-pressed', String(x === b));
            x.classList.toggle('chip--gold', x === b);
            x.classList.toggle('chip--muted', x !== b);
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
      const cols = host.dataset.columns === '1' ? '' : 'grid-2';
      if (!items.length) {
        host.innerHTML = `<p class="empty">Sin datos.</p>`;
        return;
      }
      host.innerHTML = items
        .map((it, i) => {
          const title = it.nombre || it.name || '';
          const meta = [it.era, it.genero].filter(Boolean).map((m) => `<span class="chip chip--muted">${esc(m)}</span>`).join('');
          const desc = it.descripcion || it.d || '';
          const extra = it.detalle || it.det || '';
          const link = it.video
            ? `<a class="btn btn--ghost btn--sm" href="video.html?id=${encodeURIComponent(it.video)}">Ver</a>`
            : '';
          const st = it.estado && it.estado !== 'nd' ? `<span class="chip chip--info">${esc(it.estado)}</span>` : '';
          return (
            `<article class="card" data-search="${esc(norm(title + ' ' + desc + ' ' + (it.genero || '')))}">` +
            `<div class="flex" style="justify-content:space-between;align-items:flex-start">` +
            `<h4 style="margin:0">${esc(title)}</h4>${st}</div>` +
            (meta ? `<div class="chips" style="margin:.45rem 0">${meta}</div>` : '') +
            `<p>${esc(desc)}</p>` +
            (extra ? `<p class="small muted" style="margin-top:.5rem">${esc(extra)}</p>` : '') +
            (link ? `<div style="margin-top:.7rem">${link}</div>` : '') +
            `</article>`
          );
        })
        .join('');
      if (cols) host.classList.add('grid', cols);
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
      if (e.key === '/' && document.activeElement !== input && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ------------------------------------------------------ NÚMEROS DINÁMICOS */
  function stats() {
    $$('[data-stat]').forEach((el) => {
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
    progressBar();
    scrollSpy();
    particles($('#particle-canvas'));
    /* currYear */
    $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* API mínima reutilizable por páginas concretas */
  window.CI = { $, $$, esc, nf, norm, slugify, videoCard, thumbUrl, PAGES, LOGO_SVG };
})();