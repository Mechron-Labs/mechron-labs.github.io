# mechron.ai

Institutional landing page for **Mechron** — a Physical AI company building
robotics-as-a-service. Static site (no build step), served by GitHub Pages on the
custom domain `mechron.ai` (see `CNAME`).

## Structure

```
index.html        One-page site (nav, hero, problem, model, moat, technology,
                  applications, vision, contact, footer). All copy is marked with
                  data-i18n="key" attributes.
style.css         Light theme + design system (CSS custom properties).
main.js           Sticky nav, mobile menu, reveal-on-scroll, hero background
                  (video with animated canvas fallback), i18n loader.
i18n/en.json      English copy — source of truth, mirrors the inline HTML.
assets/           Ink (near-black) logo variants for the light theme + hero video.
```

Light, industrial / blueprint aesthetic (warm paper + ink + a single burnt-orange
accent). The accent is the `--accent` CSS variable in `style.css` — change it in one
place, or set it to an ink tone for a fully monochrome look.

## Hero background video

The hero features a cinematic video panel (a dark stage that pops on the light page).
It currently shows an animated particle fallback. To use your own footage, drop the
files in:

```
assets/hero.mp4     (H.264, required)
assets/hero.webm    (VP9/AV1, optional but recommended — smaller, served first)
```

Keep it muted, short and seamlessly loopable. A dark / low-key clip reads best behind
the headline. `main.js` detects the video automatically, fades it in and stops the
canvas fallback — no code changes needed.

## Adding Portuguese (later)

Internationalization is already scaffolded:

1. Create `i18n/pt.json` with the same keys as `i18n/en.json`, translated.
2. In `index.html`, enable the `PT` button in the footer (remove `disabled`).

The language switch in the footer loads the chosen JSON and overrides every
`[data-i18n]` element — no HTML changes required. English ships inline so the page
still works with JavaScript disabled.

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```
