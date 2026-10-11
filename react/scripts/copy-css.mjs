import { copyFileSync, mkdirSync } from 'node:fs'
mkdirSync('dist', { recursive: true })
copyFileSync('src/styles.css', 'dist/styles.css')
copyFileSync('../dist/tokens.css', 'dist/tokens.css')
copyFileSync('../dist/tailwind-theme.css', 'dist/tailwind-theme.css')
