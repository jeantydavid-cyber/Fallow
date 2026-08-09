import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative so the same bundle works from a GitHub Pages subpath, a custom
  // domain, or a local file server without rebuilding.
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
} as Parameters<typeof defineConfig>[0]);
