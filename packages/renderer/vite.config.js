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

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
const GRAPHQL_PROXY_PATH = '/__clorio_graphql_proxy';

const clorioGraphqlProxy = () => ({
  name: 'clorio-graphql-proxy',
  configureServer(server) {
    server.middlewares.use(GRAPHQL_PROXY_PATH, async (req, res) => {
      const target = new URL(req.url || '', 'http://localhost').searchParams.get('target');

      if (!target) {
        res.statusCode = 400;
        res.end('Missing target');
        return;
      }

      let parsedTarget;
      try {
        parsedTarget = new URL(target);
      } catch {
        res.statusCode = 400;
        res.end('Invalid target');
        return;
      }

      if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
        res.statusCode = 400;
        res.end('Unsupported target protocol');
        return;
      }

      const chunks = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const requestBody = chunks.length ? Buffer.concat(chunks) : undefined;
      const requestHeaders = new Headers();

      Object.entries(req.headers).forEach(([key, value]) => {
        if (value === undefined || key === 'host' || key === 'content-length') {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach(headerValue => requestHeaders.append(key, headerValue));
          return;
        }

        requestHeaders.set(key, value);
      });

      try {
        const response = await fetch(parsedTarget, {
          method: req.method,
          headers: requestHeaders,
          body: requestBody,
        });

        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'content-encoding') {
            return;
          }
          res.setHeader(key, value);
        });

        const responseBuffer = Buffer.from(await response.arrayBuffer());
        res.end(responseBuffer);
      } catch (error) {
        res.statusCode = 502;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Failed to proxy GraphQL request',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
      }
    });
  },
});


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
  worker: {
    format: 'es',
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
    publicDir:join(PACKAGE_ROOT, 'resources'),
  },
  test: {
    environment: 'happy-dom',
  },
  plugins: [
    react(),
    svgr(),
    wasm(),
    clorioGraphqlProxy(),
    renderer.vite({
      preloadEntry: join(PACKAGE_ROOT, '../preload/src/index.ts'),
    }),
    injectAppVersion(),
    nodePolyfills(),
  ],
  optimizeDeps: {
    exclude: ['react-content-loader', 'react-truncate-inside'],
  },
};

export default config;
