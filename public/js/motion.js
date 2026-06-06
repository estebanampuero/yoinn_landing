/* ============================================================
   Yoinn · Motion layer (anime.js v4)
   ------------------------------------------------------------
   100% ADITIVO y a prueba de fallos:
   • Si anime.js no carga o una API difiere, el import falla y la
     página sigue intacta (este módulo es independiente).
   • Cada efecto va envuelto en safe(): un efecto que falle no
     tumba a los demás.
   • Nada se oculta vía CSS — los "from" los aplica anime al correr,
     así que si el JS no corre, todo queda visible.
   • Respeta prefers-reduced-motion: sin loops ni movimientos.
   ============================================================ */
import {
  animate,
  stagger,
  svg,
  createSpring,
} from 'https://cdn.jsdelivr.net/npm/animejs@4/+esm';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function safe(label, fn) {
  try { fn(); } catch (e) { /* console.debug('[motion]', label, e); */ }
}

/* Spring helper — si la API difiere, devuelve undefined y se usa el ease default */
function spring(opts = {}) {
  try { return createSpring(opts); } catch (_) { return undefined; }
}

/* Dispara cb una sola vez cuando el elemento entra al viewport */
function onEnter(el, cb, opts = {}) {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); }
    });
  }, Object.assign({ threshold: 0.25, rootMargin: '0px 0px -8% 0px' }, opts));
  io.observe(el);
}

/* Helper: arma animate() agregando ease spring solo si está disponible */
function anim(targets, params, springOpts) {
  const p = Object.assign({}, params);
  if (springOpts) { const s = spring(springOpts); if (s) p.ease = s; }
  return animate(targets, p);
}

