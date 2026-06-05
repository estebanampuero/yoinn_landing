# Yoinn — Checklist de Growth & SEO
_Generado: 2026-06-04 · Landing: `yoinn_landing` · Proyecto Firebase: `yoinnapp` (compartido con la app, NO se toca)_

---

## ✅ PARTE A — Lo que ya quedó hecho en el código (solo falta que despliegues)

Todos estos cambios son de la **landing**. No tocan la app Flutter, ni Firestore (datos), ni reglas, ni la lógica de compartir links (`/activity/**`, `/invite/**`, `share.html`).

| # | Cambio | Archivo |
|---|--------|---------|
| 1 | `sitemap.xml` creado (antes daba 404 y el robots lo referenciaba) | `public/sitemap.xml` |
| 2 | `robots.txt`: bloquea indexación de interstitials de redirección (`/activity/`, `/invite/`); previews sociales intactas | `public/robots.txt` |
| 3 | `<head>`: canonical, Open Graph completo, Twitter Cards, JSON-LD (Organization + WebSite + MobileApplication) | `public/index.html` |
| 4 | `<title>` y meta description optimizados con keywords | `public/index.html` |
| 5 | Carrusel de galería conectado a actividades reales (con fallback a imágenes semilla → nunca queda vacío) | `public/index.html` |
| 6 | Función `recentActivities` (read-only, admin SDK) que expone actividades recientes curadas | `functions/index.js` |
| 7 | Rewrite `/api/recent-activities` → función | `firebase.json` |
| 8 | Handles sociales corregidos en footer (IG `yoinn_cl`, TikTok `@yoinn`) | `public/index.html` |

### 🚀 Comandos para desplegar (acotados, NO tocan la app)
```bash
cd ~/Development/yoinn_landing

# 1) Sitio estático (HTML, robots, sitemap)
firebase deploy --only hosting

# 2) Solo la función nueva (NO redeploya activitySSR)
firebase deploy --only functions:recentActivities
```
> Verifica luego: `https://yoinn.cl/api/recent-activities` debe responder JSON `{ "activities": [...] }`.

### ⚠️ Decisiones que debes confirmar tú
- [ ] **Privacidad del carrusel**: hoy muestra cualquier actividad reciente con foto. Si quieres mostrar **solo** actividades abiertas a todos, pon `REQUIRE_OPEN_TO_ALL = true` en `functions/index.js` (línea de constantes). Idealmente, avisa a los usuarios que sus fotos de actividad pueden aparecer en la web (consentimiento).
- [ ] **Handle de Instagram**: dejé `instagram.com/yoinn_cl`. Confirma que sea exacto (¿guion bajo o punto?).
- [x] **www vs no-www → RESUELTO**: se estandarizó todo a **`www.yoinn.cl`** (canonical, OG, sitemap, city pages) para alinear con Google (que ya lo eligió) y con tu app, cuyo `activitySSR` comparte links en `www`. Search Console: usa la propiedad `https://www.yoinn.cl`. Opcional a futuro: 301 de no-www → www en la consola de Firebase Hosting.

---

## 🔴 PARTE B — Hallazgos críticos de marca (acción tuya, no es código)

### 1. Colisión de marca "Yoinn / Yoin Club"
- `yoinclub.com` + app **YOIN CLUB** (App Store id `6737742081`) tiene un pitch casi idéntico al tuyo.
- **Implicancias de que esté "muerta" (no aparece en búsquedas / no carga):**
  - **Bueno para ti**: si está abandonada, no compite activamente por instalaciones ni reseñas. No te roba usuarios hoy.
  - **Riesgo latente**: sigue indexada y confunde a los LLMs (ChatGPT/Gemini mezclan "Yoinn" con "Yoin Club") y a usuarios que escuchan tu nombre y buscan. Una marca zombie con tu nombre diluye tu identidad de entidad.
  - **Riesgo de revival**: si el dueño la reactiva, tienes un competidor homónimo. Por eso registrar tu marca (ya lo hiciste ✅) es tu mejor defensa legal.
  - **Acción**: como ya tienes la marca en INAPI, si algún día colisiona comercialmente puedes ejercer tus derechos. Por ahora: **no la persigas**, pero **gana el SEO/GEO con tu contenido** para que "Yoinn" = tu app en Google y en los LLMs.
- [ ] Vigila trimestralmente si "Yoin Club" revive (búsqueda en stores).

### 2. "Yoins" (ropa) y otras `yoin*`
- Es una **tienda de ropa** sin relación. No te afecta salvo ruido en búsquedas genéricas de "yoin". **No requiere acción.** Tu "Yoinn" con doble-n + contexto Chile/actividades te diferencia.

