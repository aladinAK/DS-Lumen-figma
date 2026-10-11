import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Button, ButtonLink, Card, Input, Tag } from '../src'

// Limite connue: jsdom n'a pas de mise en page, donc axe ne peut pas calculer les contrastes.
// Les contrastes sont garantis en amont par `build.mjs` (rapport dist/contrast-report.md).

describe('Button', () => {
  it('est un <button type="button"> par défaut', () => {
    render(<Button>Envoyer</Button>)
    expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveAttribute('type', 'button')
  })
  it('applique la variante via une classe', () => {
    render(<Button variant="outline">Voir</Button>)
    expect(screen.getByRole('button')).toHaveClass('lm-btn', 'lm-btn--outline')
  })
  it('est atteignable au clavier et activable avec Entrée et Espace', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Go</Button>)
    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })
  it("sort de l'ordre de tabulation et ignore le clic quand disabled", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button disabled onClick={onClick}>Non</Button>)
    await user.tab()
    expect(screen.getByRole('button')).not.toHaveFocus()
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
  it('n’a aucune violation axe', async () => {
    const { container } = render(<Button>Ok</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ButtonLink', () => {
  it('rend un lien avec href', () => {
    render(<ButtonLink href="/a">Aller</ButtonLink>)
    expect(screen.getByRole('link', { name: 'Aller' })).toHaveAttribute('href', '/a')
  })
  it('désactivé: retire le href, pose aria-disabled et ne navigue pas', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<ButtonLink href="/a" disabled onClick={onClick}>Aller</ButtonLink>)
    const el = screen.getByText('Aller')
    expect(el).not.toHaveAttribute('href')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    await user.click(el)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Input', () => {
  it('relie l’étiquette au champ', () => {
    render(<Input label="Courriel" />)
    expect(screen.getByLabelText('Courriel')).toBeInTheDocument()
  })
  it('décrit le champ avec le message d’aide', () => {
    render(<Input label="Courriel" help="Jamais partagé." />)
    expect(screen.getByLabelText('Courriel')).toHaveAccessibleDescription('Jamais partagé.')
  })
  it('erreur: aria-invalid, préfixe visible, remplace l’aide', () => {
    render(<Input label="Courriel" help="Jamais partagé." error="adresse invalide." />)
    const input = screen.getByLabelText('Courriel')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Erreur : adresse invalide.')
    expect(screen.queryByText('Jamais partagé.')).not.toBeInTheDocument()
  })
  it('conserve un aria-describedby fourni par l’appelant', () => {
    render(<><p id="x">Contexte</p><Input label="Nom" aria-describedby="x" help="Aide" /></>)
    expect(screen.getByLabelText('Nom')).toHaveAccessibleDescription('Contexte Aide')
  })
  it('n’a aucune violation axe (normal et erreur)', async () => {
    const { container } = render(<><Input label="A" help="aide" /><Input label="B" error="oups" /></>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Tag et Card', () => {
  it('Tag rend un <span> avec sa variante', () => {
    render(<Tag variant="accent">Nouveau</Tag>)
    expect(screen.getByText('Nouveau')).toHaveClass('lm-tag--accent')
  })
  it('Card rend un titre au niveau demandé', () => {
    render(<Card title="Projet" headingLevel={2}>Texte</Card>)
    expect(screen.getByRole('heading', { level: 2, name: 'Projet' })).toBeInTheDocument()
  })
  it('Card: aucune violation axe', async () => {
    const { container } = render(<main><Card kicker="Étude" title="Projet" footer={<Tag>UI</Tag>}>Texte</Card></main>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