function start() {
  document.documentElement.classList.add('motion-on');

  /* ── 1) HERO · entrada escalonada con spring ─────────────── */
  safe('hero-intro', () => {
    if (reduce) return;
    const h1 = $('#top h1.display');
    const light = [
      $('#live-pill'),
      $('[data-i18n="hero.sub"]'),
      $('#download'),
    ].filter(Boolean);

    // El h1 (probable LCP) solo se desliza, NO se oculta → no daña LCP
    if (h1) anim(h1, { translateY: [22, 0], duration: 800 }, { stiffness: 90, damping: 13 });
    if (light.length) {
      anim(light, {
        opacity: [0, 1],
        translateY: [26, 0],
        duration: 850,
        delay: stagger(110, { start: 120 }),
      }, { stiffness: 92, damping: 14 });
    }
  });

  /* ── 2) HERO · pines decorativos que caen y flotan ───────── */
  safe('hero-pins', () => {
    if (reduce || isMobile()) return;
    const hero = $('#top');
    if (!hero) return;
    const layer = document.createElement('div');
    layer.className = 'fx-pins';
    layer.setAttribute('aria-hidden', 'true');
    const spots = [
      { l: 11, t: 32, s: 30 }, { l: 80, t: 20, s: 26 },
      { l: 86, t: 60, s: 34 }, { l: 18, t: 72, s: 22 },
    ];
    spots.forEach((sp) => {
      const img = document.createElement('img');
      img.src = 'assets/pin.png'; img.alt = ''; img.className = 'fx-pin';
      img.style.left = sp.l + '%'; img.style.top = sp.t + '%';
      img.style.width = sp.s + 'px';
      layer.appendChild(img);
    });
    hero.appendChild(layer);

    animate('.fx-pin', {
      opacity: [0, 1], translateY: [-34, 0], scale: [0.3, 1],
      duration: 700, delay: stagger(140, { start: 350 }),
    });
    // Flotación continua (cada pin con su propio ritmo)
    $$('.fx-pin').forEach((p, i) => {
      animate(p, {
        translateY: [0, -12, 0],
        duration: 3200 + i * 450,
        loop: true,
        delay: 900 + i * 120,
      });
    });
  });

  /* ── 3) HERO · pin que recorre una ruta (motion path) ────── */
  safe('hero-route', () => {
    if (reduce || isMobile()) return;
    const hero = $('#top');
    if (!hero || !svg || !svg.createMotionPath) return;
    const wrap = document.createElement('div');
    wrap.className = 'fx-route';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<svg viewBox="0 0 600 220" preserveAspectRatio="xMidYMid slice" class="fx-route-svg">' +
        '<path id="fx-route-path" d="M-40,170 C110,60 230,210 360,110 S560,40 660,120" ' +
        'fill="none" stroke="rgba(0,188,212,0.30)" stroke-width="2.5" stroke-dasharray="3 9" stroke-linecap="round"/>' +
        '<g id="fx-route-dot"><circle r="9" fill="#00BCD4" opacity="0.25"/><circle r="5" fill="#00BCD4"/>' +
        '<circle r="2" fill="#fff"/></g>' +
      '</svg>';
    hero.appendChild(wrap);

    const mp = svg.createMotionPath('#fx-route-path');
    animate('#fx-route-dot', {
      translateX: mp.translateX,
      translateY: mp.translateY,
      duration: 6500,
      loop: true,
      ease: 'linear',
    });
  });

  /* ── 4) STATS · contadores que suben al entrar ───────────── */
  safe('stats-count', () => {
    $$('.stat-num').forEach((el) => {
      const to  = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      if (isNaN(to)) return;
      const render = (val) => { el.textContent = pre + val.toFixed(dec) + suf; };
      if (reduce) { render(to); return; }
      onEnter(el, () => {
        const obj = { v: 0 };
        render(0);
        animate(obj, {
          v: to,
          duration: 1700,
          ease: spring({ stiffness: 55, damping: 20 }) || 'out(3)',
          onUpdate: () => render(obj.v),
          onComplete: () => render(to),
        });
      });
    });
  });

  /* ── 5) CÓMO FUNCIONA · ruta dibujada 01→02→03 ───────────── */
  safe('how-route', () => {
    if (reduce || isMobile()) return;
    const nums = $$('.step-num');
    if (nums.length < 3) return;
    const grid = nums[0].closest('.grid');
    if (!grid) return;

    grid.style.position = 'relative';
    // Las columnas por encima de la línea
    $$(':scope > div', grid).forEach((c) => { c.style.position = 'relative'; c.style.zIndex = '1'; });

    const ns = 'http://www.w3.org/2000/svg';
    const el = document.createElementNS(ns, 'svg');
    el.setAttribute('class', 'fx-howline');
    el.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'rgba(0,188,212,0.45)');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-dasharray', '2 10');
    path.setAttribute('stroke-linecap', 'round');
    el.appendChild(path);
    grid.prepend(el);

    function layout() {
      const gr = grid.getBoundingClientRect();
      el.setAttribute('width', gr.width);
      el.setAttribute('height', gr.height);
      el.setAttribute('viewBox', `0 0 ${gr.width} ${gr.height}`);
      const pts = nums.map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left - gr.left + r.width / 2, y: r.top - gr.top + r.height / 2 };
      });
      path.setAttribute('d', `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y} L${pts[2].x},${pts[2].y}`);
    }
    layout();

    let drawn = false;
    onEnter(grid, () => {
      if (drawn) return; drawn = true;
      let drawable = null;
      if (svg && svg.createDrawable) {
        try { drawable = svg.createDrawable(path)[0]; } catch (_) {}
      }
      if (drawable) {
        animate(drawable, { draw: ['0 0', '0 1'], duration: 1400, ease: 'inOutQuad' });
      } else {
        // Fallback: dibujado con stroke-dashoffset sobre una copia sólida
        path.setAttribute('stroke-dasharray', '');
        const len = path.getTotalLength ? path.getTotalLength() : 1000;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        animate(path, { strokeDashoffset: [len, 0], duration: 1400, ease: 'inOutQuad' });
      }
    });

    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => safe('how-relayout', layout), 150);
    }, { passive: true });
  });

  /* ── 6) SÚPER-ANFITRIÓN · chips en cascada + badge ───────── */
  safe('host-chips', () => {
    if (reduce) return;
    const host = $('[data-i18n="host.eyebrow"]')?.closest('section');
    if (!host) return;
    const chips = $$('.rounded-full', host);
    if (!chips.length) return;
    onEnter(host, () => {
      anim(chips, {
        opacity: [0, 1], translateY: [16, 0], scale: [0.9, 1],
        duration: 600, delay: stagger(45),
      }, { stiffness: 120, damping: 12 });
    });
  });

  /* ── 7) COMUNIDAD REAL · avatares que convergen (loop) ───── */
  safe('community-converge', () => {
    if (reduce || isMobile()) return;
    const sec = $('[data-i18n="comm.eyebrow"]')?.closest('section');
    if (!sec) return;
    const ns = 'http://www.w3.org/2000/svg';
    const wrap = document.createElement('div');
    wrap.className = 'fx-converge';
    wrap.setAttribute('aria-hidden', 'true');

    const S = 240, C = S / 2;
    const colors = ['#00BCD4', '#FF5E5B', '#FFB300', '#00ACC1', '#5A6B7E'];
    const starts = [
      { x: 20,  y: 30  }, { x: 215, y: 40 }, { x: 30, y: 205 },
      { x: 210, y: 200 }, { x: 120, y: 12 },
    ];
    let dots = '';
    starts.forEach((p, i) => {
      dots += `<circle class="cv-dot" data-sx="${p.x - C}" data-sy="${p.y - C}" ` +
              `cx="${C}" cy="${C}" r="13" fill="${colors[i]}" />`;
    });
    wrap.innerHTML =
      `<svg viewBox="0 0 ${S} ${S}" class="fx-converge-svg">` +
        `<circle cx="${C}" cy="${C}" r="20" fill="none" stroke="rgba(255,179,0,0.5)" stroke-width="2"/>` +
        `<circle class="cv-core" cx="${C}" cy="${C}" r="11" fill="#FFB300"/>` +
        dots +
      `</svg>`;
    sec.appendChild(wrap);

    $$('.cv-dot', wrap).forEach((d, i) => {
      const sx = parseFloat(d.dataset.sx), sy = parseFloat(d.dataset.sy);
      animate(d, {
        translateX: [sx, 0],
        translateY: [sy, 0],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.7],
        duration: 2600,
        delay: i * 160,
        loop: true,
        loopDelay: 600,
        ease: 'inOutQuad',
      });
    });
    const core = $('.cv-core', wrap);
    if (core) animate(core, { scale: [1, 1.25, 1], duration: 1600, loop: true, ease: 'inOutQuad' });
  });

  /* ── 8) BOTONES FLOTANTES · pop con spring al aparecer ───── */
  safe('float-pop', () => {
    if (reduce) return;
    const fd = $('#float-dl');
    if (!fd) return;
    const btns = $$('.float-dl-btn', fd);
    let popped = false;
    const mo = new MutationObserver(() => {
      if (popped) return;
      if (fd.classList.contains('show')) {
        popped = true; mo.disconnect();
        anim(btns, {
          scale: [0.7, 1], opacity: [0, 1],
          duration: 600, delay: stagger(90),
        }, { stiffness: 140, damping: 11 });
      }
    });
    mo.observe(fd, { attributes: true, attributeFilter: ['class'] });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
