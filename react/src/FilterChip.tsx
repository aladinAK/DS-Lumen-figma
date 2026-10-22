import type { HTMLAttributes } from 'react'
import { cx } from './cx.js'
import { CheckIcon, CloseIcon } from './icons.js'

export type FilterChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** Affiche un bouton de retrait. Après retrait, l'appelant replace le focus (ex. sur le chip suivant). */
  onRemove?: () => void
  /** Nom accessible du bouton de retrait. Par défaut: « Retirer le filtre {label} ». */
  removeLabel?: string
  disabled?: boolean
}

/**
 * Filtre activable: bouton aria-pressed. Actif = fond plein + coche (pas la couleur seule).
 * Cibles de 32px (>= 24px, WCAG 2.5.8).
 */
export function FilterChip({
  label, pressed, onPressedChange, onRemove, removeLabel, disabled, className, ...rest
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
          aria-label={removeLabel ?? `Retirer le filtre ${label}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      ) : null}
    </span>
  )
}
