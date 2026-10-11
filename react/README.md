# lumen-ds (nom de travail)

Design system React/TypeScript construit autour de **jetons de design** (`tokens.json`) et d'une accessibilité vérifiée.
Trois thèmes: **Studio** (sombre, accent lime), **Book** (parchemin) et **Mood** (bleu nuit).

## Chaîne design → code

```
tokens.json ──build.mjs──► dist/tokens.css          variables CSS (--ds-*) + thèmes + focus visible
                       ├─► dist/tailwind-theme.css  bloc @theme pour Tailwind v4
                       ├─► dist/figma-variables.json variables Figma (chargées dans le fichier Figma)
                       └─► dist/contrast-report.md  ratio WCAG de chaque paire (le build échoue si une paire passe sous la cible)
```

Les couleurs de texte atténué, de bordure de contrôle, d'erreur et d'accent-alt en texte sont **calculées** pour respecter
WCAG AA sur chaque thème. Exemple: `#ff6568` est lisible sur Studio et Mood, mais pas sur le parchemin (≈2,2:1);
le thème Book utilise donc `#9a4446` (4,61:1).

## Utilisation

```tsx
import 'lumen-ds/tokens.css'
import 'lumen-ds/styles.css'
import { Button, Input, Tag, Card } from 'lumen-ds'

<section data-theme="book">            {/* studio (défaut) | book | mood */}
  <Input label="Courriel" help="Nous ne partageons jamais ton adresse." />
  <Button variant="outline">Envoyer</Button>
</section>
```

Avec Tailwind v4: `@import 'lumen-ds/tailwind-theme.css';` expose `bg-bg`, `text-fg`, `text-fg-muted`, `border-border-strong`, `ring-ring`, etc.

## Composants (v0.1.0)

| Composant | Variantes | Points d'accessibilité |
|---|---|---|
| `Button` / `ButtonLink` | `primary`, `outline`, `pill` | focus visible 2px/3px, `type="button"` par défaut, lien désactivé = sans `href` + `aria-disabled`, zone tactile 44px sur `pill` |
| `Input` | — | étiquette obligatoire, `aria-describedby` auto, `aria-invalid`, erreur préfixée (« Erreur : ») pour ne pas dépendre de la couleur, placeholder AA |
| `Tag` | `accent`, `soft`, `outline` | statique; pour une action, utiliser `Button variant="pill"` |
| `Card` | — | niveau de titre explicite (`headingLevel`) |

La prop `variant` remplace l'ancienne prop `role` du portfolio, qui entrait en collision avec l'attribut ARIA natif.

## Commandes

```bash
npm install
npm run build      # jetons + tsc + copie des CSS dans dist/
npm test           # vitest + testing-library + jest-axe
npm run typecheck
```

## Ce qui est vérifié, et ce qui ne l'est pas

Vérifié (2026-10-11): génération des jetons (32 paires de contraste, 0 échec); rendu des 4 composants sur les 3 thèmes dans
Chromium; anneau de focus calculé (2px solid, décalage 3px) sur les 3 thèmes; câblage `label` / `aria-describedby` / `aria-invalid`.

Exécuté en local (Node 22): `npm test` (15 tests: axe, clavier, ARIA), `npm run typecheck` et `npm run build`, tous verts;
`dist/index.js` s'importe en ESM Node pur. Package non publié sur npm.

Limite connue: jsdom n'a pas de mise en page, donc `jest-axe` ne vérifie pas les contrastes. Ils sont garantis par `build.mjs`.

## Versionnement

Semver. Voir `CHANGELOG.md`.
