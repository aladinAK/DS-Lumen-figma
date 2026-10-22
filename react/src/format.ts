/** Formatage des nombres et des dates via Intl (natif, aucune dépendance). */
export const DEFAULT_LOCALE = 'fr-CA'

export const formatNumber = (value: number, locale = DEFAULT_LOCALE, options?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat(locale, options).format(value)

export const toDate = (d: Date | string): Date => (d instanceof Date ? d : new Date(d))

export const formatDate = (d: Date | string, locale = DEFAULT_LOCALE): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(toDate(d))

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** Âge d'une donnée en clair: « il y a 3 jours ». Sous une minute: « maintenant ». */
export const formatAge = (d: Date | string, now: Date = new Date(), locale = DEFAULT_LOCALE): string => {
  const seconds = (toDate(d).getTime() - now.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(0, 'second')
}
