import { useRef, useState } from 'react'
import { Button, DataTable, DataValue, FilterChip, Stat } from '../src/index'
import type { DataStatus, DataTableColumn } from '../src/index'

// Jeu de données FICTIF: opérateurs et chiffres inventés. Contient volontairement des valeurs
// estimées, périmées et manquantes pour montrer chaque état.
type Datum = { value: number | null; status: DataStatus; source?: string; updatedAt?: string }
type Plan = {
  id: string
  name: string
  provider: string
  price: Datum
  /** `null` + unlimited = illimité, ce qui n'est PAS une donnée manquante. */
  data: Datum
  unlimited: boolean
  coverage: Datum
  rating: Datum
  fiveG: boolean
  noContract: boolean
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const SRC = 'Grille tarifaire fictive'

const PLANS: Plan[] = [
  {
    id: 'aube', name: 'Aube 20', provider: 'Lumio',
    price: { value: 39, status: 'verified', source: SRC, updatedAt: daysAgo(1) },
    data: { value: 20, status: 'verified', source: SRC, updatedAt: daysAgo(1) }, unlimited: false,
    coverage: { value: 98.2, status: 'verified', source: 'Carte de couverture fictive', updatedAt: daysAgo(12) },
    rating: { value: 4.1, status: 'estimated', source: 'Sondage fictif (n = 140)' },
    fiveG: true, noContract: true,
  },
  {
    id: 'pivot', name: 'Pivot Max', provider: 'Pivot Mobile',
    price: { value: 65, status: 'stale', source: SRC, updatedAt: daysAgo(46) },
    data: { value: null, status: 'verified', source: SRC, updatedAt: daysAgo(46) }, unlimited: true,
    coverage: { value: 99.1, status: 'verified', source: 'Carte de couverture fictive', updatedAt: daysAgo(30) },
    rating: { value: 3.6, status: 'verified', source: 'Avis fictifs (n = 2 310)', updatedAt: daysAgo(3) },
    fiveG: true, noContract: false,
  },
  {
    id: 'vague', name: 'Vague Essentiel', provider: 'Vague',
    price: { value: 25, status: 'verified', source: SRC, updatedAt: daysAgo(2) },
    data: { value: 8, status: 'verified', source: SRC, updatedAt: daysAgo(2) }, unlimited: false,
    coverage: { value: null, status: 'missing' },
    rating: { value: null, status: 'missing' },
    fiveG: false, noContract: true,
  },
  {
    id: 'echo', name: 'Écho 50', provider: 'Écho',
    price: { value: 48, status: 'estimated', source: 'Prix promotionnel, estimation fictive' },
    data: { value: 50, status: 'verified', source: SRC, updatedAt: daysAgo(5) }, unlimited: false,
    coverage: { value: 96.4, status: 'stale', source: 'Carte de couverture fictive', updatedAt: daysAgo(210) },
    rating: { value: 4.4, status: 'verified', source: 'Avis fictifs (n = 870)', updatedAt: daysAgo(8) },
    fiveG: true, noContract: true,
  },
  {
    id: 'borea', name: 'Boréa Zéro', provider: 'Boréa',
    price: { value: 0, status: 'verified', source: 'Offre d’essai fictive, 1 mois', updatedAt: daysAgo(1) },
    data: { value: 2, status: 'verified', source: SRC, updatedAt: daysAgo(1) }, unlimited: false,
    coverage: { value: 91, status: 'estimated', source: 'Estimation fictive' },
    rating: { value: null, status: 'missing' },
    fiveG: false, noContract: true,
  },
]

const FILTERS = [
  { key: 'fiveG', label: '5G' },
  { key: 'noContract', label: 'Sans contrat' },
  { key: 'unlimited', label: 'Données illimitées' },
] as const
type FilterKey = (typeof FILTERS)[number]['key']

const SIMULATIONS = [
  { key: 'ready', label: 'Données' },
  { key: 'loading', label: 'Chargement' },
  { key: 'error', label: 'Erreur' },
] as const
type Simulation = (typeof SIMULATIONS)[number]['key']

const MONEY = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
const cell = (d: Datum, unit?: string, formatOptions?: Intl.NumberFormatOptions) => (
  <DataValue value={d.value} status={d.status} source={d.source} updatedAt={d.updatedAt} unit={unit} formatOptions={formatOptions} />
)
const sortDatum = (d: Datum) => (d.status === 'missing' ? null : d.value)

const COLUMNS: Array<DataTableColumn<Plan>> = [
  {
    key: 'name', header: 'Forfait', sortable: true, sortValue: (p) => p.name,
    cell: (p) => <span className="pg-plan">{p.name}<span className="pg-plan__provider">{p.provider}</span></span>,
  },
  { key: 'price', header: 'Prix / mois', numeric: true, sortable: true, sortValue: (p) => sortDatum(p.price), cell: (p) => cell(p.price, '$', MONEY) },
  {
    key: 'data', header: 'Données', numeric: true, sortable: true,
    sortValue: (p) => (p.unlimited ? Number.POSITIVE_INFINITY : sortDatum(p.data)),
    cell: (p) => (p.unlimited ? <span className="pg-unlimited">Illimitées</span> : cell(p.data, 'Go')),
  },
  { key: 'coverage', header: 'Couverture', numeric: true, sortable: true, sortValue: (p) => sortDatum(p.coverage), cell: (p) => cell(p.coverage, '%') },
  { key: 'rating', header: 'Satisfaction', numeric: true, sortable: true, sortValue: (p) => sortDatum(p.rating), cell: (p) => cell(p.rating, '/ 5') },
]

/** Agrégat honnête: estimé dès qu'une valeur source n'est pas vérifiée; manquant s'il n'y a aucune valeur. */
const aggregate = (data: Datum[], reduce: (values: number[]) => number): Datum => {
  const known = data.filter((d) => d.status !== 'missing' && d.value != null)
  if (known.length === 0) return { value: null, status: 'missing' }
  const exact = known.length === data.length && known.every((d) => d.status === 'verified')
  return {
    value: reduce(known.map((d) => d.value as number)),
    status: exact ? 'verified' : 'estimated',
    source: `Calculé sur ${known.length} forfait(s) sur ${data.length}`,
  }
}
const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length

export function Comparateur() {
  const [active, setActive] = useState<Record<FilterKey, boolean>>({ fiveG: false, noContract: false, unlimited: false })
  const [simulation, setSimulation] = useState<Simulation>('ready')
  const filtersRef = useRef<HTMLParagraphElement>(null)

  const rows = PLANS.filter((p) => FILTERS.every((f) => !active[f.key] || p[f.key]))
  const partial = rows.some((p) => [p.price, p.coverage, p.rating, ...(p.unlimited ? [] : [p.data])].some((d) => d.status === 'missing'))
  const activeCount = FILTERS.filter((f) => active[f.key]).length
  const medianPrice = aggregate(rows.map((p) => p.price), median)
  const meanCoverage = aggregate(rows.map((p) => p.coverage), mean)

  const setFilter = (key: FilterKey, pressed: boolean) => setActive((a) => ({ ...a, [key]: pressed }))
  const clearFilters = () => {
    setActive({ fiveG: false, noContract: false, unlimited: false })
    filtersRef.current?.focus()
  }

  return (
    <div className="pg-section">
      <h2 className="pg-h2">Comparateur de forfaits (données fictives)</h2>

      <div className="pg-stats">
        <Stat label="Forfaits affichés" value={rows.length} status="verified" />
        <Stat
          label="Prix médian / mois"
          unit="$"
          formatOptions={MONEY}
          {...medianPrice}
          change={{ value: -4.5, unit: '%', better: 'down', period: 'vs mois dernier (fictif)' }}
        />
        <Stat label="Couverture moyenne" unit="%" formatOptions={{ maximumFractionDigits: 1 }} {...meanCoverage} />
      </div>

      <div className="pg-filters">
        <p id="pg-filters-label" ref={filtersRef} tabIndex={-1} className="pg-hint">
          Filtres ({activeCount} actif{activeCount > 1 ? 's' : ''})
        </p>
        <div role="group" aria-labelledby="pg-filters-label" className="pg-row">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              pressed={active[f.key]}
              onPressedChange={(pressed) => setFilter(f.key, pressed)}
              onRemove={active[f.key] ? () => { setFilter(f.key, false); filtersRef.current?.focus() } : undefined}
            />
          ))}
        </div>
      </div>

      <div role="group" aria-label="Simuler un état du tableau" className="pg-row">
        <span className="pg-hint">Simuler :</span>
        {SIMULATIONS.map((s) => (
          <Button key={s.key} variant="pill" aria-pressed={simulation === s.key} onClick={() => setSimulation(s.key)}>
            {s.label}
          </Button>
        ))}
      </div>

      <DataTable
        caption="Forfaits mobiles comparés"
        columns={COLUMNS}
        rows={rows}
        rowKey={(p) => p.id}
        status={simulation}
        partial={partial}
        stickyHeader
        defaultSort={{ key: 'price', direction: 'ascending' }}
        onRetry={() => setSimulation('ready')}
        emptyMessage="Aucun forfait ne correspond à ces filtres."
        emptyAction={<Button variant="outline" onClick={clearFilters}>Effacer les filtres</Button>}
      />
      <p className="pg-hint">
        Boréa Zéro coûte réellement 0 $ (vérifié) ; Vague Essentiel n’a pas de note (manquante, « — »). Les deux ne se confondent jamais.
      </p>
    </div>
  )
}
