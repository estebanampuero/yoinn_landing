/* ============================================================
   Yoinn · Motion layer (anime.js v4) — ARCO NARRATIVO
   ------------------------------------------------------------
   El scroll es el viaje: de la soledad al encuentro.
   Cada animación dramatiza una frase del copy, no decora.

   Beat 1 · Hero ......... tu ciudad está viva (planes "live" caen)
   Beat 2 · Manifiesto ... el problema (contactos que se dispersan)
   Beat 3 · Cómo funciona  la solución (la ruta se traza sin fricción)
   Beat 4 · Comunidad .... la confianza (badges que se "sellan")
   Beat 5 · Stats ........ la tracción (contadores + estrellas)
   Beat 6 · CTA final .... el encuentro (avatares que convergen)

   100% aditivo y a prueba de fallos:
   • módulo independiente: si anime.js no carga, la página sigue intacta.
   • cada beat va en safe(): uno que falle no tumba los demás.
   • nada se oculta por CSS — los "from" los aplica anime al correr.
   • respeta prefers-reduced-motion.
   ============================================================ */
import {
  animate,
  stagger,
  svg,
  createSpring,
} from 'https://cdn.jsdelivr.net/npm/animejs@4/+esm';

const NS = 'http://www.w3.org/2000/svg';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function safe(label, fn) { try { fn(); } catch (e) { /* console.debug('[motion]', label, e); */ } }
function spring(o = {}) { try { return createSpring(o); } catch (_) { return undefined; } }
function anim(targets, params, springOpts) {
  const p = Object.assign({}, params);
  if (springOpts) { const s = spring(springOpts); if (s) p.ease = s; }
  return animate(targets, p);
}
function onEnter(el, cb, opts = {}) {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
  }, Object.assign({ threshold: 0.3, rootMargin: '0px 0px -8% 0px' }, opts));
  io.observe(el);
}
function svgEl(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

function start() {
  document.documentElement.classList.add('motion-on');

  /* ════════ BEAT 1 · HERO — tu ciudad está viva ════════
     El texto llega con física (spring). Sobre el "mapa" del hero
     caen pastillas de planes reales que laten como "en vivo".     */
  safe('hero-intro', () => {
    if (reduce) return;
    const h1 = $('#top h1.display');
    const light = [$('#live-pill'), $('[data-i18n="hero.sub"]'), $('#download')].filter(Boolean);
    if (h1) anim(h1, { translateY: [22, 0], duration: 800 }, { stiffness: 90, damping: 13 });
    if (light.length) anim(light, {
      opacity: [0, 1], translateY: [26, 0], duration: 850, delay: stagger(110, { start: 120 }),
    }, { stiffness: 92, damping: 14 });
  });

  safe('hero-live-plans', () => {
    if (reduce || !isDesktop()) return;
    const hero = $('#top');
    if (!hero) return;
    const layer = document.createElement('div');
    layer.className = 'fx-live'; layer.setAttribute('aria-hidden', 'true');
    // Posiciones en zonas con aire (alrededor del mockup, no sobre el texto)
    const plans = [
      { e: '🏓', t: 'Pádel · hoy 19:00',   l: 67, top: 12 },
      { e: '🌅', t: 'Sunset · ahora',       l: 91, top: 38 },
      { e: '☕', t: 'Café · a 400 m',        l: 73, top: 78 },
      { e: '🏔️', t: 'Trekking · sábado',    l: 90, top: 64 },
    ];
    plans.forEach((p) => {
      const pill = document.createElement('div');
      pill.className = 'fx-live-pill';
      pill.style.left = p.l + '%'; pill.style.top = p.top + '%';
      pill.innerHTML = `<span class="fx-live-dot"></span><span class="fx-live-emoji">${p.e}</span>${p.t}`;
      layer.appendChild(pill);
    });
    hero.appendChild(layer);

    // Caen sobre el mapa, en secuencia, con rebote
    anim('.fx-live-pill', {
      opacity: [0, 1], translateY: [-26, 0], scale: [0.6, 1],
      duration: 650, delay: stagger(160, { start: 500 }),
    }, { stiffness: 130, damping: 12 });

    // Latido "en vivo" continuo del puntito
    $$('.fx-live-dot').forEach((d, i) => animate(d, {
      scale: [1, 1.9, 1], opacity: [1, 0.4, 1],
      duration: 1600, loop: true, delay: 1200 + i * 200, ease: 'inOutQuad',
    }));
  });

  /* ════════ BEAT 2 · MANIFIESTO — el problema ════════
     "1.847 contactos" se acumula rápido (mucha gente)…
     …pero los puntos se dispersan y se apagan (cero conexión).     */
  safe('manifesto-count', () => {
    if (reduce) return;
    const l1 = $('[data-i18n="manifesto.title.l1"]');
    if (!l1) return;
    onEnter(l1, () => {
      const full = l1.textContent;
      const m = full.match(/^\s*([\d.,]+)([\s\S]*)$/);
      if (!m) return;
      const numStr = m[1], rest = m[2];
      const sep = numStr.includes('.') ? '.' : (numStr.includes(',') ? ',' : '');
      const target = parseInt(numStr.replace(/[.,]/g, ''), 10);
      if (!target) return;
      const fmt = (n) => {
        const s = Math.round(n).toString();
        return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
      };
      const obj = { v: 0 };
      animate(obj, {
        v: target, duration: 1500,
        ease: spring({ stiffness: 60, damping: 20 }) || 'out(3)',
        onUpdate: () => { l1.textContent = fmt(obj.v) + rest; },
        onComplete: () => { l1.textContent = full; },
      });
    });
  });

  safe('manifesto-scatter', () => {
    if (reduce || !isDesktop()) return;
    const sec = $('[data-i18n="manifesto.eyebrow"]')?.closest('section');
    if (!sec) return;
    const layer = document.createElement('div');
    layer.className = 'fx-scatter'; layer.setAttribute('aria-hidden', 'true');
    const N = 14;
    for (let i = 0; i < N; i++) {
      const d = document.createElement('span');
      d.className = 'fx-scatter-dot';
      d.style.left = '50%'; d.style.top = '50%';
      layer.appendChild(d);
    }
    // detrás del texto
    sec.insertBefore(layer, sec.firstChild);

    onEnter(sec, () => {
      $$('.fx-scatter-dot', layer).forEach((d, i) => {
        const a = (i / N) * Math.PI * 2 + Math.random();
        const dist = 140 + Math.random() * 220;
        animate(d, {
          translateX: [0, Math.cos(a) * dist],
          translateY: [0, Math.sin(a) * dist * 0.6],
          opacity: [0, 0.5, 0],   // aparecen juntos y se apagan al alejarse
          scale: [1, 0.4],
          duration: 3200, delay: i * 90, loop: true, loopDelay: 400, ease: 'outQuad',
        });
      });
    });
  });

  /* ════════ BEAT 3 · CÓMO FUNCIONA — la solución ════════
     Una ruta se traza conectando 01→02→03: el camino, sin fricción. */
  safe('how-journey', () => {
    if (reduce || !isDesktop()) return;
    const nums = $$('.step-num');
    if (nums.length < 3) return;
    const grid = nums[0].closest('.grid');
    if (!grid) return;

    grid.style.position = 'relative';
    $$(':scope > div', grid).forEach((c) => { c.style.position = 'relative'; c.style.zIndex = '1'; });

    const el = svgEl('svg', { class: 'fx-journey', 'aria-hidden': 'true' });
    const path = svgEl('path', {
      fill: 'none', stroke: 'rgba(0,188,212,0.5)', 'stroke-width': '2.5',
      'stroke-linecap': 'round',
    });
    el.appendChild(path);
    // waypoints en cada paso
    const wp = nums.map(() => svgEl('circle', { r: '5', fill: '#00BCD4' }));
    wp.forEach((c) => el.appendChild(c));
    grid.prepend(el);

    function layout() {
      const gr = grid.getBoundingClientRect();
      el.setAttribute('width', gr.width); el.setAttribute('height', gr.height);
      el.setAttribute('viewBox', `0 0 ${gr.width} ${gr.height}`);
      const pts = nums.map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left - gr.left + r.width / 2, y: r.top - gr.top + r.height / 2 };
      });
      path.setAttribute('d', `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y} L${pts[2].x},${pts[2].y}`);
      wp.forEach((c, i) => { c.setAttribute('cx', pts[i].x); c.setAttribute('cy', pts[i].y); });
      return path.getTotalLength ? path.getTotalLength() : 1000;
    }
    const len = layout();

    // Estado inicial: línea sin dibujar + waypoints ocultos
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    wp.forEach((c) => { c.style.opacity = '0'; });

    let drawn = false;
    onEnter(grid, () => {
      if (drawn) return; drawn = true;
      animate(path, { strokeDashoffset: [len, 0], duration: 1500, ease: 'inOutQuad' });
      anim(wp, { opacity: [0, 1], scale: [0, 1], duration: 500, delay: stagger(450, { start: 200 }) },
        { stiffness: 140, damping: 11 });
    });

    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => safe('how-relayout', () => {
        const L = layout();
        if (drawn) { path.style.strokeDasharray = L; path.style.strokeDashoffset = 0; }
        else { path.style.strokeDasharray = L; path.style.strokeDashoffset = L; }
      }), 150);
    }, { passive: true });
  });

  /* ════════ BEAT 4 · COMUNIDAD REAL — la confianza ════════
     Las insignias se "sellan" (stamp) y el dorado recibe un brillo:
     "si ves dorado, es de fiar".                                    */
  safe('community-trust', () => {
    if (reduce) return;
    const blue = $('img[src*="pin-blue"]');
    const gold = $('img[src*="pin-golden"]');
    const stampOf = (img, springOpts) => {
      if (!img) return;
      onEnter(img, () => anim(img, {
        scale: [0, 1], rotate: [-12, 0], opacity: [0, 1], duration: 700,
      }, springOpts));
    };
    stampOf(blue, { stiffness: 150, damping: 10 });
    stampOf(gold, { stiffness: 150, damping: 10 });

    // Barrido de brillo sobre la card dorada
    safe('gold-shimmer', () => {
      const card = gold ? gold.closest('.surface-card') : null;
      if (!card) return;
      card.style.position = 'relative';
      card.style.overflow = 'hidden';
      const sh = document.createElement('div');
      sh.className = 'fx-shimmer'; sh.setAttribute('aria-hidden', 'true');
      card.appendChild(sh);
      onEnter(card, () => animate(sh, {
        translateX: ['-130%', '130%'], duration: 1100, delay: 350, ease: 'inOutQuad',
      }), { threshold: 0.4 });
    });
  });

  /* ════════ BEAT 5 · STATS — la tracción ════════
     Los números cuentan hacia arriba; el rating llena 4.8 de 5★.   */
  safe('stats-count', () => {
    $$('.stat-num').forEach((el) => {
      const to = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      if (isNaN(to)) return;
      // prefijo/sufijo leídos lazy: stats-stars puede limpiar el ★ del rating
      const render = (v) => {
        const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
        el.textContent = pre + v.toFixed(dec) + suf;
      };
      if (reduce) { render(to); return; }
      onEnter(el, () => {
        const obj = { v: 0 }; render(0);
        animate(obj, {
          v: to, duration: 1700,
          ease: spring({ stiffness: 55, damping: 20 }) || 'out(3)',
          onUpdate: () => render(obj.v), onComplete: () => render(to),
        });
      });
    });
  });

  safe('stats-stars', () => {
    const ratingEl = $('.stat-num[data-decimals]'); // el 4.8★
    if (!ratingEl) return;
    const to = parseFloat(ratingEl.dataset.count);
    const pct = Math.max(0, Math.min(100, (to / 5) * 100));
    // quita el ★ del número (lo representamos con la barra)
    ratingEl.dataset.suffix = '';
    if (ratingEl.textContent.trim().endsWith('★')) ratingEl.textContent = ratingEl.textContent.replace('★', '');
    const bar = document.createElement('div');
    bar.className = 'fx-stars'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="fx-stars-bg">★★★★★</div><div class="fx-stars-fill">★★★★★</div>';
    ratingEl.insertAdjacentElement('afterend', bar);
    const fill = $('.fx-stars-fill', bar);
    if (reduce) { fill.style.width = pct + '%'; return; }
    fill.style.width = '0%';
    onEnter(bar, () => animate(fill, { width: ['0%', pct + '%'], duration: 1400, delay: 300, ease: 'inOutQuad' }));
  });

  /* ════════ BEAT 6 · CTA FINAL — el encuentro ════════
     Avatares dispersos CONVERGEN al pin de Yoinn y forman grupo:
     "tu ciudad te está esperando" → únete.                         */
  safe('cta-gather', () => {
    if (reduce || !isDesktop()) return;
    const sec = $('[data-i18n="final.title.l1"]')?.closest('section');
    if (!sec || !svg || !svg.createMotionPath) return;

    const W = 360, H = 240, cx = W / 2, cy = 96, R = 120;
    const colors = ['#00BCD4', '#FF5E5B', '#FFB300', '#00ACC1', '#7C4DFF', '#2ED573'];
    const n = 6;
    const wrap = document.createElement('div');
    wrap.className = 'fx-gather'; wrap.setAttribute('aria-hidden', 'true');

    let paths = '', avs = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R * 0.78;
      const mx = (sx + cx) / 2, my = (sy + cy) / 2;
      const dx = cx - sx, dy = cy - sy, ln = Math.hypot(dx, dy) || 1;
      const ox = -dy / ln * 26, oy = dx / ln * 26;
      paths += `<path id="gp${i}" d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q${(mx + ox).toFixed(1)} ${(my + oy).toFixed(1)} ${cx} ${cy}" fill="none"/>`;
      avs += `<g class="gp-av" id="av${i}"><circle r="12" fill="${colors[i % colors.length]}"/><circle r="12" fill="none" stroke="#fff" stroke-width="2.5"/></g>`;
    }
    wrap.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" class="fx-gather-svg">` +
        `<g opacity="0">${paths}</g>` +
        `<circle class="gp-core" cx="${cx}" cy="${cy}" r="16" fill="#00BCD4"/>` +
        `<circle cx="${cx}" cy="${cy}" r="16" fill="none" stroke="#fff" stroke-width="3"/>` +
        avs +
      `</svg>`;
    sec.insertBefore(wrap, sec.firstChild);

    onEnter(sec, () => {
      for (let i = 0; i < n; i++) {
        const mp = svg.createMotionPath('#gp' + i);
        animate('#av' + i, {
          translateX: mp.translateX, translateY: mp.translateY,
          opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.7],
          duration: 2800, delay: 200 + i * 230, loop: true, loopDelay: 250, ease: 'inOutQuad',
        });
      }
      const core = $('.gp-core', wrap);
      if (core) animate(core, { scale: [1, 1.25, 1], duration: 1500, loop: true, ease: 'inOutQuad' });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else { start(); }
