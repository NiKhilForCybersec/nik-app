import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Output to ../dist so Capacitor (capacitor.config.json webDir = "dist") picks up the prod build.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
})
