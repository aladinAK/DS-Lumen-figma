import type { HTMLAttributes } from 'react'
import { cx } from './cx.js'

export type TagVariant = 'accent' | 'soft' | 'outline'
export type TagProps = HTMLAttributes<HTMLSpanElement> & { variant?: TagVariant }

/** Étiquette statique. Si elle doit être cliquable, utiliser `Button variant="pill"`. */
export function Tag({ variant = 'soft', className, ...rest }: TagProps) {
  return <span className={cx('lm-tag', `lm-tag--${variant}`, className)} {...rest} />
}
