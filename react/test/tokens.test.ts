import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Jetons générés: on relance build.mjs (sans dépendance) pour tester la sortie réelle.
// Contrat: le CTA et le kicker reprennent l'identité de chaque thème du portfolio.
execFileSync('node', ['../build.mjs'])
const css = readFileSync('../dist/tokens.css', 'utf8')
const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`)
  return css.slice(start, css.indexOf('}', start))
}

describe('tokens.css', () => {
  it('studio: CTA en accent, texte sur fond, sans halo', () => {
    const studio = block(':root, [data-theme="studio"]')
    expect(studio).toContain('--ds-cta-bg: #c8ff00;')
    expect(studio).toContain('--ds-cta-fg: #0a0a0a;')
    expect(studio).toContain('--ds-cta-glow: none;')
    expect(studio).toContain('--ds-font-kicker: var(--ds-font-mono);')
  })
  it('book: CTA rubis et kicker machine à écrire', () => {
    const book = block('[data-theme="book"]')
    expect(book).toContain('--ds-cta-bg: #c41e3a;')
    expect(book).toContain('--ds-cta-fg: #f5f2eb;')
    expect(book).toContain('--ds-cta-glow: 0 0 30px color-mix(in srgb, #c41e3a 25%, transparent);')
    expect(book).toContain('--ds-font-kicker: var(--ds-font-typewriter);')
  })
  it('mood: CTA en dégradé, texte blanc', () => {
    const mood = block('[data-theme="mood"]')
    expect(mood).toContain('--ds-cta-bg: linear-gradient(to right, #155dfc, #9810fa);')
    expect(mood).toContain('--ds-cta-fg: #ffffff;')
    expect(mood).toContain('--ds-cta-glow: 0 0 30px color-mix(in srgb, #818cf8 25%, transparent);')
  })
  it('vérifie le contraste du texte du CTA sur chaque arrêt du dégradé', () => {
    const report = readFileSync('../dist/contrast-report.md', 'utf8')
    expect(report).toContain('ctaFg / ctaBg (#ffffff sur #155dfc)')
    expect(report).toContain('ctaFg / ctaBg (#ffffff sur #9810fa)')
    expect(report).not.toContain('**NON**')
  })
})
