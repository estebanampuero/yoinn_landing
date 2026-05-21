# CLAUDE.md

Guía para Claude Code (y cualquier IA/colaborador) al trabajar en `yoinn_landing`.

## Deploy

```bash
firebase deploy --only hosting              # solo el sitio (public/)
firebase deploy --only functions            # solo Cloud Functions (activitySSR)
firebase deploy --only hosting,functions    # ambos
```

No hay build step. El sitio es HTML/CSS/JS vanilla servido directo desde `public/`. Los cambios surten efecto al terminar el deploy.

## Arquitectura

Landing single-file. Toda la marca + secciones + estilos + i18n viven en `public/index.html`. Tailwind se carga vía CDN (`cdn.tailwindcss.com`) con su `tailwind.config` inline. La lógica de i18n y scroll-reveal está embebida al final del mismo archivo.

```
public/
├── index.html         ← landing completa (Tailwind CDN + inline config + i18n + reveal)
├── share.html         ← fallback de deep link para /invite/* (autocontenido)
├── privacy.html       ← legales
├── safety.html        ← legales
├── terms.html         ← legales
├── robots.txt
├── 1.png              ← OG image (referenciada por share.html)
├── logo.png           ← logo usado por share.html
├── assets/            ← screenshots + pins usados por index.html
└── js/
    └── firebase.js    ← init Firebase Analytics + Firestore (importado por index.html)

functions/
└── index.js           ← Cloud Functions (activitySSR + otras)
```

> Histórico: el landing antes era un SPA modular (`js/app.js` + `components/{nav,hero,features,footer}.html`). Fue refactorizado a single-file y todos esos archivos se eliminaron. Si encuentras referencias a esa arquitectura en docs viejos, ignóralas.

## Tailwind

Config inline en `index.html` dentro del bloque `tailwind.config = {...}`. Tokens custom:

| Token | Valor |
|---|---|
| `brand-cyan` | `#00BCD4` |
| `brand-dark` | `#0F172A` |
| `brand-light` | `#F0F8FA` |
| `brand-accent` | `#38BDF8` |

Animaciones y keyframes también viven dentro del config inline.

## i18n

Implementado inline en `index.html`. Detección de idioma vía `navigator.language` (Spanish si empieza con `es`, sino English). El objeto `TRANSLATIONS` y las funciones `detectLang()` / `applyTranslations()` están al final del archivo.

- Texto plano: `data-i18n="key"` → setea `textContent`
- Texto con HTML (e.g. `<span>` adentro): `data-i18n-html="key"` → setea `innerHTML`

Para agregar/cambiar copy: editar el objeto `TRANSLATIONS` dentro de `index.html` (ambos `es` y `en`) y agregar el atributo correspondiente.

## Deep links & routing

Dos rutas especiales declaradas en `firebase.json`:

- `/activity/**` → Cloud Function `activitySSR` (region `southamerica-west1`) para SSR de share cards de actividades.
- `/invite/**` → sirve `share.html`, que intenta abrir `yoinn://activity/<id>` y cae a botones de App Store / Google Play.

`share.html` es autocontenido (estilos y JS inline, sin dependencias externas) y maneja la detección de iOS/Android, Instagram/Facebook in-app browser, y el `intent://` de Android.

## Apple App Site Association y Android App Links

`public/.well-known/apple-app-site-association` declara los dos Team IDs (`SZYY54G5X9` producción + `8XLNMJLVL5` desarrollo) y los patrones `/activity/*` y `/invite/*`. Incluye `webcredentials` para shared web credentials.

`public/.well-known/assetlinks.json` declara el SHA-256 del release certificate de `cl.yoinn.social`.

Ambos se sirven con `Content-Type: application/json` vía `firebase.json` headers.

## Firebase project

- **Project ID**: `yoinnapp`
- **Hosting domain**: `yoinnapp.web.app` / `yoinn.cl` / `www.yoinn.cl`
- **Region functions**: `southamerica-west1`
