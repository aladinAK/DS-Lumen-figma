import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx.js'

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  as?: 'div' | 'article' | 'section' | 'li'
  kicker?: ReactNode
  title: ReactNode
  /** Niveau de titre (2 à 6): à choisir selon la hiérarchie de la page, pas selon le style. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  children?: ReactNode
  footer?: ReactNode
}

export function Card({ as: Tag = 'article', kicker, title, headingLevel = 3, children, footer, className, ...rest }: CardProps) {
  const Wrapper = Tag as ElementType
  const Heading = `h${headingLevel}` as ElementType
  return (
    <Wrapper className={cx('lm-card', className)} {...rest}>
      {kicker ? <p className="lm-card__kicker">{kicker}</p> : null}
      <Heading className="lm-card__title">{title}</Heading>
      {children ? <div className="lm-card__body">{children}</div> : null}
      {footer ? <div className="lm-card__footer">{footer}</div> : null}
    </Wrapper>
  )
}
