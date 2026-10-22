import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { DataTable, DataValue, FilterChip, Input, Stat } from '../src'
import type { DataStatus, DataTableColumn } from '../src'

// Limite connue: jsdom n'a pas de mise en page, donc axe ne peut pas calculer les contrastes.
// Les couleurs d'état sont garanties AA en amont par `build.mjs` (rapport dist/contrast-report.md).

const NOW = new Date('2026-10-22T12:00:00Z')
const THREE_DAYS_AGO = new Date('2026-10-19T12:00:00Z')
const STATUSES: DataStatus[] = ['verified', 'estimated', 'stale', 'missing']

/** Marqueurs visibles hors couleur (icônes et signes), bouton ⓘ exclu. */
const visibleMarker = (root: HTMLElement) => {
  const icons = [...root.querySelectorAll('svg[data-icon]')]
    .filter((svg) => !svg.closest('.lm-data__info'))
    .map((svg) => svg.getAttribute('data-icon'))
  const signs = [...root.querySelectorAll('span[aria-hidden="true"], [role="img"]')].map((n) => n.textContent)
  return [...icons, ...signs].join('|')
}

describe('DataValue', () => {
  it('verified: nombre formaté, unité et coche', () => {
    const { container } = render(<DataValue value={1234.5} unit="Go" status="verified" />)
    const el = container.querySelector('.lm-data') as HTMLElement
    expect(el).toHaveAttribute('data-status', 'verified')
    expect(el.textContent).toMatch(/^1\s234,5\s+Go$/)
    expect(el.querySelector('svg[data-icon="check"]')).not.toBeNull()
  })

  it('missing ≠ 0: un tiret nommé « donnée manquante », jamais « 0 »', () => {
    const { container } = render(<DataValue value={0} unit="$" status="missing" />)
    expect(screen.getByRole('img', { name: 'donnée manquante' })).toHaveTextContent('—')
    expect(container.textContent).not.toMatch(/0/)
  })

  it('une valeur null est toujours manquante, même annoncée « verified »', () => {
    const { container } = render(<DataValue value={null} status="verified" />)
    expect(screen.getByRole('img', { name: 'donnée manquante' })).toBeInTheDocument()
    expect(container.querySelector('.lm-data')).toHaveAttribute('data-status', 'missing')
    expect(container.querySelector('svg[data-icon="check"]')).toBeNull()
  })

  it('0 vérifié reste un vrai 0, distinct de « manquant »', () => {
    render(<DataValue value={0} status="verified" />)
    expect(screen.queryByRole('img', { name: 'donnée manquante' })).not.toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('estimated: « ≈ » visible et « environ » pour les lecteurs d’écran', () => {
    const { container } = render(<DataValue value={42} unit="Go" status="estimated" />)
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('≈')
    expect(screen.getByText(/environ/)).toHaveClass('lm-sr-only')
  })

  it('stale: affiche l’âge de la donnée (« il y a 3 jours ») avec une horloge', () => {
    const { container } = render(<DataValue value={42} status="stale" updatedAt={THREE_DAYS_AGO} now={NOW} />)
    expect(container.querySelector('.lm-data__age')).toHaveTextContent('il y a 3 jours')
    expect(container.querySelector('.lm-data__age svg[data-icon="clock"]')).not.toBeNull()
    expect(screen.getByText(/donnée périmée/)).toHaveClass('lm-sr-only')
  })

  it('l’état n’est jamais transmis par la couleur seule: chaque état a un marqueur visible distinct', () => {
    const markers = STATUSES.map((status) => {
      const { container, unmount } = render(<DataValue value={10} status={status} updatedAt={THREE_DAYS_AGO} now={NOW} />)
      const marker = visibleMarker(container.querySelector('.lm-data') as HTMLElement)
      unmount()
      return marker
    })
    expect(markers).toEqual(['check', '≈', 'clock', '—'])
  })

  it('source et date accessibles au clavier: Entrée ouvre, Échap ferme et rend le focus', async () => {
    const user = userEvent.setup()
    render(<DataValue value={42} status="verified" source="Relevé fictif" updatedAt={THREE_DAYS_AGO} />)
    const button = screen.getByRole('button', { name: 'Source et date de la donnée' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Source : Relevé fictif')).not.toBeVisible()
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Source : Relevé fictif')).toBeVisible()
    expect(screen.getByText(/Mise à jour : 19 octobre 2026/)).toBeVisible()
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('sans source ni date: aucun bouton, mais la place du ⓘ est réservée (invisible, hors arbre accessible)', () => {
    const { container } = render(<DataValue value={42} status="verified" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    const slot = container.querySelector('.lm-data')!.lastElementChild
    expect(slot).toHaveClass('lm-data__info-placeholder')
    expect(slot).toHaveAttribute('aria-hidden', 'true')
    expect(slot).toBeEmptyDOMElement()
  })

  it('n’a aucune violation axe (4 états, toggletip ouvert)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        {STATUSES.map((s) => (
          <p key={s}><DataValue value={12} unit="Go" status={s} source="Relevé fictif" updatedAt={THREE_DAYS_AGO} now={NOW} /></p>
        ))}
      </main>,
    )
    await user.click(screen.getAllByRole('button')[0]!)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Stat', () => {
  it('groupe nommé par son libellé, valeur en taille principale', () => {
    const { container } = render(<Stat label="Prix médian" value={45} unit="$" status="verified" />)
    expect(screen.getByRole('group', { name: 'Prix médian' })).toBeInTheDocument()
    expect(container.querySelector('.lm-data--primary')).not.toBeNull()
  })

  it('variation: flèche + signe visibles, sens énoncé, couleur seulement si `better` est fourni', () => {
    const { container, rerender } = render(
      <Stat label="Prix" value={45} status="verified" change={{ value: -3.2, unit: '%', better: 'down', period: 'vs mois dernier' }} />,
    )
    const change = container.querySelector('.lm-stat__change') as HTMLElement
    expect(change).toHaveClass('lm-stat__change--good')
    expect(change.querySelector('svg[data-icon="arrow-down"]')).not.toBeNull()
    expect(within(change).getByText(/^−3,2\s%$/)).toHaveAttribute('aria-hidden', 'true')
    expect(within(change).getByText(/En baisse de 3,2/)).toHaveClass('lm-sr-only')

    rerender(<Stat label="Prix" value={45} status="verified" change={{ value: 2, unit: '%' }} />)
    const neutral = container.querySelector('.lm-stat__change') as HTMLElement
    expect(neutral).toHaveClass('lm-stat__change--neutral')
    expect(within(neutral).getByText(/En hausse de 2/)).toBeInTheDocument()
  })

  it('pas de variation sur une donnée manquante', () => {
    const { container } = render(<Stat label="Prix" value={null} status="missing" change={{ value: 4, unit: '%' }} />)
    expect(container.querySelector('.lm-stat__change')).toBeNull()
    expect(screen.getByRole('img', { name: 'donnée manquante' })).toBeInTheDocument()
  })

  it('n’a aucune violation axe', async () => {
    const { container } = render(
      <main><Stat label="Prix" value={45} unit="$" status="estimated" source="Relevé fictif" change={{ value: 1, unit: '%', better: 'down' }} /></main>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

type Plan = { name: string; price: number | null; data: number | null }
const PLANS: Plan[] = [
  { name: 'Alpha', price: 40, data: 20 },
  { name: 'Bravo', price: null, data: 50 },
  { name: 'Charlie', price: 0, data: null },
  { name: 'Delta', price: 25, data: 10 },
]
const COLUMNS: Array<DataTableColumn<Plan>> = [
  { key: 'name', header: 'Forfait', sortable: true },
  {
    key: 'price',
    header: 'Prix',
    numeric: true,
    sortable: true,
    cell: (p) => <DataValue value={p.price} unit="$" status={p.price == null ? 'missing' : 'verified'} />,
  },
  { key: 'data', header: 'Données', numeric: true },
]
const firstColumn = () => screen.getAllByRole('rowheader').map((c) => c.textContent)

describe('DataTable', () => {
  it('structure sémantique: caption, en-têtes de colonne et de ligne', () => {
    render(<DataTable caption="Forfaits" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} />)
    const table = screen.getByRole('table', { name: 'Forfaits' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    within(table).getAllByRole('columnheader').forEach((th) => expect(th).toHaveAttribute('scope', 'col'))
    expect(within(table).getAllByRole('rowheader')[0]).toHaveAttribute('scope', 'row')
    expect(screen.getByRole('region', { name: 'Forfaits' })).toHaveAttribute('tabindex', '0')
  })

  it('colonne numérique: chaque valeur, tiret compris, se termine par la même case ⓘ (bouton ou réserve)', () => {
    const rows: Plan[] = [{ name: 'Avec source', price: 40, data: 1 }, { name: 'Manquant', price: null, data: 1 }]
    const columns: Array<DataTableColumn<Plan>> = [
      COLUMNS[0]!,
      {
        key: 'price', header: 'Prix', numeric: true,
        cell: (p) => <DataValue value={p.price} status={p.price == null ? 'missing' : 'verified'} source={p.price == null ? undefined : 'Relevé fictif'} />,
      },
    ]
    const { container } = render(<DataTable caption="Forfaits" columns={columns} rows={rows} rowKey={(p) => p.name} />)
    const slots = [...container.querySelectorAll('td .lm-data')].map((el) => {
      const last = el.lastElementChild?.matches('.lm-data__tip') ? el.lastElementChild.previousElementSibling : el.lastElementChild
      return last?.className
    })
    expect(slots).toEqual(['lm-data__info', 'lm-data__info-placeholder'])
  })

  it('colonnes numériques marquées pour l’alignement à droite', () => {
    render(<DataTable caption="Forfaits" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} />)
    expect(screen.getByRole('columnheader', { name: /Prix/ })).toHaveClass('lm-table__cell--numeric')
    expect(screen.getAllByRole('cell')[0]).toHaveClass('lm-table__cell--numeric')
  })

  it('tri au clavier: aria-sort, annonce, et valeurs manquantes en dernier dans les deux sens (≠ 0)', async () => {
    const onSortChange = vi.fn()
    const user = userEvent.setup()
    render(<DataTable caption="Forfaits" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} onSortChange={onSortChange} />)
    const priceHeader = screen.getByRole('columnheader', { name: /Prix/ })
    expect(priceHeader).not.toHaveAttribute('aria-sort')

    screen.getByRole('button', { name: 'Prix' }).focus()
    await user.keyboard('{Enter}')
    expect(priceHeader).toHaveAttribute('aria-sort', 'ascending')
    expect(firstColumn()).toEqual(['Charlie', 'Delta', 'Alpha', 'Bravo'])
    expect(screen.getByText('Trié par Prix, ordre croissant')).toBeInTheDocument()

    await user.keyboard(' ')
    expect(priceHeader).toHaveAttribute('aria-sort', 'descending')
    expect(firstColumn()).toEqual(['Alpha', 'Delta', 'Charlie', 'Bravo'])
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'price', direction: 'descending' })
  })

  it('loading: aria-busy, squelette masqué, annonce du chargement', () => {
    render(<DataTable caption="Forfaits" columns={COLUMNS} rows={[]} rowKey={(p) => p.name} status="loading" loadingRows={3} />)
    const table = screen.getByRole('table')
    expect(table).toHaveAttribute('aria-busy', 'true')
    expect(table.querySelectorAll('.lm-skeleton[aria-hidden="true"]')).toHaveLength(9)
    expect(screen.getByText('Chargement des données…')).toBeInTheDocument()
  })

  it('vide: message et action optionnelle', () => {
    render(
      <DataTable caption="Forfaits" columns={COLUMNS} rows={[]} rowKey={(p) => p.name}
        emptyMessage="Aucun forfait ne correspond." emptyAction={<button type="button">Effacer les filtres</button>} />,
    )
    expect(screen.getByText('Aucun forfait ne correspond.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Effacer les filtres' })).toBeInTheDocument()
  })

  it('erreur: alerte préfixée et bouton Réessayer au clavier', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<DataTable caption="Forfaits" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} status="error" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Erreur : Impossible de charger les données.')
    screen.getByRole('button', { name: 'Réessayer' }).focus()
    await user.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('partiel: bandeau relié au tableau', () => {
    render(<DataTable caption="Forfaits" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} partial />)
    expect(screen.getByRole('table')).toHaveAccessibleDescription('Certaines données sont incomplètes.')
  })

  it('en-tête collant optionnel', () => {
    const { container } = render(<DataTable caption="Forfaits" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} stickyHeader />)
    expect(container.firstChild).toHaveClass('lm-table--sticky')
  })

  it('n’a aucune violation axe (prêt + partiel, chargement, erreur, vide)', async () => {
    const { container } = render(
      <main>
        <DataTable caption="A" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} partial stickyHeader />
        <DataTable caption="B" columns={COLUMNS} rows={[]} rowKey={(p) => p.name} status="loading" />
        <DataTable caption="C" columns={COLUMNS} rows={[]} rowKey={(p) => p.name} status="error" onRetry={() => {}} />
        <DataTable caption="D" columns={COLUMNS} rows={[]} rowKey={(p) => p.name} />
      </main>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('FilterChip', () => {
  const Controlled = ({ onRemove }: { onRemove?: () => void }) => {
    const [pressed, setPressed] = useState(false)
    return <FilterChip label="5G" pressed={pressed} onPressedChange={setPressed} onRemove={onRemove} />
  }

  it('bascule aria-pressed au clavier (Espace, Entrée), coche visible quand actif', async () => {
    const user = userEvent.setup()
    const { container } = render(<Controlled />)
    const toggle = screen.getByRole('button', { name: '5G' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.tab()
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('svg[data-icon="check"]')).not.toBeNull()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('bouton de retrait nommé, atteignable par Tab', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()
    render(<Controlled onRemove={onRemove} />)
    await user.tab()
    await user.tab()
    const remove = screen.getByRole('button', { name: 'Retirer le filtre 5G' })
    expect(remove).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('n’a aucune violation axe', async () => {
    const { container } = render(
      <main>
        <FilterChip label="5G" pressed onPressedChange={() => {}} onRemove={() => {}} />
        <FilterChip label="Sans contrat" pressed={false} onPressedChange={() => {}} />
      </main>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Anglais (locale en-*)', () => {
  it('DataValue: textes accessibles et toggletip en anglais, nombres au format anglais', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <DataValue value={null} status="missing" locale="en-CA" />
        <DataValue value={1234.5} status="estimated" locale="en-CA" />
        <DataValue value={42} status="stale" updatedAt={THREE_DAYS_AGO} now={NOW} source="Fictive" locale="en-CA" />
      </>,
    )
    expect(screen.getByRole('img', { name: 'missing data' })).toBeInTheDocument()
    expect(screen.getByText(/^about/)).toHaveClass('lm-sr-only')
    expect(container.textContent).toContain('1,234.5')
    expect(container.querySelector('.lm-data__age')).toHaveTextContent('3 days ago')
    await user.click(screen.getByRole('button', { name: 'Data source and date' }))
    expect(screen.getByText('Stale')).toBeVisible()
    expect(screen.getByText('Source: Fictive')).toBeVisible()
  })

  it('Stat: sens de la variation énoncé en anglais', () => {
    render(<Stat label="Median price" value={39} status="verified" locale="en-CA" change={{ value: -4.5, unit: '%' }} />)
    expect(screen.getByText('Down 4.5 %')).toHaveClass('lm-sr-only')
  })

  it('DataTable: annonce du tri, erreur et Réessayer en anglais', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DataTable caption="Plans" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} locale="en-CA" />)
    await user.click(screen.getByRole('button', { name: /Prix/ }))
    expect(screen.getByText('Sorted by Prix, ascending')).toBeInTheDocument()
    rerender(<DataTable caption="Plans" columns={COLUMNS} rows={PLANS} rowKey={(p) => p.name} locale="en-CA" status="error" onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Error: The data could not be loaded.')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('FilterChip et Input: noms par défaut en anglais, surcharge toujours possible', () => {
    render(
      <>
        <FilterChip label="5G" pressed={false} onPressedChange={() => {}} onRemove={() => {}} locale="en-CA" />
        <Input label="Email" error="invalid address." locale="en-CA" />
        <Input label="Courriel" error="adresse invalide." errorPrefix="Attention : " locale="en-CA" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Remove filter 5G' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Error: invalid address.')
    expect(screen.getByLabelText('Courriel')).toHaveAccessibleDescription('Attention : adresse invalide.')
  })
})
