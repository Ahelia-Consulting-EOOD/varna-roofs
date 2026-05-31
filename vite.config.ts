import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// Set BASE_PATH for GitHub Pages: e.g. `/varna-roofs/` when serving under
// https://<org>.github.io/varna-roofs/. Default is "/" for local preview.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', threshold: 1024, ext: '.gz', deleteOriginFile: false }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
