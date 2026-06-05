# n8n · Workflow "Actividad → Contenido Omnicanal"

Convierte cada actividad de Yoinn en piezas de adquisición (post IG, hook TikTok, párrafo SEO, blurb newsletter) **sin tocar la app ni el proyecto sagrado `yoinnapp`**.

## Por qué polling y no trigger
Un trigger de Firestore exigiría desplegar una función dentro de `yoinnapp` (riesgo). En su lugar, n8n **consulta** el endpoint público read-only `https://yoinn.cl/api/recent-activities` cada X minutos y deduplica. Cero cambios en la app.

> Para generar buen contenido conviene más metadata (fecha, ciudad, host) de la que hoy expone `/api/recent-activities` (solo `img` + `label`). Tienes 2 opciones:
> 1. **Rápido**: usar `label` (título · lugar) tal cual — suficiente para captions.
> 2. **Mejor**: crear un endpoint hermano `recentActivitiesForContent` (mismo patrón admin SDK, protegido por un header secreto) que devuelva `title, city, dateTime, category`. Recomendado cuando escales.

## Arquitectura (nodos)

```
[Schedule Trigger 30min]
        │
[HTTP GET /api/recent-activities]
        │
[Split Out: activities]
        │
[Dedupe: ¿ya procesada?]  ──(ya vista)──▶ stop
        │ (nueva)
[HTTP POST Claude API]  → genera JSON: { ig_caption, tiktok_hook, seo_paragraph, newsletter_blurb }
        │
        ├──▶ [Google Sheets / Supabase]  (calendario de contenido, revisión humana)
        ├──▶ [Buffer / Metricool]        (programa el post IG — human-in-the-loop)
        └──▶ [Email / Resend]            (alimenta el digest semanal)
```

### Dedupe (estado)
n8n no tiene estado nativo simple. Opciones:
- **Supabase**: tabla `processed_activities(label text primary key, created_at timestamptz)`. Antes de generar, `SELECT`; si existe, saltar; si no, `INSERT`.
- **Google Sheets**: una hoja `procesadas` con la columna `label` y nodo "Remove Duplicates".

### Prompt para Claude (nodo HTTP → api.anthropic.com/v1/messages)
Modelo sugerido: `claude-sonnet-4-6` (buena relación calidad/costo para contenido).

```
Eres el community manager de Yoinn, app chilena para conocer gente real por actividades.
Tono: cercano, chileno neutro, emocional, anti-soledad. NO vendas features, vende la historia/sensación.

Actividad: "{{ $json.label }}"

Devuelve SOLO un JSON válido con:
{
  "ig_caption": "caption de Instagram (máx 150 palabras, 3-5 hashtags locales)",
  "tiktok_hook": "primer gancho de 1 frase para un reel (retención en 2s)",
  "seo_paragraph": "párrafo de 60-80 palabras para un artículo 'Qué hacer en <ciudad>' con la keyword natural",
  "newsletter_blurb": "2 frases para el digest semanal"
}
```
En el nodo HTTP de Claude usa `"response_format"` vía prompt (pide JSON) y luego un nodo **Code** para `JSON.parse` la respuesta (`$json.content[0].text`).

### Credenciales necesarias
- **Anthropic API key** (header `x-api-key`, `anthropic-version: 2023-06-01`).
- **Supabase** (URL + service key) o Google Sheets OAuth.
- **Buffer/Metricool** token (publicación IG/TikTok asistida — la API oficial de IG/TikTok no permite publicar reels 100% libre; usa estas capas).

## Importar
El archivo `n8n/actividad-omnicanal.workflow.json` es un esqueleto importable (Schedule → HTTP GET → Split → Claude → Set). Ajusta credenciales y añade los nodos de salida (Sheets/Buffer/Email) según tu cuenta.

## Siguiente nivel
- Workflow gemelo que genere un **artículo SEO completo** por ciudad semanalmente y lo publique (commit a este repo + redeploy hosting).
- Workflow de **auto-respuesta de DMs** (IG) con Claude + FAQ.
