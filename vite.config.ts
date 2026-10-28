import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.ts';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      // Offscreen-dokumentet refereres ikke fra manifestet (det opprettes i
      // runtime via chrome.offscreen.createDocument), så det må deklareres her
      // for at det skal bygges.
      input: {
        offscreen: 'src/offscreen/offscreen.html',
      },
    },
  },
});
