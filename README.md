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
```

- `build.mjs` **calcule** les couleurs dérivées (`fg-muted`, `fg-subtle`, `border-strong`, `accent-alt-text`, `error-text`)
  pour atteindre WCAG AA sur chaque thème, et **échoue** si une paire passe sous sa cible.
- Les composants ne consomment que les variables `--ds-*` ; changer de thème = changer `data-theme`.
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
npm run typecheck
npx vite                  # playground (après npm run build : il importe react/dist/tokens.css)
```

Détails du package : [react/README.md](react/README.md).

## Ce qui est fait / pas fait

**Fait**
- `tokens.json` (valeurs issues d'un audit du portfolio) et `build.mjs` : 32 paires de contraste vérifiées, 0 échec.
- Package `lumen-ds` v0.1.0 : 5 composants, 15 tests (clavier, ARIA, axe), typecheck et build verts.
  Sortie ESM importable directement par Node.
- Rendu vérifié sur les 3 thèmes ; playground Vite.
- Figma : variables (Primitives, Theme / Studio, Theme / Book, Theme / Mood, Scale), 13+2 styles de texte,
  pages Foundations, Button (12 variantes), Input (4 états).

**Pas encore fait**
- Synchronisation automatique Figma ↔ code : les variables Figma ont été chargées une fois depuis
  `dist/figma-variables.json`, sans script de synchro.
- Tag et Card dans Figma.
- Code Connect.
- Publication npm.
- Site de documentation.

**Décisions ouvertes**
- Nom du système : Lumen, Cadre ou Strate.
- Les 5 niveaux d'alpha blanc (8 / 15 / 30 / 50 / 70) : proposition à valider visuellement.
- Hauteur du bouton Outline (52px) : hypothèse.

Limite connue : jsdom n'a pas de mise en page, donc `jest-axe` ne vérifie pas les contrastes ; ils sont garantis par `build.mjs`.
