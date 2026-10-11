import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../dist/tokens.css' // généré par `npm run build` (ou `npm run tokens`)
import '../src/styles.css'
import './playground.css'
import { Button, ButtonLink, Card, Input, Tag } from '../src/index'

const THEMES = ['studio', 'book', 'mood'] as const
type Theme = (typeof THEMES)[number]

function App() {
  const [theme, setTheme] = useState<Theme>('studio')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <div data-theme={theme} className="pg-page">
      <header className="pg-header">
        <h1 className="pg-title">Lumen DS</h1>
        <div role="group" aria-label="Thème" className="pg-row">
          {THEMES.map((t) => (
            <Button key={t} variant="pill" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t}
            </Button>
          ))}
        </div>
      </header>

      <main className="pg-main">
        <section aria-labelledby="h-buttons" className="pg-section">
          <h2 id="h-buttons" className="pg-h2">Boutons</h2>
          <div className="pg-row">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="pill">Pill</Button>
            <Button disabled>Désactivé</Button>
            <ButtonLink href="#h-inputs" variant="outline">Lien-bouton</ButtonLink>
          </div>
          <p className="pg-hint">Astuce: appuie sur Tab pour voir l'anneau de focus (2px, décalage 3px).</p>
        </section>

        <section aria-labelledby="h-inputs" className="pg-section">
          <h2 id="h-inputs" className="pg-h2">Champs</h2>
          <div className="pg-grid">
            <Input
              label="Courriel"
              type="email"
              placeholder="nom@exemple.com"
              help="Nous ne partageons jamais ton adresse."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              error={invalid ? 'adresse invalide.' : undefined}
            />
            <Input label="Champ désactivé" disabled placeholder="Non modifiable" />
          </div>
        </section>

        <section aria-labelledby="h-tags" className="pg-section">
          <h2 id="h-tags" className="pg-h2">Étiquettes</h2>
          <div className="pg-row">
            <Tag variant="accent">Accent</Tag>
            <Tag>Soft</Tag>
            <Tag variant="outline">Outline</Tag>
          </div>
        </section>

        <section aria-labelledby="h-cards" className="pg-section">
          <h2 id="h-cards" className="pg-h2">Cartes</h2>
          <div className="pg-grid">
            <Card kicker="Étude de cas" title="Refonte Optic.ca" headingLevel={3} footer={<Tag variant="outline">Shopify</Tag>}>
              Système de marque, maquettes Figma et thème Liquid.
            </Card>
            <Card kicker="Projet" title="Prospect Finder" headingLevel={3} footer={<><Tag variant="outline">Next.js</Tag><Tag variant="outline">Overpass</Tag></>}>
              Trouve les commerces locaux sans site web.
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
