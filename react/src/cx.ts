/** Concatène des noms de classe en ignorant les valeurs vides. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ')
