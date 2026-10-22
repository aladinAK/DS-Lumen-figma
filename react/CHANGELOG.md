# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnement [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté — couche données
- Jetons: `--ds-num-*` (tabular-nums, échelle valeur / valeur secondaire / unité / libellé), `--ds-data-{verified,estimated,stale,missing}`,
  `--ds-success-text`, `--ds-data-estimated-decoration`; primitive `amber-400`. Couleurs estimée, périmée et succès calculées par thème
  pour AA sur `bg` et `muted`; 12 paires ajoutées au rapport (48 au total). Exportées aussi vers Tailwind et `figma-variables.json`.
- Composants `DataValue`, `Stat`, `DataTable`, `FilterChip`; utilitaire `sortRows` (valeurs manquantes toujours en dernier).
- Playground: page « Comparateur » (données fictives).
- 31 tests (27 composants, 4 jetons, dont l'échec du build sous AA).

- `DataValue`: la place du bouton ⓘ est réservée quand il n'y a ni source ni date (`aria-hidden`), pour aligner
  chiffres et tirets au pixel dans une colonne numérique.
- `playground/tsconfig.json`; `npm run typecheck` vérifie aussi le playground.
- `npm run build:playground` (sortie `dist-playground/`), `netlify.toml` et `vercel.json` pour un déploiement statique.
- Playground déployé sur Vercel; lien direct `?view=composants|comparateur` et `?theme=studio|book|mood`
  (utilisé par la section Données du portfolio).
- `Button` / `ButtonLink`: état pressé (`:active`, `translateY(1px)`), comme le portfolio.
- Script `prepare` (= `npm run build`): le package s'installe depuis git (`github:aladinAK/DS-Lumen-figma#path:/react`).
- Le portfolio installe `lumen-ds`: ses thèmes, états, rampe neutre, espacement, rayons, ombres, mouvement et anneau de focus
  viennent de `lumen-ds/tokens.css`, et son panneau affiche `Button`, `Tag`, `Input`, `Card`; son texte atténué (auparavant par opacité, 1,9–4,1:1) prend
  `--ds-fg-muted`, `--ds-fg-subtle` et `--ds-accent-alt-text`.
- Textes en anglais: `src/messages.ts` (FR, EN), choisis par la prop `locale` (`en-*` → anglais) sur `DataValue`, `Stat`,
  `DataTable`, et nouvelle prop `locale` sur `FilterChip` et `Input`. Défaut inchangé (français). 4 tests ajoutés (54 au total).

### Corrigé
- `Input`: dans une grille, un champ sans message d'aide n'étire plus son libellé et son input à la hauteur
  d'un champ voisin qui en a un (`align-content: start` sur `.lm-field`).

### Modifié
- `build.mjs`: la dérivation « rapprocher de fg jusqu'à AA » est factorisée (`towardFg`); sorties existantes identiques.
- `tokens.json`: `meta.version` aligné sur le package (0.1.0, était 2.0.0-draft); commentaires d'espacement
  (1 à 8: six pas de composant, comme le portfolio; 0 et 12 à 24: mise en page) et de mouvement (usage de chaque durée).
- Docs: README, AGENTS et ce fichier indiquent la démo en ligne; décision « bouton Outline à 52px » fermée
  (même hauteur que le portfolio).

### Modifié — alignement sur le portfolio
- Bouton `primary`: fond et texte par thème via `--ds-cta-bg` / `--ds-cta-fg` (accent sur studio, rubis sur book,
  dégradé avec texte blanc sur mood); survol `scale(1.05)` + halo `--ds-cta-glow` (book, mood), comme le portfolio.
- Transitions des boutons à 300 ms (`--ds-dur-fast`) au lieu de 500 ms.
- `Button variant="pill"`: bordure 1,5px; police du kicker du thème (`--ds-font-kicker`, Special Elite sur book), sans graisse.
- Kicker de `Card`: police du kicker du thème, sans graisse.
- `build.mjs` vérifie le contraste du texte du CTA sur chaque arrêt du dégradé (36 paires à cette étape, 48 avec la couche données).

## [0.1.0] - 2026-10-11

### Ajouté
- Jetons (`tokens.json`) et build vers CSS, Tailwind v4 et variables Figma, avec calcul des contrastes WCAG AA par thème.
- Thèmes `studio`, `book`, `mood` via l'attribut `data-theme`.
- Composants `Button`, `ButtonLink`, `Input`, `Tag`, `Card`.
- Focus visible global (2px, décalage 3px) et prise en compte de `prefers-reduced-motion`.
- Jeton `error-text` calculé par thème.

### Modifié par rapport au portfolio d'origine
- 7 gris très foncés fusionnés en 2 jetons d'encre/fond; 14 niveaux d'alpha blanc ramenés à 5 (proposition à valider visuellement).
- Prop `role` du bouton renommée `variant`.
- Texte atténué (kicker, synopsis, métadonnées) passé de valeurs à 1,9–4,1:1 (opacités du portfolio) à des couleurs ≥ 4,5:1.
