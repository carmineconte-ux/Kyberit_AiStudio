import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import fs from 'fs';

function copyWellKnownPlugin() {
  return {
    name: 'copy-well-known',
    generateBundle() {
      const wellKnownPath = path.resolve(__dirname, 'public/.well-known/apple-developer-merchantid-domain-association');
      if (fs.existsSync(wellKnownPath)) {
        const content = fs.readFileSync(wellKnownPath, 'utf-8');
        this.emitFile({
          type: 'asset',
          fileName: '.well-known/apple-developer-merchantid-domain-association',
          source: content
        });
      }
    }
  }
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), copyWellKnownPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
