import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Playground local: `npx vite` puis ouvre l'adresse affichée.
export default defineConfig({
  root: 'playground',
  plugins: [react()],
  server: { open: true },
})
