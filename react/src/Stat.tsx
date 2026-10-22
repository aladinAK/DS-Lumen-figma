import { useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx.js'
import { DataValue } from './DataValue.js'
import type { DataValueProps } from './DataValue.js'
import { DEFAULT_LOCALE, formatNumber } from './format.js'
import { ArrowDownIcon, ArrowFlatIcon, ArrowUpIcon } from './icons.js'
import { messagesFor } from './messages.js'

export type StatChange = {
  value: number
  unit?: string
  /** Sens favorable. Absent = variation neutre, sans couleur (une hausse n'est pas toujours une bonne nouvelle). */
  better?: 'up' | 'down'
  /** Période de comparaison, ex. « vs mois dernier ». */
  period?: ReactNode
}

export type StatProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
  Pick<DataValueProps, 'value' | 'unit' | 'status' | 'source' | 'updatedAt' | 'now' | 'formatOptions'> & {
    label: ReactNode
    change?: StatChange
    locale?: string
  }

/**
 * Bloc métrique: libellé, DataValue, variation optionnelle.
 * La variation porte son sens par la flèche, le signe et un texte (« en hausse de »), jamais par la couleur seule.
 * Pas de variation affichée sur une donnée manquante: ce serait une certitude inventée.
 */
export function Stat({
  label, change, value, unit, status, source, updatedAt, now, formatOptions, locale = DEFAULT_LOCALE, className, ...rest
}: StatProps) {
  const labelId = useId()
  const m = messagesFor(locale)
  const missing = status === 'missing' || value == null
  const direction = change ? (change.value > 0 ? 'up' : change.value < 0 ? 'down' : 'flat') : null
  const tone = !change?.better || direction === 'flat' ? 'neutral' : direction === change.better ? 'good' : 'bad'
  const amount = change ? `${formatNumber(Math.abs(change.value), locale)}${change.unit ? ` ${change.unit}` : ''}` : ''
  const sign = direction === 'up' ? '+' : direction === 'down' ? '−' : ''
  const spoken = direction === 'up' ? m.up(amount) : direction === 'down' ? m.down(amount) : m.flat

  return (
    <div role="group" aria-labelledby={labelId} className={cx('lm-stat', className)} {...rest}>
      <p id={labelId} className="lm-stat__label">{label}</p>
      <DataValue
        size="primary"
        value={value}
        unit={unit}
        status={status}
        source={source}
        updatedAt={updatedAt}
        now={now}
        locale={locale}
        formatOptions={formatOptions}
      />
      {change && !missing ? (
        <p className={cx('lm-stat__change', `lm-stat__change--${tone}`)} data-direction={direction}>
          {direction === 'up' ? <ArrowUpIcon /> : direction === 'down' ? <ArrowDownIcon /> : <ArrowFlatIcon />}
          <span aria-hidden="true">{sign}{amount}</span>
          <span className="lm-sr-only">{spoken}</span>
          {change.period ? <span className="lm-stat__period"> {change.period}</span> : null}
        </p>
      ) : null}
    </div>
  )
}