### 3. Versión vieja de `www.yoinn.cl` ("clases deportivas") en Google
- Google aún cachea el título viejo. Se corrige con la reindexación (ver Parte C).
- [ ] Tras desplegar, fuerza reindexación en Search Console (URL Inspection → Request Indexing).

---

## 📋 PARTE C — SEO / GEO (acción tuya)

- [ ] Crear propiedad en **Google Search Console** + **Bing Webmaster Tools** y verificar `yoinn.cl`.
- [ ] Enviar `sitemap.xml` en Search Console.
- [ ] Forzar reindexación de la home (URL Inspection → Request Indexing) para matar el título viejo.
- [ ] Validar el JSON-LD en [Rich Results Test](https://search.google.com/test/rich-results).
- [ ] Validar el preview de compartir en [opengraph.xyz](https://www.opengraph.xyz/) (pega `yoinn.cl`).
- [ ] Crear una **imagen Open Graph dedicada 1200×630** (hoy uso `1.png`; idealmente una tarjeta diseñada).
- [x] **Landing pages por ciudad** ✅ HECHO — 6 páginas generadas en `public/<ciudad>/que-hacer.html` (Puerto Montt, Puerto Varas, Valdivia, Osorno, Concepción, Santiago), cada una con H1 local, contenido único, FAQ con schema `FAQPage`, BreadcrumbList, CTA y enlaces internos desde la home. Generador reutilizable en `scripts/build-city-pages.js` (agrega ciudades ahí y corre `node scripts/build-city-pages.js`).
- [ ] Página `/yoinn-que-es` canónica (desambigua la entidad para los LLMs).
- [ ] Crear perfiles de entidad consistentes: **LinkedIn (empresa), Crunchbase, Wikidata, Google Business Profile**. Siempre "Yoinn".
- [ ] Backlinks iniciales: El Llanquihue, Soy Puerto Montt, El Austral, medios universitarios (ULagos/UACh/UdeC), Product Hunt.

---

## 📱 PARTE D — Instagram Growth (acción tuya)

- [ ] **Conseguir @yoinn** (cuenta vacía con dueño): pide el handle vía el [formulario de Instagram de usuario inactivo](https://help.instagram.com/contact/723586364339719) (marca registrada ayuda — adjunta tu registro INAPI).
- [ ] Unificar handle en TODOS lados (web ✅, app, TikTok, firmas).
- [ ] Optimizar bio: `Conoce gente real en [ciudad] 📍 | Planes espontáneos hoy | No es app de citas` + link.
- [ ] Nombre del perfil (campo buscable): "Yoinn · Conocer gente en Chile".
- [ ] Highlights: Cómo funciona · Historias reales · Anfitriones · Próximos planes · Seguridad.
- [ ] Ritmo: 1 post/día + 3-5 reels/día.
- [ ] Pilar #1 de contenido: **historias reales** ("5 desconocidos terminaron carreteando"), NO features de la app.
- [ ] Carrusel semanal: "Panoramas en [ciudad] este fin de semana".
- [ ] Lo que hacen Bumble/Tinder/Meetup que tú no: memes de soledad adulta relatable, datos divertidos de tu propia app, mostrar eventos reales con caras.

---

## 🎬 PARTE E — TikTok Growth (acción tuya)

- [ ] Pilares: experimentos sociales callejeros · historias reales · FOMO en vivo · POV relatable · detrás de cámara de eventos.
- [ ] 3-5 reels/día (volumen + retención en los primeros 2 segundos).
- [ ] Banco de 100+ ideas: ver el memo de growth (sección 4) — sistema combinatorio `[actividad] × [ciudad] × [persona]`.
- [ ] Herramientas de edición rápida: CapCut / Submagic / Captions para subtítulos automáticos.

---

## 🤝 PARTE F — Las 3 prioridades de los próximos 30 días

1. [ ] **50 anfitriones activos en Puerto Montt** + sembrar 30 actividades reales (mata el "mapa vacío").
2. [ ] **3-5 reels diarios con historias reales** en TikTok + IG.
3. [ ] **Landing pages SEO por ciudad** ("Qué hacer en Puerto Montt", etc.).

> El principio que une todo: cada actividad real = (a) experiencia que retiene + (b) contenido que adquiere + (c) página que rankea.

---

## ⚙️ PARTE G — Automatizaciones n8n
- [x] **Workflow base creado** ✅ — esqueleto importable en `n8n/actividad-omnicanal.workflow.json` + guía en `docs/n8n-actividad-omnicanal.md`. Diseño por **polling** (consume `/api/recent-activities`), no toca la app.
- [ ] Importarlo en tu n8n, configurar credencial **Anthropic** y añadir nodos de salida (Supabase/Sheets para dedupe + Buffer/Metricool para publicar + Resend para newsletter).
- [ ] (Escala) Crear endpoint `recentActivitiesForContent` con más metadata (ciudad, fecha) para mejores captions.
