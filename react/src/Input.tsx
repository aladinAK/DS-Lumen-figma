import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx.js'
import { DEFAULT_LOCALE } from './format.js'
import { messagesFor } from './messages.js'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  /** Obligatoire: un champ sans étiquette visible échoue WCAG 1.3.1 / 3.3.2. */
  label: ReactNode
  help?: ReactNode
  /** Message d'erreur. Remplace l'aide, préfixé pour que la couleur ne soit jamais seule (WCAG 1.4.1). */
  error?: ReactNode
  /** Par défaut « Erreur : » (ou « Error: » en `en-*`). */
  errorPrefix?: string
  /** Langue du préfixe d'erreur par défaut. */
  locale?: string
  ref?: Ref<HTMLInputElement>
}

export function Input({
  label, id, help, error, errorPrefix, locale = DEFAULT_LOCALE, className, ref,
  'aria-describedby': describedByProp, ...rest
}: InputProps) {
  const auto = useId()
  const inputId = id ?? auto
  const messageId = `${inputId}-message`
  const message = error ?? help
  const describedBy = [describedByProp, message ? messageId : undefined].filter(Boolean).join(' ') || undefined
  return (
    <div className="lm-field">
      <label className="lm-field__label" htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        className={cx('lm-input', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {message ? (
        <p id={messageId} className={cx('lm-field__message', error ? 'lm-field__message--error' : undefined)}>
          {error ? errorPrefix ?? messagesFor(locale).errorPrefix : null}
          {message}
        </p>
      ) : null}
    </div>
  )
}
