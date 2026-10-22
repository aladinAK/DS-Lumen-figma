import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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

describe('couche données', () => {
  const themes = [':root, [data-theme="studio"]', '[data-theme="book"]', '[data-theme="mood"]']

  it('chaque thème définit les 4 états de donnée et le texte de succès', () => {
    for (const selector of themes) {
      const theme = block(selector)
      for (const v of ['--ds-data-verified', '--ds-data-estimated', '--ds-data-stale', '--ds-data-missing', '--ds-success-text']) {
        expect(theme).toContain(`${v}:`)
      }
    }
    // book (parchemin): les couleurs de base sont rapprochées de l'encre jusqu'à AA
    expect(block('[data-theme="book"]')).not.toContain('--ds-data-stale: #fbbf24;')
  })

  it('chiffres tabulaires et échelle dédiée', () => {
    expect(css).toContain('--ds-num-features: tabular-nums;')
    for (const role of ['primary', 'secondary', 'unit', 'label']) expect(css).toContain(`--ds-num-${role}-size:`)
  })

  it('les états de donnée sont dans le rapport de contraste, sans échec', () => {
    const report = readFileSync('../dist/contrast-report.md', 'utf8')
    for (const pair of ['dataEstimatedText / bg', 'dataStaleText / bg', 'successText / bg', 'fg / muted']) {
      expect(report.split(pair).length - 1).toBe(3)
    }
    expect(report).not.toContain('**NON**')
  })

  it('le build échoue (exit 1) si une paire passe sous AA', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumen-tokens-'))
    try {
      copyFileSync('../build.mjs', join(dir, 'build.mjs'))
      const tokens = JSON.parse(readFileSync('../tokens.json', 'utf8'))
      tokens.theme.book.muted = '#2a2a2a' // fg (#1a1a1a) sur muted: bien sous 4,5:1
      writeFileSync(join(dir, 'tokens.json'), JSON.stringify(tokens))
      const run = spawnSync('node', [join(dir, 'build.mjs')], { encoding: 'utf8' })
      expect(run.status).toBe(1)
      expect(run.stdout).toContain('ECHEC book fg / muted')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
