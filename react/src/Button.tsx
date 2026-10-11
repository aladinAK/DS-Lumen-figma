import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { cx } from './cx.js'

/** Remplace l'ancienne prop `role` du portfolio, qui entrait en collision avec l'attribut ARIA natif. */
export type ButtonVariant = 'primary' | 'outline' | 'pill'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
}

/**
 * Bouton. `type="button"` par défaut (évite les soumissions accidentelles).
 * Focus visible global via --ds-focus-*; état désactivé natif (`disabled`).
 */
export function Button({ variant = 'primary', className, type = 'button', ref, ...rest }: ButtonProps) {
  return <button ref={ref} type={type} className={cx('lm-btn', `lm-btn--${variant}`, className)} {...rest} />
}

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
  variant?: ButtonVariant
  children: ReactNode
  /** Un lien ne peut pas être `disabled`: on retire le href et on pose aria-disabled. */
  disabled?: boolean
  ref?: Ref<HTMLAnchorElement>
}

/** Lien stylé comme un bouton (navigation). Utiliser `Button` pour une action. */
export function ButtonLink({ variant = 'primary', className, disabled, href, onClick, ref, ...rest }: ButtonLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }
  return (
    <a
      ref={ref}
      href={disabled ? undefined : href}
      aria-disabled={disabled ? true : undefined}
      onClick={handleClick}
      className={cx('lm-btn', `lm-btn--${variant}`, className)}
      {...rest}
    />
  )
}
