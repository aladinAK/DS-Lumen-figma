#!/usr/bin/env node
// build.mjs — tokens.json -> dist/tokens.css, dist/tailwind-theme.css,
// dist/figma-variables.json, dist/contrast-report.md
// Aucune dépendance. Node >= 18.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, 'dist')
mkdirSync(dist, { recursive: true })
const T = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'))

// ---------- résolution des références {a.b.c} ----------
const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), T)
const resolve = (v) => {
  if (typeof v !== 'string') return v
  const m = v.match(/^\{(.+)\}$/)
  if (!m) return v
  const r = get(m[1])
  if (r === undefined) throw new Error(`Référence introuvable: ${v}`)
  return resolve(r)
}

// ---------- couleur ----------
const hex2rgb = (h) => {
  h = h.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const rgb2hex = (rgb) =>
  '#' + rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')
const lum = (hex) => {
  const [r, g, b] = hex2rgb(hex).map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
// couleur `top` posée à l'opacité t sur `base`
const over = (top, base, t) => {
  const a = hex2rgb(top), b = hex2rgb(base)
  return rgb2hex(a.map((c, i) => c * t + b[i] * (1 - t)))
}
// plus petit t (pas de 0.01) tel que over(top, base, t) atteigne `target` contre tous les fonds `bgs`
const minAlpha = (top, base, bgs, target) => {
  for (let i = 1; i <= 100; i++) {
    const t = i / 100
    const c = over(top, base, t)
    if (bgs.every((bg) => ratio(c, bg) >= target)) return { t, color: c }
  }
  return null
}

// ---------- dérivation par thème ----------
const A = T.a11y
const themes = {}
const report = []
for (const [name, def] of Object.entries(T.theme)) {
  const th = {}
  for (const [k, v] of Object.entries(def)) {
    const r = Array.isArray(v) ? v : resolve(v) // une référence peut viser un dégradé (tableau)
    th[k] = Array.isArray(r) ? r.map(resolve) : r
  }
  // CTA primaire: couleur unie ou dégradé; ses arrêts servent au calcul de contraste
  th.ctaStops = Array.isArray(th.ctaBg) ? th.ctaBg : [th.ctaBg]
  const bgs = [th.bg, th.bgEdge].filter(Boolean) // pire cas sur un dégradé

  const mutedText = minAlpha(th.fg, th.bg, bgs, A.textRatio)
  const subtleText = minAlpha(th.fg, th.bg, bgs, A.largeTextRatio)
  const borderStrong = minAlpha(th.fg, th.bg, bgs, A.uiRatio)
  th.fgMuted = mutedText.color
  th.fgSubtle = subtleText.color
  th.borderStrong = borderStrong.color
  th.derived = {
    fgMuted: mutedText.t, fgSubtle: subtleText.t, borderStrong: borderStrong.t,
  }

  // texte de couleur accent-alt (ex: rubis sur parchemin): on le rapproche de fg jusqu'à AA
  let altText = th.accentAlt
  let altT = 0
  while (!bgs.every((bg) => ratio(altText, bg) >= A.textRatio) && altT < 1) {
    altT += 0.01
    altText = over(th.fg, th.accentAlt, altT)
  }
  th.accentAltText = altText
  th.derived.accentAltText = Number(altT.toFixed(2))

  // texte d'erreur: la couleur d'état est rapprochée de fg jusqu'à AA sur ce thème
  const errBase = resolve(T.state.error)
  let errText = errBase
  let errT = 0
  while (!bgs.every((bg) => ratio(errText, bg) >= A.textRatio) && errT < 1) {
    errT += 0.01
    errText = over(th.fg, errBase, errT)
  }
  th.errorText = errText
  th.derived.errorText = Number(errT.toFixed(2))

  // texte posé sur l'accent: bg si ça passe, sinon fg, sinon noir/blanc
  const candidates = [th.bg, th.fg, '#000000', '#ffffff']
  th.accentFg = candidates.find((c) => ratio(c, th.accent) >= A.textRatio) ?? candidates[0]

  th.focusRing = ratio(th.accent, th.bg) >= A.uiRatio ? th.accent : th.fg
  themes[name] = th

  // paires vérifiées
  const pairs = [
    ['fg / bg', th.fg, th.bg, A.textRatio],
    ['fgMuted / bg', th.fgMuted, th.bg, A.textRatio],
    ['fgSubtle / bg', th.fgSubtle, th.bg, A.largeTextRatio],
    ['accent / bg', th.accent, th.bg, A.uiRatio],
    ['accentFg / accent', th.accentFg, th.accent, A.textRatio],
    ['accentAltFg / accentAlt', th.accentAltFg, th.accentAlt, A.textRatio],
    ['accentAltText / bg', th.accentAltText, th.bg, A.textRatio],
    ['errorText / bg', th.errorText, th.bg, A.textRatio],
    ['borderStrong / bg', th.borderStrong, th.bg, A.uiRatio],
    ['focusRing / bg', th.focusRing, th.bg, A.uiRatio],
    ...th.ctaStops.map((stop) => ['ctaFg / ctaBg', th.ctaFg, stop, A.textRatio]),
  ]
  if (th.bgEdge) {
    pairs.push(['fg / bgEdge', th.fg, th.bgEdge, A.textRatio])
    pairs.push(['fgMuted / bgEdge', th.fgMuted, th.bgEdge, A.textRatio])
  }
  for (const [label, a, b, target] of pairs) {
    const r = ratio(a, b)
    report.push({ theme: name, label, a, b, r, target, ok: r >= target })
  }
}

// ---------- CSS ----------
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const px = (n) => `${n}px`
const lines = []
const L = (s = '') => lines.push(s)

L('/* GÉNÉRÉ par build.mjs depuis tokens.json — ne pas éditer à la main. */')
L(':root {')
L('  /* primitives */')
for (const [k, v] of Object.entries(T.primitive.color)) L(`  --ds-color-${k}: ${v};`)
for (const [k, v] of Object.entries(T.primitive.neutralRamp)) if (!k.startsWith('$')) L(`  --ds-neutral-${k}: ${v};`)
for (const [k, v] of Object.entries(T.primitive.alpha.white)) if (!k.startsWith('$')) L(`  --ds-white-a${k}: rgba(255,255,255,${v});`)
for (const [k, v] of Object.entries(T.primitive.alpha.black)) L(`  --ds-black-a${k}: rgba(0,0,0,${v});`)
L('  /* états & marque */')
L(`  --ds-state-success: ${resolve(T.state.success)};`)
L(`  --ds-state-error: ${resolve(T.state.error)};`)
L(`  --ds-brand-panel: ${resolve(T.brand.panel)};`)
L(`  --ds-brand-pair-dev: ${resolve(T.brand.pairDev)};`)
L('  /* typographie */')
for (const [k, v] of Object.entries(T.font.family)) L(`  --ds-font-${k}: ${v};`)
for (const [k, v] of Object.entries(T.font.weight)) L(`  --ds-weight-${k}: ${v};`)
for (const [k, v] of Object.entries(T.font.size)) if (!k.startsWith('$')) L(`  --ds-text-${k}: ${v / 16}rem; /* ${v}px */`)
for (const [k, v] of Object.entries(T.font.lineHeight)) L(`  --ds-leading-${k}: ${v};`)
for (const [k, v] of Object.entries(T.font.letterSpacing)) L(`  --ds-tracking-${k}: ${v};`)
for (const [k, v] of Object.entries(T.font.sizeFluid)) {
  if (k.startsWith('$')) continue
  L(`  --ds-text-${k}: ${v.base};`)
  if (v.md) L(`  --ds-text-${k}-md: ${v.md};`)
  if (v.lg) L(`  --ds-text-${k}-lg: ${v.lg};`)
}
L('  /* espacement (base 4px) */')
for (const [k, v] of Object.entries(T.space)) if (!k.startsWith('$')) L(`  --ds-space-${k}: ${px(v)};`)
L('  /* rayons, bordures, ombres */')
for (const [k, v] of Object.entries(T.radius)) L(`  --ds-radius-${k}: ${v};`)
for (const [k, v] of Object.entries(T.border)) L(`  --ds-border-${k}: ${v};`)
for (const [k, v] of Object.entries(T.shadow)) L(`  --ds-shadow-${k}: ${v};`)
L('  /* mouvement */')
for (const [k, v] of Object.entries(T.motion.ease)) L(`  --ds-ease-${k}: ${v};`)
for (const [k, v] of Object.entries(T.motion.duration)) L(`  --ds-dur-${k}: ${v}ms;`)
L('  /* focus */')
L(`  --ds-focus-width: ${T.focus.width};`)
L(`  --ds-focus-offset: ${T.focus.offset};`)
L('}')
L()

const themeBlock = (sel, th) => {
  L(`${sel} {`)
  L(`  --ds-bg: ${th.bg};`)
  if (th.bgEdge) L(`  --ds-bg-edge: ${th.bgEdge};`)
  L(`  --ds-fg: ${th.fg};`)
  L(`  --ds-fg-muted: ${th.fgMuted}; /* ${Math.round(th.derived.fgMuted * 100)}% de fg, AA */`)
  L(`  --ds-fg-subtle: ${th.fgSubtle}; /* ${Math.round(th.derived.fgSubtle * 100)}% de fg, grand texte seulement */`)
  L(`  --ds-accent: ${th.accent};`)
  L(`  --ds-accent-fg: ${th.accentFg};`)
  L(`  --ds-accent-alt: ${th.accentAlt};`)
  L(`  --ds-accent-alt-fg: ${th.accentAltFg};`)
  L(`  --ds-accent-alt-text: ${th.accentAltText};`)
  L(`  --ds-error-text: ${th.errorText}; /* couleur d'erreur lisible (AA) sur ce thème */`)
  L(`  --ds-muted: ${th.muted};`)
  L(`  --ds-border: ${th.muted};`)
  L(`  --ds-border-strong: ${th.borderStrong}; /* >= 3:1, bordures de contrôles */`)
  L(`  --ds-focus-ring: ${th.focusRing};`)
  L(`  --ds-btn-radius: ${th.btnRadius};`)
  if (th.gradient) L(`  --ds-gradient: linear-gradient(to right, ${th.gradient.join(', ')});`)
  if (th.gradientText) L(`  --ds-gradient-text: linear-gradient(to right, ${th.gradientText.join(', ')});`)
  L(`  --ds-font-kicker: var(--ds-font-${th.fontKicker});`)
  L(`  --ds-cta-bg: ${Array.isArray(th.ctaBg) ? `linear-gradient(to right, ${th.ctaBg.join(', ')})` : th.ctaBg};`)
  L(`  --ds-cta-fg: ${th.ctaFg};`)
  L(`  --ds-cta-glow: ${th.ctaGlow ? `0 0 30px color-mix(in srgb, ${th.ctaGlow} 25%, transparent)` : 'none'}; /* halo au survol du CTA */`)
  L('  color-scheme: ' + (lum(th.bg) < 0.18 ? 'dark' : 'light') + ';')
  L('}')
  L()
}
// thème par défaut = studio
themeBlock(':root, [data-theme="studio"]', themes.studio)
themeBlock('[data-theme="book"]', themes.book)
themeBlock('[data-theme="mood"]', themes.mood)

L('/* Focus visible global (WCAG 2.4.7 / 1.4.11) */')
L(':where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {')
L('  outline: var(--ds-focus-width) solid var(--ds-focus-ring);')
L('  outline-offset: var(--ds-focus-offset);')
L('}')
L()
L('/* Mouvement réduit (WCAG 2.3.3) */')
L('@media (prefers-reduced-motion: reduce) {')
L('  :root { --ds-dur-quick: 1ms; --ds-dur-fast: 1ms; --ds-dur-hover: 1ms; --ds-dur-base: 1ms; --ds-dur-slow: 1ms; }')
L('}')
writeFileSync(join(dist, 'tokens.css'), lines.join('\n') + '\n')

// ---------- Tailwind v4 ----------
const tw = []
const W = (s = '') => tw.push(s)
W('/* GÉNÉRÉ par build.mjs — à importer après @import "tailwindcss". */')
W('@theme inline {')
W('  --color-bg: var(--ds-bg);')
W('  --color-fg: var(--ds-fg);')
W('  --color-fg-muted: var(--ds-fg-muted);')
W('  --color-fg-subtle: var(--ds-fg-subtle);')
W('  --color-accent: var(--ds-accent);')
W('  --color-accent-fg: var(--ds-accent-fg);')
W('  --color-accent-alt: var(--ds-accent-alt);')
W('  --color-accent-alt-fg: var(--ds-accent-alt-fg);')
W('  --color-accent-alt-text: var(--ds-accent-alt-text);')
W('  --color-error-text: var(--ds-error-text);')
W('  --color-muted: var(--ds-muted);')
W('  --color-border: var(--ds-border);')
W('  --color-border-strong: var(--ds-border-strong);')
W('  --color-ring: var(--ds-focus-ring);')
W('  --color-success: var(--ds-state-success);')
W('  --color-error: var(--ds-state-error);')
W('  --font-sans: var(--ds-font-sans);')
W('  --font-mono: var(--ds-font-mono);')
W('  --font-serif-accent: var(--ds-font-serif-accent);')
W('  --font-typewriter: var(--ds-font-typewriter);')
W('  --font-fantasy: var(--ds-font-fantasy);')
W('  --font-display-mood: var(--ds-font-display-mood);')
for (const k of Object.keys(T.radius)) W(`  --radius-ds-${k}: var(--ds-radius-${k});`)
for (const k of Object.keys(T.shadow)) W(`  --shadow-ds-${k}: var(--ds-shadow-${k});`)
for (const k of Object.keys(T.motion.ease)) W(`  --ease-ds-${k}: var(--ds-ease-${k});`)
W('}')
writeFileSync(join(dist, 'tailwind-theme.css'), tw.join('\n') + '\n')

// ---------- Figma ----------
// Format maison consommé par un script use_figma: collections -> variables -> valeurs par mode.
const toRgba = (hex) => {
  const [r, g, b] = hex2rgb(hex)
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 }
}
const modes = Object.keys(themes)
const colorVars = {}
const colorKeys = ['bg', 'fg', 'fgMuted', 'fgSubtle', 'accent', 'accentFg', 'accentAlt', 'accentAltFg', 'accentAltText', 'errorText', 'muted', 'borderStrong', 'focusRing']
for (const key of colorKeys) {
  colorVars[`color/${kebab(key)}`] = Object.fromEntries(modes.map((m) => [themes[m].label, toRgba(themes[m][key])]))
}
const figma = {
  collections: {
    Primitives: {
      modes: ['Default'],
      variables: {
        ...Object.fromEntries(Object.entries(T.primitive.color).map(([k, v]) => [`color/${k}`, { type: 'COLOR', values: { Default: toRgba(v) } }])),
      },
    },
    Theme: {
      modes: modes.map((m) => themes[m].label),
      variables: Object.fromEntries(Object.entries(colorVars).map(([k, v]) => [k, { type: 'COLOR', values: v }])),
    },
    Scale: {
      modes: ['Default'],
      variables: {
        ...Object.fromEntries(Object.entries(T.space).filter(([k]) => !k.startsWith('$')).map(([k, v]) => [`space/${k}`, { type: 'FLOAT', values: { Default: v } }])),
        ...Object.fromEntries(Object.entries(T.radius).map(([k, v]) => [`radius/${k}`, { type: 'FLOAT', values: { Default: parseInt(v) } }])),
        ...Object.fromEntries(Object.entries(T.font.size).filter(([k]) => !k.startsWith('$')).map(([k, v]) => [`text/${k}`, { type: 'FLOAT', values: { Default: v } }])),
      },
    },
  },
  note: 'Les variables Theme sont résolues (hex) pour que les modes Figma correspondent exactement au CSS. Les alias vers Primitives sont ajoutés côté Figma à l’étape suivante.',
}
writeFileSync(join(dist, 'figma-variables.json'), JSON.stringify(figma, null, 2) + '\n')

// ---------- rapport ----------
const md = ['# Rapport de contraste', '', `Cibles: texte ${A.textRatio}:1 · grand texte ${A.largeTextRatio}:1 · UI ${A.uiRatio}:1.`, '']
for (const name of modes) {
  md.push(`## ${themes[name].label}`, '', '| Paire | Ratio | Cible | OK |', '|---|---|---|---|')
  for (const r of report.filter((x) => x.theme === name)) {
    md.push(`| ${r.label} (${r.a} sur ${r.b}) | ${r.r.toFixed(2)} | ${r.target} | ${r.ok ? 'oui' : '**NON**'} |`)
  }
  md.push('')
}
writeFileSync(join(dist, 'contrast-report.md'), md.join('\n'))

const failed = report.filter((r) => !r.ok)
console.log(`Thèmes: ${modes.join(', ')}`)
for (const name of modes) {
  const d = themes[name].derived
  console.log(`  ${name}: fgMuted=${themes[name].fgMuted} (${Math.round(d.fgMuted * 100)}%)  fgSubtle=${themes[name].fgSubtle} (${Math.round(d.fgSubtle * 100)}%)  borderStrong=${themes[name].borderStrong} (${Math.round(d.borderStrong * 100)}%)  accentAltText=${themes[name].accentAltText}  accentFg=${themes[name].accentFg}`)
}
console.log(`Paires vérifiées: ${report.length}, échecs: ${failed.length}`)
for (const f of failed) console.log(`  ECHEC ${f.theme} ${f.label}: ${f.r.toFixed(2)} < ${f.target}`)
process.exit(failed.length ? 1 : 0)
