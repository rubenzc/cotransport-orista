import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: permite publicar en la raíz o en una subcarpeta (p. ej. GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './',
});
