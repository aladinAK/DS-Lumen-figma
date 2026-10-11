# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnement [SemVer](https://semver.org/lang/fr/).

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
