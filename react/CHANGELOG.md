# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnement [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Modifié — alignement sur le portfolio
- Bouton `primary`: fond et texte par thème via `--ds-cta-bg` / `--ds-cta-fg` (accent sur studio, rubis sur book,
  dégradé avec texte blanc sur mood); survol `scale(1.05)` + halo `--ds-cta-glow` (book, mood), comme le portfolio.
- Transitions des boutons à 300 ms (`--ds-dur-fast`) au lieu de 500 ms.
- `Button variant="pill"`: bordure 1,5px; police du kicker du thème (`--ds-font-kicker`, Special Elite sur book), sans graisse.
- Kicker de `Card`: police du kicker du thème, sans graisse.
- `build.mjs` vérifie le contraste du texte du CTA sur chaque arrêt du dégradé (36 paires).

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
- Texte atténué (kicker, synopsis, métadonnées) passé de valeurs à 2,5–4,1:1 à des couleurs ≥ 4,5:1.
