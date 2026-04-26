import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Output to ../dist so Capacitor (capacitor.config.json webDir = "dist") picks up the prod build.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        dev:  path.resolve(__dirname, 'dev.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
