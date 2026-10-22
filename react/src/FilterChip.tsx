import type { HTMLAttributes } from 'react'
import { cx } from './cx.js'
import { DEFAULT_LOCALE } from './format.js'
import { CheckIcon, CloseIcon } from './icons.js'
import { messagesFor } from './messages.js'

export type FilterChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** Affiche un bouton de retrait. Après retrait, l'appelant replace le focus (ex. sur le chip suivant). */
  onRemove?: () => void
  /** Nom accessible du bouton de retrait. Par défaut: « Retirer le filtre {label} » (ou « Remove filter {label} » en `en-*`). */
  removeLabel?: string
  disabled?: boolean
  /** Langue du nom par défaut du bouton de retrait. */
  locale?: string
}

/**
 * Filtre activable: bouton aria-pressed. Actif = fond plein + coche (pas la couleur seule).
 * Cibles de 32px (>= 24px, WCAG 2.5.8).
 */
export function FilterChip({
  label, pressed, onPressedChange, onRemove, removeLabel, disabled, locale = DEFAULT_LOCALE, className, ...rest
}: FilterChipProps) {
  return (
    <span className={cx('lm-chip', pressed && 'lm-chip--pressed', className)} {...rest}>
      <button
        type="button"
        className="lm-chip__toggle"
        aria-pressed={pressed}
        disabled={disabled}
        onClick={() => onPressedChange(!pressed)}
      >
        {pressed ? <CheckIcon /> : null}
        {label}
      </button>
      {onRemove ? (
        <button
          type="button"
          className="lm-chip__remove"
          aria-label={removeLabel ?? messagesFor(locale).removeFilter(label)}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      ) : null}
    </span>
  )
}
