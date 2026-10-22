import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Playground local: `npx vite` puis ouvre l'adresse affichée.
// Version statique: `npm run build:playground` -> react/dist-playground/ (séparé de dist/, le package npm).
export default defineConfig({
  root: 'playground',
  plugins: [react()],
  server: { open: true },
  build: { outDir: '../dist-playground', emptyOutDir: true },
})
