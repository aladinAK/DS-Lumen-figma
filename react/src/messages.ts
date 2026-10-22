/** Textes des composants (visibles et lecteurs d'écran), en français et en anglais. */
export type Messages = {
  status: { verified: string; estimated: string; stale: string; missing: string }
  missing: string
  approx: string
  stalePrefix: string
  updatedPrefix: string
  staleNoDate: string
  infoButton: string
  source: string
  updated: string
  up: (amount: string) => string
  down: (amount: string) => string
  flat: string
  sortedBy: (header: string, direction: 'ascending' | 'descending') => string
  loading: string
  errorPrefix: string
  retry: string
  partial: string
  empty: string
  loadError: string
  removeFilter: (label: string) => string
}

const FR: Messages = {
  status: { verified: 'Vérifiée', estimated: 'Estimée', stale: 'Périmée', missing: 'Manquante' },
  missing: 'donnée manquante',
  approx: 'environ ',
  stalePrefix: 'donnée périmée : ',
  updatedPrefix: ', mise à jour ',
  staleNoDate: 'périmée',
  infoButton: 'Source et date de la donnée',
  source: 'Source : ',
  updated: 'Mise à jour : ',
  up: (amount) => `En hausse de ${amount}`,
  down: (amount) => `En baisse de ${amount}`,
  flat: 'Stable',
  sortedBy: (header, direction) => `Trié par ${header}, ${direction === 'ascending' ? 'ordre croissant' : 'ordre décroissant'}`,
  loading: 'Chargement des données…',
  errorPrefix: 'Erreur : ',
  retry: 'Réessayer',
  partial: 'Certaines données sont incomplètes.',
  empty: 'Aucune donnée à afficher.',
  loadError: 'Impossible de charger les données.',
  removeFilter: (label) => `Retirer le filtre ${label}`,
}

const EN: Messages = {
  status: { verified: 'Verified', estimated: 'Estimated', stale: 'Stale', missing: 'Missing' },
  missing: 'missing data',
  approx: 'about ',
  stalePrefix: 'stale data: ',
  updatedPrefix: ', updated ',
  staleNoDate: 'stale',
  infoButton: 'Data source and date',
  source: 'Source: ',
  updated: 'Updated: ',
  up: (amount) => `Up ${amount}`,
  down: (amount) => `Down ${amount}`,
  flat: 'Steady',
  sortedBy: (header, direction) => `Sorted by ${header}, ${direction === 'ascending' ? 'ascending' : 'descending'}`,
  loading: 'Loading data…',
  errorPrefix: 'Error: ',
  retry: 'Retry',
  partial: 'Some data is incomplete.',
  empty: 'No data to display.',
  loadError: 'The data could not be loaded.',
  removeFilter: (label) => `Remove filter ${label}`,
}

/** La langue suit la locale déjà passée pour les nombres: `en-*` → anglais, sinon français. */
export const messagesFor = (locale: string): Messages => (locale.toLowerCase().startsWith('en') ? EN : FR)
