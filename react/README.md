# lumen-ds (nom de travail)

Design system React/TypeScript construit autour de **jetons de design** (`tokens.json`) et d'une accessibilité vérifiée,
extrait de mon portfolio [aladinakkari.ca](https://aladinakkari.ca/) (identité visuelle, thèmes, CTA).
Trois thèmes: **Studio** (sombre, accent lime), **Book** (parchemin) et **Mood** (bleu nuit).
Démo: [ds-lumen-figma.vercel.app](https://ds-lumen-figma.vercel.app/).

## Chaîne design → code

```
tokens.json ──build.mjs──► dist/tokens.css          variables CSS (--ds-*) + thèmes + focus visible
                       ├─► dist/tailwind-theme.css  bloc @theme pour Tailwind v4
                       ├─► dist/figma-variables.json variables Figma (chargées dans le fichier Figma)
                       └─► dist/contrast-report.md  ratio WCAG de chaque paire (le build échoue si une paire passe sous la cible)
```

Les couleurs de texte atténué, de bordure de contrôle, d'erreur et d'accent-alt en texte sont **calculées** pour respecter
WCAG AA sur chaque thème. Exemple: `#ff6568` est lisible sur Studio et Mood, mais pas sur le parchemin (≈2,1:1);
le thème Book utilise donc `#9a4446` (4,61:1).

## Utilisation

Installation (pas encore sur npm): `pnpm add "github:aladinAK/DS-Lumen-figma#path:/react"`. Le script `prepare` compile le package.

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

## Couche données

Principe: une interface ne présente jamais une donnée avec plus de certitude qu'elle n'en a.

| État | Marqueur visible (hors couleur) | Lecteur d'écran | Couleur |
|---|---|---|---|
| `verified` | coche | (aucun qualificatif) | `--ds-data-verified` (= fg) |
| `estimated` | « ≈ » + soulignement pointillé | « environ » | `--ds-data-estimated` |
| `stale` | horloge + âge (« il y a 3 jours ») | « donnée périmée », « mise à jour il y a… » | `--ds-data-stale` |
| `missing` | « — », jamais 0 | « donnée manquante » | `--ds-data-missing` (= fg-muted) |

Les couleurs estimée et périmée sont calculées par `build.mjs` pour AA sur `bg` et `muted` de chaque thème.
Chiffres: `font-variant-numeric: tabular-nums` et échelle `--ds-num-{primary,secondary,unit,label}-{size,weight,leading,tracking}`.

```tsx
import { DataValue, Stat, DataTable, FilterChip } from 'lumen-ds'

// `status` est obligatoire: rien n'est « vérifié » par défaut. `value={null}` = manquant, même si status dit autre chose.
<DataValue value={48} unit="$" status="estimated" source="Grille tarifaire" />
<DataValue value={96.4} unit="%" status="stale" updatedAt="2026-03-01" />
<DataValue value={null} status="missing" />

// Variation: flèche + signe + texte accessible. Couleur seulement si `better` est fourni. Masquée si la valeur manque.
<Stat label="Prix médian" value={39} unit="$" status="verified"
  change={{ value: -4.5, unit: '%', better: 'down', period: 'vs mois dernier' }} />

<DataTable
  caption="Forfaits"
  rows={plans}
  rowKey={(p) => p.id}
  columns={[
    { key: 'name', header: 'Forfait', sortable: true },
    { key: 'price', header: 'Prix', numeric: true, sortable: true,
      sortValue: (p) => (p.price.status === 'missing' ? null : p.price.value),
      cell: (p) => <DataValue {...p.price} unit="$" /> },
  ]}
  status="ready"        // 'ready' | 'loading' | 'error' ; 0 ligne = état vide
  partial               // bandeau « Certaines données sont incomplètes. »
  onRetry={refetch}     // bouton Réessayer en état d'erreur
  emptyAction={<Button variant="outline" onClick={clear}>Effacer les filtres</Button>}
  stickyHeader
/>

<FilterChip label="5G" pressed={on} onPressedChange={setOn} onRemove={() => setOn(false)} />
```

| Composant | Points d'accessibilité |
|---|---|
| `DataValue` | état jamais porté par la couleur seule; manquant = `role="img"` + `aria-label="donnée manquante"`; source et date dans un toggletip (bouton `aria-expanded`, Échap ferme et rend le focus, clic extérieur ferme); sans source, la place du ⓘ reste réservée (`aria-hidden`) pour aligner les colonnes numériques au pixel |
| `Stat` | `role="group"` nommé par le libellé; sens de la variation énoncé (« En hausse de… ») |
| `DataTable` | `<caption>`, `<th scope="col">`, première colonne en `<th scope="row">`; tri par bouton dans l'en-tête + `aria-sort` + annonce polie; valeurs manquantes toujours en dernier; conteneur défilant focusable et nommé; `aria-busy` au chargement; erreur en `role="alert"` préfixée « Erreur : »; bandeau partiel relié par `aria-describedby` |
| `FilterChip` | `aria-pressed` + coche quand actif; bouton de retrait nommé « Retirer le filtre … »; cibles de 32px |

## Langue

Les textes des composants (visibles et lecteurs d'écran) existent en français et en anglais. La langue suit la prop `locale`,
déjà utilisée pour formater nombres et dates: `en-*` → anglais, toute autre valeur → français (défaut `fr-CA`).
`DataValue`, `Stat`, `DataTable`, `FilterChip` et `Input` l'acceptent; les props de texte (`errorPrefix`, `removeLabel`,
`emptyMessage`…) restent prioritaires.

```tsx
<DataValue value={null} status="missing" locale="en-CA" />   // « missing data »
```

## Composants (v0.1.0)

| Composant | Variantes | Points d'accessibilité |
|---|---|---|
| `Button` / `ButtonLink` | `primary` (CTA du thème: accent, rubis ou dégradé), `outline`, `pill` | état pressé (`translateY(1px)`), focus visible 2px/3px, `type="button"` par défaut, lien désactivé = sans `href` + `aria-disabled`, zone tactile 44px sur `pill` |
| `Input` | — | étiquette obligatoire, `aria-describedby` auto, `aria-invalid`, erreur préfixée (« Erreur : ») pour ne pas dépendre de la couleur, placeholder AA |
| `Tag` | `accent`, `soft`, `outline` | statique; pour une action, utiliser `Button variant="pill"` |
| `Card` | — | niveau de titre explicite (`headingLevel`) |
| `DataValue`, `Stat`, `DataTable`, `FilterChip` | voir « Couche données » | |

La prop `variant` remplace l'ancienne prop `role` du portfolio, qui entrait en collision avec l'attribut ARIA natif.

## Commandes

```bash
npm install
npm run build      # jetons + tsc + copie des CSS dans dist/
npm test           # vitest + testing-library + jest-axe
npm run typecheck          # package + playground (playground/tsconfig.json)
npm run build:playground   # playground statique → dist-playground/ (voir le README racine pour Netlify / Vercel)
```

## Ce qui est vérifié, et ce qui ne l'est pas

Vérifié (2026-10-11): génération des jetons (36 paires de contraste, 0 échec); rendu des 4 composants sur les 3 thèmes dans
Chromium; anneau de focus calculé (2px solid, décalage 3px) sur les 3 thèmes; câblage `label` / `aria-describedby` / `aria-invalid`.

Vérifié (2026-10-22): couche données, 48 paires de contraste, 0 échec; page « Comparateur » du playground rendue dans Chrome headless
sur les 3 thèmes (marqueurs d'état visibles; bord droit des valeurs et des tirets identique au pixel dans chaque colonne numérique).

Exécuté en local (Node 22): `npm test` (54 tests: axe, clavier, ARIA, manquant ≠ 0, état jamais porté par la couleur seule,
jetons générés, échec du build sous AA, textes en anglais), `npm run typecheck` et `npm run build`, tous verts;
`dist/index.js` s'importe en ESM Node pur. Package non publié sur npm.

Limite connue: jsdom n'a pas de mise en page, donc `jest-axe` ne vérifie pas les contrastes. Ils sont garantis par `build.mjs`.

## Versionnement

Semver. Voir `CHANGELOG.md`.
