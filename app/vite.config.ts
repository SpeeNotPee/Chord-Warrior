import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from a subpath on GitHub Pages (https://<user>.github.io/Chord-Warrior/);
  // the Tauri desktop build always loads from the app root, so only override there.
  base: process.env.GH_PAGES ? '/Chord-Warrior/' : '/',
})
