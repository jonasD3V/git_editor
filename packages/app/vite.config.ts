import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    renderer({
      // This will tell the plugin to handle these modules
      resolve: {
        child_process: { type: 'node' },
        fs: { type: 'node' },
        'fs/promises': { type: 'node' },
        path: { type: 'node' },
        os: { type: 'node' },
        util: { type: 'node' },
        events: { type: 'node' },
        stream: { type: 'node' },
      },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@git-gui/core': path.resolve(__dirname, '../core/src'),
      '@git-gui/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
});
