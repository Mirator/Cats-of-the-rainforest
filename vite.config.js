import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Cats-of-the-rainforest/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
