/* eslint-env node */

import {
  chrome,
} from '../../.electron-vendors.cache.json';
import {
  renderer,
} from 'unplugin-auto-expose';
import {
  join,
} from 'node:path';
import {
  injectAppVersion,
} from '../../version/inject-app-version-plugin.mjs';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import wasm from 'vite-plugin-wasm';
import {
  nodePolyfills,
} from 'vite-plugin-node-polyfills';
import {
  viteSingleFile,
} from 'vite-plugin-singlefile';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');


/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  base: '',
  server: {
    port: 3000,
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: join(PACKAGE_ROOT, 'index.html'),
    },
    emptyOutDir: true,
    reportCompressedSize: false,
    publicDir: join(PACKAGE_ROOT, 'resources'),
  },
  test: {
    environment: 'happy-dom',
  },
  plugins: [
    react(),
    svgr(),
    wasm(),
    renderer.vite({
      preloadEntry: join(PACKAGE_ROOT, '../preload/src/index.ts'),
    }),
    injectAppVersion(),
    nodePolyfills(),
    viteSingleFile(),
  ],
  define: {
    'process.env': {
      'NODE_DEBUG': false,
    },
  },
  optimizeDeps: {
    exclude: ['react-content-loader', 'react-truncate-inside'],
  },
};

export default config;
