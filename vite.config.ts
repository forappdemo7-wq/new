import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function gutenbergProxyPlugin(): Plugin {
  return {
    name: 'gutenberg-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. /api/gutenberg/:id
        const gutenbergMatch = req.url.match(/^\/api\/gutenberg\/(\d+)/);
        if (gutenbergMatch) {
          const id = gutenbergMatch[1];
          const urlsToTry = [
            `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
            `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
            `https://www.gutenberg.org/files/${id}/${id}.txt`
          ];

          for (const url of urlsToTry) {
            try {
              const fetchRes = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GutenbergReader/1.0)' }
              });
              if (fetchRes.ok) {
                const text = await fetchRes.text();
                if (text && text.length > 500) {
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                  res.setHeader('Cache-Control', 'public, max-age=86400');
                  res.end(text);
                  return;
                }
              }
            } catch (e) {
              // continue to next URL
            }
          }
          res.statusCode = 502;
          res.end('Failed to fetch from Project Gutenberg mirrors');
          return;
        }

        // 2. /api/proxy-text?url=...
        if (req.url.startsWith('/api/proxy-text')) {
          const parsed = new URL(req.url, 'http://localhost:3000');
          const targetUrl = parsed.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }

          try {
            const fetchRes = await fetch(targetUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GutenbergReader/1.0)' }
            });
            if (!fetchRes.ok) {
              res.statusCode = fetchRes.status;
              res.end(`Target returned ${fetchRes.statusText}`);
              return;
            }
            const text = await fetchRes.text();
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.end(err?.message || 'Proxy error');
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      gutenbergProxyPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'get-now — Open Library',
          short_name: 'get-now',
          description: 'An ad-free, privacy-first, free-to-read online library for openly licensed books and comics.',
          theme_color: '#FAF8F5',
          background_color: '#FAF8F5',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/pdfjs-dist') || id.includes('node_modules/jszip')) {
              return 'vendor-parsers';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
