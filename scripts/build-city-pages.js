#!/usr/bin/env node
'use strict';

/**
 * Genera landing pages SEO por ciudad en public/<slug>/que-hacer.html
 * Contenido único por ciudad (evita thin/duplicate content).
 * Diseño on-brand (Tailwind CDN + Poppins + paleta cyan/ink, igual que index.html).
 *
 * Uso:  node scripts/build-city-pages.js
 * Para añadir una ciudad, agrega un objeto a CITIES y vuelve a correr.
 */

const fs   = require('fs');
const path = require('path');

const APP_STORE  = 'https://apps.apple.com/app/id6756730755';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=cl.yoinn.social';
const BASE       = 'https://www.yoinn.cl';
const TODAY      = new Date().toISOString().slice(0, 10);

const CITIES = [
  {
    slug: 'puerto-montt', name: 'Puerto Montt', region: 'Región de Los Lagos',
    intro: 'Capital de Los Lagos, entre el mar y el bosque. Desde Angelmó hasta Pelluco, Puerto Montt está lleno de planes para hacer con gente nueva: caminatas con vista al Seno de Reloncaví, café de especialidad, pichangas y asados frente al mar.',
    zones: ['Costanera', 'Angelmó', 'Pelluco', 'Mirasol', 'Cardonal'],
    acts: ['🏔️ Trekking', '🚣 Kayak en el seno', '☕ Café', '🥩 Asado', '⚽ Fútbol', '🎣 Pesca', '🌅 Sunset', '🏓 Pádel'],
    faqs: [
      ['¿Qué hacer en Puerto Montt para conocer gente?', 'Con Yoinn ves planes reales cerca de ti —trekking, café, kayak, pichangas— y te unes con un tap. Es la forma más simple de conocer gente nueva en Puerto Montt sin que sea una app de citas.'],
      ['¿Hay actividades gratis en Puerto Montt?', 'Sí. Muchos yoinns son gratis: caminatas por la costanera, juntas de running, pichangas y cafés. Filtra por categoría en la app.'],
      ['¿Yoinn funciona en Puerto Montt?', 'Sí, Puerto Montt es una de nuestras ciudades principales. Abre el mapa y mira los planes activos cerca tuyo hoy.'],
    ],
  },
  {
    slug: 'puerto-varas', name: 'Puerto Varas', region: 'Región de Los Lagos',
    intro: 'La ciudad de las rosas, a orillas del lago Llanquihue y bajo el volcán Osorno. Puerto Varas es perfecta para planes al aire libre: kayak en el lago, trekking en el volcán, ciclismo por la costanera y sunsets que parecen postal.',
    zones: ['Costanera', 'Centro', 'Frutillar (cerca)', 'Ensenada (cerca)'],
    acts: ['🌋 Trekking volcán', '🚣 Kayak en el lago', '🚴 Ciclismo', '☕ Café', '🌅 Sunset lago', '🧘 Yoga', '🥾 Senderismo', '🍻 Cervecería'],
    faqs: [
      ['¿Qué hacer en Puerto Varas con gente nueva?', 'Con Yoinn te unes a planes reales: kayak en el Llanquihue, trekking al volcán Osorno, café o ciclismo por la costanera. Ves quién va y te sumas con un tap.'],
      ['¿Cuáles son los mejores panoramas al aire libre en Puerto Varas?', 'Kayak en el lago, senderos del volcán Osorno y los saltos del Petrohué, ciclismo por la costanera y los sunsets sobre el Llanquihue. Todo aparece como yoinns en la app.'],
      ['¿Yoinn está disponible en Puerto Varas?', 'Sí. Puerto Varas y Puerto Montt forman uno de nuestros polos más activos del sur.'],
    ],
  },
  {
    slug: 'valdivia', name: 'Valdivia', region: 'Región de Los Ríos',
    intro: 'La ciudad de los ríos y la cerveza, universitaria y verde. En Valdivia los planes pasan en el agua y en la calle: remo y kayak por el río Calle-Calle, ferias fluviales, cervecerías artesanales, bici por la Isla Teja y mucha vida estudiantil.',
    zones: ['Isla Teja', 'Centro', 'Costanera', 'Barrios Bajos'],
    acts: ['🚣 Remo / Kayak', '🍺 Cervecería', '☕ Café', '🚴 Bici', '🛶 Paseo en bote', '⚽ Fútbol', '🎶 Música en vivo', '🥾 Trekking'],
    faqs: [
      ['¿Qué hacer en Valdivia para conocer gente?', 'Con Yoinn ves planes cerca: kayak en el Calle-Calle, juntas en cervecerías, café en la Isla Teja o bici por la costanera. Te unes con un tap y conoces gente real.'],
      ['¿Qué planes hay para estudiantes en Valdivia?', 'Valdivia es muy universitaria: tocatas, cervecerías, deportes y panoramas al río. En Yoinn filtras por interés y te sumas a lo que está pasando hoy.'],
      ['¿Yoinn funciona en Valdivia?', 'Sí. Abre el mapa y mira los yoinns activos en la ciudad y la Isla Teja.'],
    ],
  },
  {
    slug: 'osorno', name: 'Osorno', region: 'Región de Los Lagos',
    intro: 'Puerta de entrada a los volcanes y las termas del sur. Osorno mezcla tradición ganadera con naturaleza cercana: termas, trekking rumbo al volcán Osorno y al Puyehue, asados, pichangas y café para los días fríos.',
    zones: ['Centro', 'Rahue', 'Ovejería', 'Puyehue (cerca)'],
    acts: ['♨️ Termas', '🏔️ Trekking', '🥩 Asado', '⚽ Fútbol', '☕ Café', '🚴 Bici', '🎣 Pesca', '🏓 Pádel'],
    faqs: [
      ['¿Qué hacer en Osorno con gente nueva?', 'Con Yoinn te unes a planes reales: termas en Puyehue, trekking, pichangas, asados o café. Ves quiénes van y te sumas con un tap.'],
      ['¿Qué panoramas hay cerca de Osorno?', 'Las termas de Puyehue, senderos del Parque Nacional, el volcán Osorno y panoramas al lago Rupanco. Todo aparece como yoinns en la app.'],
      ['¿Yoinn está en Osorno?', 'Sí, Osorno es parte de nuestras ciudades del sur. Abre el mapa y mira lo que está pasando hoy.'],
    ],
  },
  {
    slug: 'concepcion', name: 'Concepción', region: 'Región del Biobío',
    intro: 'La cuna del rock chileno, universitaria y costera. En Concepción los planes sobran: tocatas y música en vivo, café en el Barrio Universitario, trekking al cerro Caracol, playa en Dichato y Lirquén, y pichangas por toda la ciudad.',
    zones: ['Barrio Universitario', 'Plaza Perú', 'Centro', 'Costa (Dichato, Lirquén)'],
    acts: ['🎸 Tocata', '☕ Café', '🏖️ Playa', '🏔️ Cerro Caracol', '⚽ Fútbol', '🍺 Bar', '🏓 Pádel', '🚴 Bici'],
    faqs: [
      ['¿Qué hacer en Concepción para conocer gente?', 'Con Yoinn ves planes cerca: tocatas, café en el Barrio U, trekking al cerro Caracol o playa en Dichato. Te unes con un tap y conoces gente real.'],
      ['¿Qué planes hay para universitarios en Concepción?', 'Conce es muy estudiantil: música en vivo, deportes, café y panoramas a la costa. En Yoinn filtras por interés y te sumas a lo de hoy.'],
      ['¿Yoinn funciona en Concepción?', 'Sí. Abre el mapa y mira los yoinns activos en Concepción y alrededores.'],
    ],
  },
  {
    slug: 'santiago', name: 'Santiago', region: 'Región Metropolitana',
    intro: 'La capital nunca para. En Santiago hay un plan para cada interés: trekking al San Cristóbal o al Cajón del Maipo, pádel, café de especialidad en Lastarria, carrete en Bellavista, bici por el Mapocho y panoramas culturales en cada comuna.',
    zones: ['Lastarria', 'Bellavista', 'Providencia', 'Ñuñoa', 'Cajón del Maipo (cerca)'],
    acts: ['🏔️ Trekking', '🏓 Pádel', '☕ Café especialidad', '🎉 Carrete', '🚴 Bici', '🎨 Arte', '🧘 Yoga', '🏃 Running'],
    faqs: [
      ['¿Qué hacer en Santiago para conocer gente nueva?', 'Con Yoinn ves planes reales por comuna: trekking al San Cristóbal, pádel, café en Lastarria o carrete en Bellavista. Te unes con un tap, sin que sea app de citas.'],
      ['¿Cómo hacer amigos en Santiago siendo adulto?', 'Yoinn está pensado justo para eso: planes presenciales por interés y cercanía, con gente verificada. Únete a actividades cerca tuyo y conoce gente con tus mismos gustos.'],
      ['¿Yoinn funciona en Santiago?', 'Sí. Abre el mapa y filtra por comuna para ver los yoinns activos cerca de ti.'],
    ],
  },
];

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function page(c) {
  const url = `${BASE}/${c.slug}/que-hacer`;
  const title = `Qué hacer en ${c.name} | Planes y gente nueva con Yoinn`;
  const desc = `Descubre qué hacer en ${c.name}: actividades y planes espontáneos para conocer gente real. ${c.acts.slice(0,4).map(a=>a.replace(/^\S+\s/,'')).join(', ')} y más. Únete con un tap. Gratis.`;

  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: c.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Yoinn', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: c.name, item: url },
    ],
  };

  const chips = c.acts.map((a, i) => {
    const cls = ['bg-ink-900 text-white', 'bg-cyan-500 text-white', 'bg-white text-ink-900 border-2 border-ink-900', 'bg-coral-500 text-white'][i % 4];
    return `<span class="inline-block ${cls} rounded-full px-5 py-2.5 font-bold text-sm md:text-base">${a}</span>`;
  }).join('\n        ');

  const faqHtml = c.faqs.map(([q, a]) => `
        <details class="group bg-white rounded-2xl px-6 py-5 border border-mint-200">
          <summary class="cursor-pointer font-bold text-lg text-ink-900 list-none flex justify-between items-center">${esc(q)}<span class="text-cyan-600 group-open:rotate-45 transition">+</span></summary>
          <p class="mt-3 text-ink-600 leading-relaxed">${esc(a)}</p>
        </details>`).join('\n');

  const storeBtns = `
        <a href="${APP_STORE}" class="flex items-center gap-3 bg-ink-900 text-white pl-5 pr-7 py-3.5 rounded-2xl hover:bg-ink-800 transition" aria-label="Descargar en App Store">
          <svg viewBox="0 0 24 24" class="w-7 h-7" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          <div class="text-left leading-tight"><div class="text-[10px] opacity-70 font-medium">Download on the</div><div class="text-lg font-bold">App Store</div></div>
        </a>
        <a href="${PLAY_STORE}" class="flex items-center gap-3 bg-ink-900 text-white pl-5 pr-7 py-3.5 rounded-2xl hover:bg-ink-800 transition" aria-label="Descargar en Google Play">
          <svg viewBox="0 0 24 24" class="w-7 h-7" fill="currentColor" aria-hidden="true"><path d="M3.6 1.6c-.4.3-.6.7-.6 1.3v18.2c0 .6.2 1 .6 1.3l10.7-10.4L3.6 1.6m12.1 11.7l2.6 2.5-12.4 7c-.4.2-.8.2-1.2 0l11-9.5m0-2.6L4.7.6c.4-.2.8-.2 1.2 0l12.4 7-2.6 2.5M19.4 8.7l3.4 1.9c.5.3.7.7.7 1.4 0 .7-.2 1.1-.7 1.4l-3.4 1.9-2.8-2.7 2.8-2.7"/></svg>
          <div class="text-left leading-tight"><div class="text-[10px] opacity-70 font-medium">Get it on</div><div class="text-lg font-bold">Google Play</div></div>
        </a>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="Qué hacer en ${esc(c.name)} — Yoinn" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${BASE}/1.png" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Yoinn" />
  <meta property="og:locale" content="es_CL" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" href="/assets/pin.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: {
      cyan: { 400:'#00E5FF',500:'#00BCD4',600:'#00ACC1',700:'#0097A7' },
      mint: { 50:'#F0FAFA',100:'#E0F4F4',200:'#C8ECEC',300:'#A8DEDE' },
      ink:  { 900:'#0A0E1A',800:'#141A2A',700:'#1A2332',600:'#2A3548',500:'#5A6B7E' },
      coral:{ 500:'#FF5E5B',600:'#E84743' },
      gold: { 400:'#FFD93B',500:'#E8B65A' } }, fontFamily:{ sans:['Poppins','system-ui','sans-serif'] } } } };
  </script>
  <style> body{font-family:'Poppins',system-ui,sans-serif;background:#E8F6F6;color:#0A0E1A} .display{font-weight:900;letter-spacing:-0.045em;line-height:0.95} </style>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head>
<body class="antialiased">
  <!-- NAV -->
  <nav class="max-w-6xl mx-auto px-5 md:px-10 py-6 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-black text-xl"><img src="/logo.png" alt="Yoinn" class="w-9 h-9 rounded-lg" /> Yoinn</a>
    <a href="/" class="text-sm font-semibold text-ink-600 hover:text-ink-900">← Inicio</a>
  </nav>

  <!-- HERO -->
  <header class="max-w-6xl mx-auto px-5 md:px-10 pt-10 pb-16">
    <p class="font-bold tracking-widest uppercase text-xs text-cyan-700 mb-4">${esc(c.region)}</p>
    <h1 class="display text-[clamp(40px,8vw,84px)] mb-6">Qué hacer en<br /><span style="background:linear-gradient(135deg,#00E5FF,#0097A7);-webkit-background-clip:text;background-clip:text;color:transparent">${esc(c.name)}</span></h1>
    <p class="text-xl text-ink-600 font-medium max-w-2xl leading-relaxed mb-8">${esc(c.intro)}</p>
    <div class="flex flex-wrap items-center gap-4">${storeBtns}
    </div>
  </header>

  <!-- ACTIVIDADES -->
  <section class="max-w-6xl mx-auto px-5 md:px-10 py-12">
    <h2 class="display text-[clamp(28px,5vw,48px)] mb-8">Está pasando en ${esc(c.name)}</h2>
    <div class="flex flex-wrap gap-3">
        ${chips}
    </div>
  </section>

  <!-- CONOCER GENTE -->
  <section class="max-w-6xl mx-auto px-5 md:px-10 py-12">
    <div class="bg-ink-900 text-white rounded-3xl p-8 md:p-14">
      <h2 class="display text-[clamp(26px,4.5vw,44px)] mb-5">Conoce gente real en ${esc(c.name)}</h2>
      <p class="text-lg text-mint-200 leading-relaxed max-w-2xl mb-4">Yoinn no es app de citas: es comunidad verificada. Abre el mapa, mira los planes activos cerca de ti —en ${c.zones.slice(0,3).join(', ')} y más— y únete con un tap. La gente correcta llega sola.</p>
      <ol class="text-mint-100 space-y-2 font-medium">
        <li>1. Explora lo que está pasando hoy a tu alrededor.</li>
        <li>2. Únete a un yoinn que te guste, o crea el tuyo en 30 segundos.</li>
        <li>3. Sal de la pantalla y conoce gente nueva en la vida real.</li>
      </ol>
    </div>
  </section>

  <!-- FAQ -->
  <section class="max-w-3xl mx-auto px-5 md:px-10 py-12">
    <h2 class="display text-[clamp(26px,4.5vw,44px)] mb-8">Preguntas frecuentes</h2>
    <div class="space-y-4">${faqHtml}
    </div>
  </section>

  <!-- CTA -->
  <section class="max-w-6xl mx-auto px-5 md:px-10 py-16 text-center">
    <h2 class="display text-[clamp(30px,6vw,60px)] mb-6">Tu ciudad te está esperando.</h2>
    <div class="flex flex-wrap items-center justify-center gap-4">${storeBtns}
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="max-w-6xl mx-auto px-5 md:px-10 py-12 border-t border-mint-200 flex flex-wrap items-center gap-6 text-sm text-ink-600">
    <a href="/" class="font-black text-ink-900">Yoinn</a>
    <a href="/safety" class="hover:text-ink-900">Seguridad</a>
    <a href="/privacy" class="hover:text-ink-900">Privacidad</a>
    <a href="/terms" class="hover:text-ink-900">Términos</a>
    <a href="mailto:letsgo@yoinn.cl" class="hover:text-ink-900">letsgo@yoinn.cl</a>
    <a href="https://instagram.com/yoinn_cl" rel="noopener" target="_blank" class="hover:text-ink-900">Instagram</a>
    <a href="https://tiktok.com/@yoinn" rel="noopener" target="_blank" class="hover:text-ink-900">TikTok</a>
  </footer>
</body>
</html>
`;
}

const pubDir = path.join(__dirname, '..', 'public');
let built = [];
for (const c of CITIES) {
  const dir = path.join(pubDir, c.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'que-hacer.html'), page(c), 'utf8');
  built.push(`${c.slug}/que-hacer`);
}

// Regenera sitemap.xml con home + páginas legales + ciudades
const staticUrls = [
  ['/', '1.0', 'weekly'], ['/anfitriones', '0.9', 'monthly'],
  ['/safety', '0.5', 'monthly'],
  ['/privacy', '0.3', 'yearly'], ['/terms', '0.3', 'yearly'],
];
const cityUrls = CITIES.map(c => [`/${c.slug}/que-hacer`, '0.8', 'weekly']);
const all = staticUrls.concat(cityUrls);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(([loc, pr, cf]) => `  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${cf}</changefreq>
    <priority>${pr}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(pubDir, 'sitemap.xml'), sitemap, 'utf8');

console.log('✅ Generadas ' + built.length + ' city pages:');
built.forEach(b => console.log('   /' + b));
console.log('✅ sitemap.xml actualizado con ' + all.length + ' URLs');
