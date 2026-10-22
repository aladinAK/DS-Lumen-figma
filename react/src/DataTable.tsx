import { useId, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Button } from './Button.js'
import { cx } from './cx.js'
import { DEFAULT_LOCALE } from './format.js'
import { AlertIcon, ArrowDownIcon, ArrowUpIcon, SortIcon } from './icons.js'
import { messagesFor } from './messages.js'

export type SortDirection = 'ascending' | 'descending'
export type SortState = { key: string; direction: SortDirection }
type SortValue = number | string | null | undefined

export type DataTableColumn<Row> = {
  key: string
  /** Texte de l'en-tête; sert aussi à l'annonce du tri. */
  header: string
  /** Aligné à droite, chiffres tabulaires. */
  numeric?: boolean
  sortable?: boolean
  /** Contenu de la cellule (ex. <DataValue />). Par défaut: row[key]. */
  cell?: (row: Row) => ReactNode
  /** Valeur de tri. `null` / `undefined` = manquante, toujours en dernier. Par défaut: row[key]. */
  sortValue?: (row: Row) => SortValue
}

export type DataTableProps<Row> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  caption: ReactNode
  columns: Array<DataTableColumn<Row>>
  rows: Row[]
  rowKey: (row: Row) => string
  /** `ready` avec 0 ligne = état vide. */
  status?: 'ready' | 'loading' | 'error'
  /** Certaines valeurs sont manquantes ou incomplètes: bandeau relié au tableau. */
  partial?: boolean
  partialMessage?: ReactNode
  emptyMessage?: ReactNode
  emptyAction?: ReactNode
  errorMessage?: ReactNode
  onRetry?: () => void
  stickyHeader?: boolean
  defaultSort?: SortState
  onSortChange?: (sort: SortState) => void
  loadingRows?: number
  /** Tri des textes et langue des messages par défaut (`en-*` → anglais). */
  locale?: string
}

const read = <Row,>(row: Row, key: string): unknown => (row as Record<string, unknown>)[key]

const defaultSortValue = (value: unknown): SortValue =>
  typeof value === 'number' || typeof value === 'string' ? value : null

/** Tri stable; les valeurs manquantes restent en bas quel que soit le sens (manquant ≠ 0). */
export function sortRows<Row>(rows: Row[], column: DataTableColumn<Row>, direction: SortDirection, locale = DEFAULT_LOCALE): Row[] {
  const value = (row: Row) => (column.sortValue ? column.sortValue(row) : defaultSortValue(read(row, column.key)))
  const factor = direction === 'ascending' ? 1 : -1
  return rows
    .map((row, index) => ({ row, index, v: value(row) }))
    .sort((a, b) => {
      const aMissing = a.v == null || Number.isNaN(a.v)
      const bMissing = b.v == null || Number.isNaN(b.v)
      if (aMissing || bMissing) return aMissing === bMissing ? a.index - b.index : aMissing ? 1 : -1
      const cmp = typeof a.v === 'number' && typeof b.v === 'number'
        ? a.v - b.v
        : String(a.v).localeCompare(String(b.v), locale)
      return cmp === 0 ? a.index - b.index : cmp * factor
    })
    .map((x) => x.row)
}

/**
 * Tableau sémantique: <caption>, <th scope>, tri par bouton dans l'en-tête + aria-sort, annonce du tri.
 * États: loading (squelette + aria-busy), vide, error (Réessayer), partial (bandeau).
 * Le conteneur défilant est focusable et nommé par la légende (clavier, WCAG 2.1.1).
 */
export function DataTable<Row>({
  caption, columns, rows, rowKey, status = 'ready', partial = false,
  partialMessage, emptyMessage, emptyAction,
  errorMessage, onRetry, stickyHeader = false, defaultSort, onSortChange,
  loadingRows = 5, locale = DEFAULT_LOCALE, className, ...rest
}: DataTableProps<Row>) {
  const m = messagesFor(locale)
  const [sort, setSort] = useState<SortState | undefined>(defaultSort)
  const [announcement, setAnnouncement] = useState('')
  const captionId = useId()
  const partialId = useId()

  const sortedColumn = sort ? columns.find((c) => c.key === sort.key) : undefined
  const visibleRows = sort && sortedColumn ? sortRows(rows, sortedColumn, sort.direction, locale) : rows

  const handleSort = (column: DataTableColumn<Row>) => {
    const direction: SortDirection = sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending'
    const next = { key: column.key, direction }
    setSort(next)
    setAnnouncement(m.sortedBy(column.header, direction))
    onSortChange?.(next)
  }

  const message = (content: ReactNode) => (
    <tr>
      <td colSpan={columns.length} className="lm-table__message-cell">
        <div className="lm-table__message">{content}</div>
      </td>
    </tr>
  )

  let body: ReactNode
  if (status === 'loading') {
    body = Array.from({ length: loadingRows }, (_, i) => (
      <tr key={i} className="lm-table__skeleton-row">
        {columns.map((c) => (
          <td key={c.key} className={c.numeric ? 'lm-table__cell--numeric' : undefined}>
            <span className="lm-skeleton" aria-hidden="true" />
          </td>
        ))}
      </tr>
    ))
  } else if (status === 'error') {
    body = message(
      <div role="alert" className="lm-table__error">
        <p className="lm-table__error-text">
          <AlertIcon />
          <span>{m.errorPrefix}{errorMessage ?? m.loadError}</span>
        </p>
        {onRetry ? <Button variant="outline" onClick={onRetry}>{m.retry}</Button> : null}
      </div>,
    )
  } else if (rows.length === 0) {
    body = message(
      <>
        <p className="lm-table__empty-text">{emptyMessage ?? m.empty}</p>
        {emptyAction}
      </>,
    )
  } else {
    body = visibleRows.map((row) => (
      <tr key={rowKey(row)}>
        {columns.map((c, i) => {
          const content = c.cell ? c.cell(row) : String(read(row, c.key) ?? '')
          const cls = c.numeric ? 'lm-table__cell--numeric' : undefined
          return i === 0 ? (
            <th key={c.key} scope="row" className={cls}>{content}</th>
          ) : (
            <td key={c.key} className={cls}>{content}</td>
          )
        })}
      </tr>
    ))
  }

  return (
    <div className={cx('lm-table', stickyHeader && 'lm-table--sticky', className)} {...rest}>
      {partial && status === 'ready' ? (
        <p id={partialId} className="lm-table__partial">
          <AlertIcon />
          <span>{partialMessage ?? m.partial}</span>
        </p>
      ) : null}
      <div className="lm-table__scroll" role="region" aria-labelledby={captionId} tabIndex={0}>
        <table
          className="lm-table__table"
          aria-busy={status === 'loading' ? true : undefined}
          aria-describedby={partial && status === 'ready' ? partialId : undefined}
        >
          <caption id={captionId} className="lm-table__caption">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key ? sort.direction : undefined
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active}
                    className={cx('lm-table__head', c.numeric && 'lm-table__cell--numeric')}
                  >
                    {c.sortable ? (
                      <button type="button" className="lm-table__sort" onClick={() => handleSort(c)}>
                        {c.header}
                        {active === 'ascending' ? <ArrowUpIcon /> : active === 'descending' ? <ArrowDownIcon /> : <SortIcon />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
      <p className="lm-sr-only" aria-live="polite">{status === 'loading' ? m.loading : announcement}</p>
    </div>
  )
}
