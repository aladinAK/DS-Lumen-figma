// Génère preview.html (3 thèmes × composants) pour une vérification visuelle rapide.
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { Button, ButtonLink, Card, Input, Tag } from '../src/index'

const tokens = readFileSync('../dist/tokens.css', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')

const Panel = ({ theme }: { theme: string }) => (
  <section data-theme={theme} style={{ background: 'var(--ds-bg)', color: 'var(--ds-fg)', padding: 24, display: 'grid', gap: 20, width: 380 }}>
    <h2 style={{ margin: 0, font: '700 20px Geist, system-ui', textTransform: 'uppercase' }}>{theme}</h2>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button id={`b-${theme}`}>Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="pill">Pill</Button>
      <Button disabled>Disabled</Button>
      <ButtonLink href="#x" variant="outline">Lien</ButtonLink>
    </div>
    <Input label="Courriel" placeholder="nom@exemple.com" help="Nous ne partageons jamais ton adresse." />
    <Input label="Courriel" defaultValue="oups" error="adresse invalide." />
    <div style={{ display: 'flex', gap: 8 }}>
      <Tag variant="accent">Accent</Tag><Tag>Soft</Tag><Tag variant="outline">Outline</Tag>
    </div>
    <Card kicker="Étude de cas" title="Refonte Optic.ca" footer={<Tag variant="outline">Shopify</Tag>}>
      Système de marque, maquettes Figma et thème Liquid.
    </Card>
  </section>
)

const body = renderToStaticMarkup(
  <div style={{ display: 'flex', gap: 24, padding: 24, background: '#e5e5e5', alignItems: 'flex-start' }}>
    {['studio', 'book', 'mood'].map((t) => <Panel key={t} theme={t} />)}
  </div>,
)
writeFileSync('preview.html', `<!doctype html><meta charset="utf-8"><style>${tokens}\n${styles}\nbody{margin:0}</style>${body}`)
console.log('preview.html', body.length)
