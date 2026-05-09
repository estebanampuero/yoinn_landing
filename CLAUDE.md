# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deploy

```bash
firebase deploy --only hosting
```

There is no build step — the site is vanilla HTML/CSS/JS served directly from `public/`. Changes take effect immediately after deploy.

## Architecture

The landing page is a **component-loaded SPA** with no framework and no bundler.

`public/index.html` is a shell that contains the Tailwind CDN config (custom colors, animations, keyframes) and four empty mount points (`#nav-root`, `#hero-root`, `#features-root`, `#footer-root`). On load, `js/app.js` fetches all four HTML fragments in parallel, injects them into the DOM, then runs i18n and scroll-reveal.

```
js/app.js       ← orchestrator: loadComponent() + init sequence
js/i18n.js      ← TRANSLATIONS object (es/en), detectLang(), applyTranslations()
js/firebase.js  ← Firebase init (Analytics + Firestore)
css/styles.css  ← custom classes: .glass-card, .bento-card, .reveal, .bg-landscape, slider keyframes
components/     ← nav, hero, features, footer HTML fragments
```

Because `app.js` uses ES modules (`type="module"`), the site must be served over HTTP — opening `index.html` as a `file://` URL will fail (CORS on fetch). Use `firebase serve` or any local HTTP server to preview locally.

## Tailwind

The config lives inline in `index.html` (inside the `tailwind.config = {...}` script block). Custom tokens:

| Token | Value |
|---|---|
| `brand-cyan` | `#00BCD4` |
| `brand-dark` | `#0F172A` |
| `brand-light` | `#F0F8FA` |
| `brand-accent` | `#38BDF8` |

Custom animations (`float`, `float-delayed`, `float-slow`, `float-fast`, `float-reverse`, `float-jiggle`, `fade-in-up`, `pulse-glow`) and their keyframes are also defined there.

## i18n

All user-visible text is driven by `js/i18n.js`. Language is auto-detected via `navigator.language` (Spanish if starts with `es`, otherwise English).

- Plain text elements: `data-i18n="key"` → sets `textContent`
- Elements with HTML (e.g. `<span>` inside): `data-i18n-html="key"` → sets `innerHTML`

To add or change copy, edit the `TRANSLATIONS` object in `i18n.js` for both `es` and `en` keys, then add the corresponding `data-i18n` attribute to the HTML fragment.

## Background images

Images are not bundled; `app.js` sets them via CSS custom properties and inline styles after the DOM is ready:

- `.bg-landscape` → `background.png` (full-page fixed background)
- `--bg-1`, `--bg-2`, `--bg-3` → `1.png`, `2.png`, `3.png` (phone mockup auto-slider)

## Deep links & routing

Two special URL patterns are handled:

- `/activity/**` → Cloud Function `activitySSR` (region: `southamerica-west1`) for server-side rendering of activity share cards.
- `/invite/**` → serves `share.html`, which attempts to open the `yoinn://activity/<id>` custom URL scheme and falls back to App Store / Google Play buttons.

`share.html` is self-contained (no external CSS/JS dependencies) and handles both iOS and Android detection inline.

## Firebase project

Project ID: `yoinnapp`. Hosting domain: `yoinnapp.web.app` / `yoinn.cl`.
