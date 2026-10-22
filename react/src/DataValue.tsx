import { useEffect, useId, useRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import { cx } from './cx.js'
import { DEFAULT_LOCALE, formatAge, formatDate, formatNumber } from './format.js'
import { CheckIcon, ClockIcon, InfoIcon } from './icons.js'

/** Certitude d'une donnée. Une interface ne la présente jamais avec plus de certitude qu'elle n'en a. */
export type DataStatus = 'verified' | 'estimated' | 'stale' | 'missing'

const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  verified: 'Vérifiée',
  estimated: 'Estimée',
  stale: 'Périmée',
  missing: 'Manquante',
}

export type DataValueProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** `null` / `undefined` = donnée manquante, jamais 0. */
  value: number | null | undefined
  unit?: string
  /** Obligatoire: aucune donnée n'est « vérifiée » par défaut. */
  status: DataStatus
  source?: string
  updatedAt?: Date | string
  /** `primary` pour une métrique (Stat), `secondary` dans un tableau ou une ligne. */
  size?: 'primary' | 'secondary'
  /** Date de référence pour l'âge d'une donnée périmée (tests, rendu serveur). */
  now?: Date
  locale?: string
  formatOptions?: Intl.NumberFormatOptions
}

/**
 * Nombre + unité + état. La couleur n'est jamais seule (WCAG 1.4.1):
 * verified = coche, estimated = « ≈ » + pointillé, stale = horloge + âge, missing = tiret.
 * Source et date: toggletip (bouton, aria-expanded, Échap pour fermer), accessible au clavier et au toucher.
 */
export function DataValue({
  value, unit, status, source, updatedAt, size = 'secondary', now, locale = DEFAULT_LOCALE, formatOptions,
  className, ...rest
}: DataValueProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  const missing = status === 'missing' || value == null || Number.isNaN(value)
  const shown: DataStatus = missing ? 'missing' : status
  const hasMeta = Boolean(source || updatedAt)

  const toggle = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    // position fixe: le panneau n'est pas rogné par un conteneur défilant (tableau)
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left })
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (!buttonRef.current?.contains(t) && !panelRef.current?.contains(t)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <span className={cx('lm-data', `lm-data--${shown}`, `lm-data--${size}`, className)} data-status={shown} {...rest}>
      {missing ? (
        <span className="lm-data__value" role="img" aria-label="donnée manquante">—</span>
      ) : (
        <span className="lm-data__value">
          {shown === 'verified' ? <CheckIcon /> : null}
          {shown === 'estimated' ? (
            <>
              <span className="lm-data__approx" aria-hidden="true">≈</span>
              <span className="lm-sr-only">environ </span>
            </>
          ) : null}
          {shown === 'stale' ? <span className="lm-sr-only">donnée périmée : </span> : null}
          <span className="lm-data__number">{formatNumber(value, locale, formatOptions)}</span>
          {unit ? <span className="lm-data__unit">{' '}{unit}</span> : null}
        </span>
      )}
      {shown === 'stale' ? (
        <span className="lm-data__age">
          <ClockIcon />
          {updatedAt ? <><span className="lm-sr-only">, mise à jour </span>{formatAge(updatedAt, now, locale)}</> : 'périmée'}
        </span>
      ) : null}
      {hasMeta ? (
        <>
          <button
            ref={buttonRef}
            type="button"
            className="lm-data__info"
            aria-label="Source et date de la donnée"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={toggle}
          >
            <InfoIcon />
          </button>
          <span
            ref={panelRef}
            id={panelId}
            className="lm-data__tip"
            hidden={!open}
            style={position ? { top: position.top, left: position.left } : undefined}
          >
            <span className="lm-data__tip-status">{DATA_STATUS_LABEL[shown]}</span>
            {source ? <span>Source : {source}</span> : null}
            {updatedAt ? <span>Mise à jour : {formatDate(updatedAt, locale)}</span> : null}
          </span>
        </>
      ) : (
        // réserve la place du bouton ⓘ: chiffres et tirets s'alignent au pixel dans une colonne numérique
        <span className="lm-data__info-placeholder" aria-hidden="true" />
      )}
    </span>
  )
}
