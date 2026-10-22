# Lumen — design system (nom de travail)

Design system extrait de mon portfolio ([aladinakkari.ca](https://aladinakkari.ca), Next.js 16 + Tailwind 4) :
une source unique de jetons, un build sans dépendance qui produit CSS, Tailwind et variables Figma,
et une bibliothèque React accessible. Trois thèmes : **studio** (défaut), **book**, **mood**.

## La chaîne

```
tokens.json ──► build.mjs ──┬─► dist/tokens.css           variables CSS --ds-* + thèmes via [data-theme]
  (source)     (Node, 0 dép.)├─► dist/tailwind-theme.css   bloc @theme pour Tailwind v4
                            ├─► dist/figma-variables.json  variables Figma (Primitives, Theme / *, Scale)
                            └─► dist/contrast-report.md    ratios WCAG par thème
                                        │
                                        ▼
                         react/ (lumen-ds) : Button, ButtonLink, Input, Tag, Card
                                             + couche données : DataValue, Stat, DataTable, FilterChip
```

- `build.mjs` **calcule** les couleurs dérivées (`fg-muted`, `fg-subtle`, `border-strong`, `accent-alt-text`, `error-text`,
  `success-text`, `data-estimated`, `data-stale`) pour atteindre WCAG AA sur chaque thème, et **échoue** si une paire passe sous sa cible.
- Les composants ne consomment que les variables `--ds-*` ; changer de thème = changer `data-theme`.
- Couche données : une interface ne présente jamais une donnée avec plus de certitude qu'elle n'en a.
  Quatre états (vérifiée, estimée, périmée, manquante), jamais portés par la couleur seule, et « manquant » n'est jamais 0.
- Fichier Figma : [Lumen — Design System](https://www.figma.com/design/d4n8p0lYl7nA23p1Fr5H8i).
  Une collection de variables par thème (le plan Starter limite à 1 mode par collection).

## Commandes

Node 22 utilisé pour la vérification.

```bash
node build.mjs            # jetons seuls → dist/

cd react
npm install
npm run build             # jetons + tsc + copie des CSS → react/dist/
npm test                  # vitest + testing-library + jest-axe
npm run typecheck         # src/, test/ et playground/
npx vite                  # playground (après npm run build : il importe react/dist/tokens.css)
npm run build:playground  # playground statique → react/dist-playground/
```

## Déployer le playground (site statique)

Rien n'est déployé pour l'instant. Le build lit `tokens.json` et `build.mjs` à la racine : le dépôt entier doit être disponible.

- Commande : `npm run build:playground` (depuis `react/`, après `npm ci`), Node 22.
- Dossier de sortie : `react/dist-playground/` (séparé de `react/dist/`, réservé au package npm ; non versionné).

**Netlify** — `netlify.toml` à la racine fixe déjà `base = "react"`, la commande, `publish = "dist-playground"` et Node 22.
Importer le dépôt dans Netlify, sans autre réglage.

**Vercel** — importer le dépôt et choisir `react` comme *Root Directory*. `react/vercel.json` fixe la commande et le dossier de sortie.
Garder activée l'option qui inclut les fichiers hors du *Root Directory* pendant le build (nécessaire pour `../tokens.json`),
et choisir Node 22 dans les réglages du projet.

Les polices viennent de Google Fonts : le site déployé fait des requêtes vers `fonts.googleapis.com`.

Détails du package : [react/README.md](react/README.md).

## Ce qui est fait / pas fait

**Fait**
- `tokens.json` (valeurs issues d'un audit du portfolio) et `build.mjs` : 48 paires de contraste vérifiées, 0 échec.
- Jetons de la couche données : chiffres tabulaires et échelle dédiée (`--ds-num-*` : valeur, valeur secondaire, unité, libellé),
  couleurs d'état par thème (`--ds-data-*`, `--ds-success-text`), traitement non coloré de l'état estimé (pointillé).
- Package `lumen-ds` v0.1.0 : 9 composants (dont `DataValue`, `Stat`, `DataTable`, `FilterChip`), 50 tests
  (clavier, ARIA, axe, manquant ≠ 0, état jamais porté par la couleur seule, jetons générés, échec du build sous AA),
  typecheck (package et playground) et build verts. Sortie ESM importable directement par Node.
- Rendu vérifié sur les 3 thèmes ; playground Vite avec une page « Comparateur » (données fictives estimées, périmées
  et manquantes), capturée dans Chrome headless sur les 3 thèmes. Dans les colonnes numériques, le bord droit des valeurs
  et des tirets est identique au pixel (mesuré dans Chrome headless, 3 thèmes) : la place du bouton ⓘ est toujours réservée.
- Playground prêt pour un déploiement statique (Netlify, Vercel), non déployé.
- Figma : variables (Primitives, Theme / Studio, Theme / Book, Theme / Mood, Scale), 13+2 styles de texte,
  pages Foundations, Button (12 variantes), Input (4 états).

**Pas encore fait**
- Synchronisation automatique Figma ↔ code : les variables Figma ont été chargées une fois depuis
  `dist/figma-variables.json`, sans script de synchro.
- Tag et Card dans Figma.
- Couche données dans Figma : composants DataValue, Stat, DataTable, FilterChip, styles de texte des chiffres.
  Les nouvelles couleurs sont dans `dist/figma-variables.json` mais pas encore chargées dans le fichier Figma.
- Couche données : le toggletip de source s'ouvre toujours sous son bouton (pas de bascule en bord d'écran).
- `react/scripts/preview.tsx` n'inclut pas les composants de données.
- Figma en retard sur le code : le CTA primary par thème (rubis sur book, dégradé sur mood) et la police
  du kicker par thème ne sont pas encore reportés dans les variantes Button.
- Code Connect.
- Publication npm.
- Site de documentation.

**Décisions ouvertes**
- Nom du système : Lumen, Cadre ou Strate.
- Les 5 niveaux d'alpha blanc (8 / 15 / 30 / 50 / 70) : proposition à valider visuellement.
- Hauteur du bouton Outline (52px) : hypothèse.

Limite connue : jsdom n'a pas de mise en page, donc `jest-axe` ne vérifie pas les contrastes ; ils sont garantis par `build.mjs`.
