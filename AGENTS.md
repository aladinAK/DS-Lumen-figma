# Contexte — Lumen DS (nom de travail)

Design system extrait du portfolio aladinakkari.ca, préparé pour une candidature « Design Engineer » chez Cohere
(design system Waypoint : bibliothèque Figma, composants npm, pipeline de jetons Figma ↔ CSS/Tailwind, WCAG,
design system lisible par des modèles d'IA). Dépôt public : ne jamais y mettre de secret ni d'info personnelle.

## Règle d'honnêteté
Ne rien annoncer qui n'est pas réellement fait ou vérifié. README et CHANGELOG doivent rester fidèles à l'état réel :
toute nouvelle affirmation (tests, contraste, Figma) s'appuie sur une commande lancée ou un fichier lu.

## Structure
- `tokens.json` — source unique des jetons. Thèmes : studio (défaut), book, mood.
- `build.mjs` — Node, sans dépendance. Génère `dist/tokens.css`, `dist/tailwind-theme.css`,
  `dist/figma-variables.json`, `dist/contrast-report.md`. Calcule fg-muted, fg-subtle, border-strong,
  accent-alt-text, error-text pour WCAG AA par thème ; exit 1 si une paire échoue.
- `react/` — package `lumen-ds` v0.1.0. Composants dans `src/` (Button, ButtonLink, Input, Tag, Card),
  CSS `src/styles.css` préfixe `.lm-`, variables `--ds-*`. Tests dans `test/` (vitest, testing-library, jest-axe).
  Playground dans `playground/`, config `vite.config.ts` (root: playground).
- `react/scripts/preview.tsx` — génère `preview.html` (3 thèmes). Aucun runner installé (pas de tsx).
- Imports relatifs de `react/src` : toujours avec extension `.js` (ESM Node pur dans `dist/`).
- `dist/` et `react/dist/` : générés, non versionnés.

## Direction
Lumen suit l'identité visuelle du portfolio (CTA, polices, survols, durées). Exception : les corrections
d'accessibilité de Lumen (anneau de focus, contrastes calculés, bordures de contrôle >= 3:1) sont gardées.

## Commandes (depuis `react/`)
```bash
npm install
npm test            # 19 tests
npm run typecheck
npm run build       # node ../build.mjs + tsc + copie CSS
node -e "import('./dist/index.js').then(m => console.log(Object.keys(m)))"
npx vite            # playground ; nécessite npm run build avant (importe ../dist/tokens.css)
```

## Figma
Fichier « Lumen — Design System », clé `d4n8p0lYl7nA23p1Fr5H8i`.
Collections : Primitives, Theme / Studio, Theme / Book, Theme / Mood (1 mode par collection, plan Starter), Scale.
13+2 styles de texte ; pages Foundations, Button (12 variantes), Input (4 états).
Tag et Card absents. Quota MCP Figma (20 appels/mois, Starter) : l'économiser.

## Pas encore fait
Synchro auto Figma ↔ code (variables chargées une fois depuis `dist/figma-variables.json`), Code Connect,
publication npm, site de documentation, Tag/Card dans Figma.

## Décisions ouvertes — ne pas trancher sans demander
- Nom du système : Lumen, Cadre ou Strate.
- 5 niveaux d'alpha blanc 8/15/30/50/70 (à valider visuellement).
- Hauteur du bouton Outline : 52px (hypothèse).
