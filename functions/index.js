'use strict';

const {onRequest, onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const {logger}    = require('firebase-functions');
const admin       = require('firebase-admin');

admin.initializeApp();

// ─── Constants ───────────────────────────────────────────────────────────────

const APP_STORE_URL   = 'https://apps.apple.com/app/yoinn/id6756730755';
const PLAY_STORE_URL  = 'https://play.google.com/store/apps/details?id=cl.yoinn.social';
const DEFAULT_IMAGE   = 'https://www.yoinn.cl/1.png';
const LOGO_URL        = 'https://www.yoinn.cl/logo.png';
const BASE_URL        = 'https://www.yoinn.cl';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatActivityDesc(d, title) {
  const DAYS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  let parts = [];
  const ts = d.dateTime;
  if (ts && typeof ts.toDate === 'function') {
    const dt = ts.toDate();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    parts.push(`${DAYS[dt.getDay()]} ${dt.getDate()} de ${MONTHS[dt.getMonth()]} · ${hh}:${mm}`);
  }
  const loc = (d.location || '').trim();
  if (loc) parts.push(`📍 ${loc}`);
  return parts.length ? parts.join(' · ') : `Únete a ${title}. Descarga Yoinn para participar.`;
}

// ─── activitySSR ─────────────────────────────────────────────────────────────
//
// Serves a server-rendered HTML page for /activity/{id} with:
//   • Dynamic OG meta tags (title + image from Firestore) so WhatsApp / Telegram
//     / LinkedIn show a rich preview card instead of a bare link.
//   • Smart JS redirect that handles every scenario:
//       - App installed, real browser (Safari/Chrome) → intent:// / custom scheme opens app
//       - App installed, Instagram/Facebook IAB       → manual UI (IABs block Universal Links)
//       - App not installed, any browser              → App Store / Google Play
//   • Android uses intent:// which includes a Play Store fallback natively.
//   • iOS uses the yoinn:// custom scheme + visibilitychange guard to detect
//     whether the app actually opened before falling back to the App Store.
//
exports.activitySSR = onRequest(
  { region: 'southamerica-west1' },
  async (req, res) => {

    // Extract activityId from path: /activity/{activityId}
    const segments    = req.path.replace(/^\/+/, '').split('/').filter(Boolean);
    const activityId  = segments[segments.length - 1];

    if (!activityId || activityId === 'activity') {
      res.redirect(302, BASE_URL);
      return;
    }

    // ── Fetch activity data from Firestore ──────────────────────────────────
    let ogTitle   = 'Te invitaron a un Yoinn 🎉';
    let ogDesc    = 'Únete a esta actividad presencial. Descarga Yoinn para participar.';
    let ogImage   = DEFAULT_IMAGE;

    try {
      const doc = await admin.firestore()
        .collection('activities')
        .doc(activityId)
        .get();

      if (doc.exists) {
        const d    = doc.data();
        const name = (d.title || '').trim();
        const host = (d.hostName || '').trim();

        if (name)  ogTitle = name;
        ogDesc = formatActivityDesc(d, ogTitle);

        const gallery = Array.isArray(d.galleryUrls) ? d.galleryUrls : [];
        if (gallery.length > 0)    ogImage = gallery[0];
        else if (d.imageUrl)       ogImage = d.imageUrl;
      }
    } catch (err) {
      logger.error('Firestore fetch error', { activityId, err });
    }

    // ── URLs ─────────────────────────────────────────────────────────────────
    const canonicalUrl  = `${BASE_URL}/activity/${activityId}`;
    const customScheme  = `yoinn://activity/${activityId}`;
    // intent:// URI: Android opens the app if installed, otherwise falls back
    // to Play Store automatically — no extra JS needed on Android.
    // intent:// URI spec: the fragment separator # is NOT preceded by a
    // semicolon — it's part of the URI, not a parameter. Items after #Intent
    // are semicolon-separated. Joining the whole array with ; would produce
    // "...activityId;#Intent" which Android cannot parse.
    const intentUrl =
      `intent://activity/${activityId}` +
      `#Intent;scheme=yoinn;package=cl.yoinn.social` +
      `;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

    const safeTitle = escHtml(ogTitle);
    const safeDesc  = escHtml(ogDesc);

    // ── HTML ─────────────────────────────────────────────────────────────────
    const html = /* html */`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} — Yoinn</title>

  <!-- Open Graph ─ WhatsApp, Telegram, LinkedIn, Facebook, iMessage -->
  <meta property="fb:app_id"      content="1001499332451031">
  <meta property="og:title"       content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image"       content="${ogImage}">
  <meta property="og:url"         content="${canonicalUrl}">
  <meta property="og:type"        content="website">
  <meta property="og:site_name"   content="Yoinn">

  <!-- Twitter / X card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image"       content="${ogImage}">

  <!-- Safari Smart App Banner (shown in real Safari; ignored in IABs) -->
  <meta name="apple-itunes-app"
        content="app-id=6756730755, app-argument=${customScheme}">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0D0D0D;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    /* Ambient glow blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.15;
      pointer-events: none;
    }
    .blob-1 { width: 380px; height: 380px; background: #00BCD4; top: -100px; left: -100px; }
    .blob-2 { width: 300px; height: 300px; background: #7B2FBE; bottom: -80px;  right: -80px;  }

    /* Glass card */
    .card {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 28px;
      padding: 44px 32px 36px;
      width: 340px;
      max-width: 92vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .logo {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      margin-bottom: 20px;
      box-shadow: 0 4px 24px rgba(0,188,212,0.30);
    }

    h1 {
      color: #fff;
      font-size: 19px;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 10px;
      letter-spacing: -0.3px;
    }

    .subtitle {
      color: rgba(255,255,255,0.50);
      font-size: 14px;
      line-height: 1.55;
      margin-bottom: 30px;
    }

    /* Primary CTA */
    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 15px 20px;
      background: linear-gradient(135deg, #00E5FF 0%, #0097A7 100%);
      color: #000;
      font-size: 15px;
      font-weight: 700;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      margin-bottom: 12px;
      box-shadow: 0 0 24px rgba(0,188,212,0.35);
      transition: opacity 0.15s;
    }
    .btn-primary:active { opacity: 0.85; }

    /* Secondary store button */
    .btn-store {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 13px 20px;
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.65);
      font-size: 14px;
      font-weight: 500;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      margin-bottom: 10px;
      transition: background 0.15s;
    }
    .btn-store:active { background: rgba(255,255,255,0.12); }

    /* IAB warning banner */
    .iab-banner {
      background: rgba(0,188,212,0.12);
      border: 1px solid rgba(0,188,212,0.28);
      border-radius: 12px;
      padding: 12px 16px;
      color: rgba(255,255,255,0.75);
      font-size: 13px;
      line-height: 1.55;
      margin-bottom: 22px;
      width: 100%;
      text-align: left;
    }
    .iab-banner strong { color: #00E5FF; }

    /* Loading spinner */
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(0,188,212,0.18);
      border-top-color: #00BCD4;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin-bottom: 22px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    #view-loading { display: flex; flex-direction: column; align-items: center; }
    #view-manual  { display: none;  flex-direction: column; align-items: center; width: 100%; }
  </style>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>

  <div class="card">
    <img class="logo" src="${LOGO_URL}" alt="Yoinn"
         onerror="this.style.display='none'">

    <!-- Loading view (shown while redirect attempt is in flight) -->
    <div id="view-loading">
      <div class="spinner"></div>
      <h1>${safeTitle}</h1>
      <p class="subtitle">Abriendo en Yoinn…</p>
    </div>

    <!-- Manual view (shown after failed redirect, or immediately in IABs) -->
    <div id="view-manual">
      <div id="iab-banner" class="iab-banner" style="display:none">
        <strong>Para abrir Yoinn</strong>, toca los <strong>3 puntos ···</strong>
        arriba y elige <strong>"Abrir en Safari"</strong> o
        <strong>"Abrir en Chrome"</strong>.
      </div>
      <h1>${safeTitle}</h1>
      <p class="subtitle">Descarga Yoinn y únete a esta actividad</p>
      <a id="btn-open"  class="btn-primary" href="#">Abrir en Yoinn</a>
      <a id="btn-ios"   class="btn-store"   href="${APP_STORE_URL}"
         style="display:none">⬇ Descargar en App Store</a>
      <a id="btn-and"   class="btn-store"   href="${PLAY_STORE_URL}"
         style="display:none">⬇ Descargar en Google Play</a>
    </div>
  </div>

  <script>
    (function () {
      var ua          = navigator.userAgent;
      var isIOS       = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      var isAndroid   = /Android/.test(ua);
      var isInstagram = /Instagram/.test(ua);
      var isFacebook  = /FBAN|FBAV/.test(ua);
      var isInAppBrowser = isInstagram || isFacebook;

      var customScheme = '${customScheme}';
      var intentUrl    = '${intentUrl}';

      function showManual() {
        document.getElementById('view-loading').style.display = 'none';
        document.getElementById('view-manual').style.display  = 'flex';
        if (isInAppBrowser) {
          document.getElementById('iab-banner').style.display = 'block';
        }
        if (isIOS)     document.getElementById('btn-ios').style.display = 'flex';
        if (isAndroid) document.getElementById('btn-and').style.display = 'flex';
        // Set "Abrir en Yoinn" href to the best available scheme
        document.getElementById('btn-open').href =
          isAndroid ? intentUrl : customScheme;
      }

      function tryRedirect() {
        if (isAndroid) {
          // intent:// is handled by Android's intent resolution — if the app is
          // installed it opens directly; if not, the browser_fallback_url fires.
          // We still show the manual UI after a short wait in case neither happens
          // (e.g. Samsung Internet blocking intents).
          window.location.href = intentUrl;
          setTimeout(showManual, 2500);

        } else if (isIOS) {
          // Use the visibilitychange event as a proxy for "app opened":
          // when the app takes focus the tab goes hidden → appOpened = true.
          var appOpened = false;
          document.addEventListener('visibilitychange', function () {
            if (document.hidden) appOpened = true;
          });
          window.addEventListener('pagehide', function () { appOpened = true; });

          window.location.href = customScheme;
          setTimeout(function () {
            if (!appOpened) showManual();
          }, 2500);

        } else {
          // Desktop — just show download options
          showManual();
        }
      }

      if (isInAppBrowser) {
        // Universal Links / App Links do NOT fire inside Instagram/Facebook IABs.
        // Show the manual UI immediately so the user gets clear instructions.
        showManual();
      } else {
        tryRedirect();
      }
    })();
  </script>
</body>
</html>`;

    // No caching — activity data changes; bots re-fetch each time for fresh OG.
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  });

// ─── recentActivities ─────────────────────────────────────────────────────────
//
// READ-ONLY endpoint that feeds the public landing gallery. Returns a curated
// JSON list of recent activities (only an image + a short label) so the homepage
// carousel shows real Yoinn moments instead of stock photos.
//
//   • Uses the Admin SDK → bypasses the authenticated-only Firestore rules
//     WITHOUT exposing the full collection (we only emit img + label).
//   • Never writes. Never mutates. Does not touch the app or other functions.
//   • Ordered by dateTime desc → includes PAST activities so the carousel stays
//     full even when little is happening (per product requirement).
//   • Cached 10 min at the edge to keep Firestore reads (and cost) low.
//
const RECENT_LIMIT        = 18;     // max cards returned to the landing
const RECENT_SCAN         = 60;     // how many recent docs to scan for images
const REQUIRE_OPEN_TO_ALL = false;  // ⚠️ set true to only surface activities open to everyone (privacy)

exports.recentActivities = onRequest(
  { region: 'southamerica-west1', cors: true },
  async (req, res) => {
    res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.set('Content-Type', 'application/json; charset=utf-8');

    try {
      const snap = await admin.firestore()
        .collection('activities')
        .orderBy('dateTime', 'desc')
        .limit(RECENT_SCAN)
        .get();

      const out = [];
      for (const doc of snap.docs) {
        const d = doc.data();
        if (REQUIRE_OPEN_TO_ALL && d.isOpenToAll !== true) continue;

        const gallery = Array.isArray(d.galleryUrls) ? d.galleryUrls : [];
        const img     = gallery.length ? gallery[0] : (d.imageUrl || '');
        const title   = (d.title || '').trim();
        if (!img || !title) continue; // only cards that look good

        const loc = (d.location || '').split(',')[0].trim().slice(0, 22);
        out.push({ img, label: loc ? `${title} · ${loc}` : title });
        if (out.length >= RECENT_LIMIT) break;
      }

      res.status(200).json({ activities: out });
    } catch (err) {
      logger.error('recentActivities error', err);
      res.status(200).json({ activities: [] }); // fail soft → landing keeps seed gallery
    }
  });

// ─── submitHostApplication ────────────────────────────────────────────────────
//
// Recibe las postulaciones del formulario público /anfitriones y las guarda en
// la colección `host_applications` (NUEVA, no toca datos existentes) para que las
// revises desde tu admin-web. Solo escribe en esa colección.
//
exports.submitHostApplication = onRequest(
  { region: 'southamerica-west1', cors: true },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
    try {
      const b = req.body || {};
      const clean = (v, n) => String(v ?? '').trim().slice(0, n);
      const name      = clean(b.name, 80);
      const instagram = clean(b.instagram, 50).replace(/^@+/, '');
      const city      = clean(b.city, 40);
      const organizes = Array.isArray(b.organizes) ? b.organizes.slice(0, 12).map(s => clean(s, 30)) : [];
      const communitySize = clean(b.communitySize, 30);
      const frequency     = clean(b.frequency, 30);
      const hasApp        = b.hasApp === true || b.hasApp === 'true';
      const email         = clean(b.email, 120);

      if (!name || !instagram || !city) { res.status(400).json({ ok: false, error: 'missing' }); return; }

      await admin.firestore().collection('host_applications').add({
        name, instagram, city, organizes, communitySize, frequency, hasApp, email,
        status: 'nuevo',                 // nuevo → revisado → aprobado → activado → contactado
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'landing/anfitriones',
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error('submitHostApplication error', err);
      res.status(500).json({ ok: false, error: 'server' });
    }
  });

// ─── Admin: revisión de postulaciones de anfitriones ──────────────────────────
//
// host_applications es una colección nueva sin reglas Firestore (default deny),
// así que el admin-web la lee/escribe SOLO a través de estas funciones onCall,
// que verifican que quien llama sea admin. No tocan reglas ni datos de la app.

async function _assertAdmin(request) {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login requerido');
  const snap = await admin.firestore().collection('users').doc(uid).get();
  if (!snap.exists || snap.data().isAdmin !== true) {
    throw new HttpsError('permission-denied', 'Solo administradores');
  }
  return uid;
}

exports.listHostApplications = onCall({ region: 'southamerica-west1' }, async (request) => {
  await _assertAdmin(request);
  const db = admin.firestore();
  const snap = await db.collection('host_applications').orderBy('createdAt', 'desc').limit(300).get();

  const out = [];
  for (const doc of snap.docs) {
    const d = doc.data();

    // Match con el usuario por instagramHandle (exacto, con y sin @)
    let matched = null;
    const ig = (d.instagram || '').trim();
    if (ig) {
      let uq = await db.collection('users').where('instagramHandle', '==', ig).limit(1).get();
      if (uq.empty) uq = await db.collection('users').where('instagramHandle', '==', '@' + ig).limit(1).get();
      if (!uq.empty) {
        const ud = uq.docs[0].data();
        matched = {
          uid: uq.docs[0].id,
          name: ud.name || '',
          activitiesCreatedCount: ud.activitiesCreatedCount || 0,
          isOrganization: ud.isOrganization === true,
          isPro: ud.isManualPro === true || ud.isPremium === true,
        };
      }
    }

    out.push({
      id: doc.id,
      name: d.name || '', instagram: d.instagram || '', city: d.city || '',
      organizes: Array.isArray(d.organizes) ? d.organizes : [],
      communitySize: d.communitySize || '', frequency: d.frequency || '',
      hasApp: d.hasApp === true, email: d.email || '',
      status: d.status || 'nuevo',
      createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null,
      matched,
    });
  }
  return { applications: out };
});

exports.setHostApplicationStatus = onCall({ region: 'southamerica-west1' }, async (request) => {
  await _assertAdmin(request);
  const { applicationId, status } = request.data || {};
  const allowed = ['nuevo', 'revisado', 'aprobado', 'rechazado', 'activado', 'contactado'];
  if (!applicationId || !allowed.includes(status)) {
    throw new HttpsError('invalid-argument', 'applicationId y status válido requeridos');
  }
  await admin.firestore().collection('host_applications').doc(applicationId).update({
    status,
    statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

// ─── Email de activación de Súper-Anfitrión (Resend) ──────────────────────────
//
// Envía el correo "ya eres Súper-Anfitrión" desde letsgo@yoinn.cl vía Resend.
// Requiere que el dominio yoinn.cl esté verificado en Resend (registros DNS) y
// el secret RESEND_API_KEY. Es best-effort: si falla, la activación + push igual
// quedan hechas.
exports.sendSuperHostEmail = onCall(
  { region: 'southamerica-west1', secrets: [RESEND_API_KEY] },
  async (request) => {
    await _assertAdmin(request);
    const { applicationId } = request.data || {};
    if (!applicationId) throw new HttpsError('invalid-argument', 'applicationId requerido');

    const db = admin.firestore();
    const snap = await db.collection('host_applications').doc(applicationId).get();
    if (!snap.exists) throw new HttpsError('not-found', 'Postulación no existe');

    const d  = snap.data();
    const to = (d.email || '').trim();
    if (!to) return { ok: false, skipped: 'sin-email' };
    const name = (d.name || '').trim().split(' ')[0] || 'crack';

    const html = `<!DOCTYPE html><html><body style="margin:0;background:#E8F6F6;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border-radius:24px;padding:36px 28px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🟡</div>
      <h1 style="font-size:26px;color:#0A0E1A;margin:0 0 12px">¡Ya eres Súper-Anfitrión, ${escHtml(name)}!</h1>
      <p style="font-size:16px;color:#2A3548;line-height:1.6;margin:0 0 24px">
        Activamos tu cuenta en Yoinn. Ahora tienes:
      </p>
      <div style="text-align:left;background:#F0FAFA;border-radius:16px;padding:18px 20px;margin-bottom:24px">
        <p style="margin:0 0 10px;color:#0A0E1A;font-size:15px"><strong>🟡 Insignia dorada</strong> — destacas en el mapa y en cada actividad.</p>
        <p style="margin:0 0 10px;color:#0A0E1A;font-size:15px"><strong>♾️ Yoinn Pro de por vida</strong> — gratis, para siempre.</p>
        <p style="margin:0;color:#0A0E1A;font-size:15px"><strong>🚀 Acceso exclusivo</strong> — eventos y novedades antes que nadie.</p>
      </div>
      <p style="font-size:16px;color:#2A3548;line-height:1.6;margin:0 0 24px">
        Abre la app y crea tu primera actividad. Tu ciudad te está esperando.
      </p>
      <a href="https://www.yoinn.cl/" style="display:inline-block;background:#0A0E1A;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:14px">Abrir Yoinn →</a>
      <p style="font-size:12px;color:#5A6B7E;margin:28px 0 0">Yoinn · El antídoto contra la soledad moderna · Hecho en Chile 🇨🇱</p>
    </div>
  </div>
</body></html>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Yoinn <letsgo@yoinn.cl>',
        to: [to],
        subject: '🟡 ¡Ya eres Súper-Anfitrión de Yoinn!',
        html,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      logger.error('resend send error', t);
      throw new HttpsError('internal', `Resend ${resp.status}: ${t.slice(0, 180)}`);
    }

    await db.collection('host_applications').doc(applicationId).update({
      emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
  });
