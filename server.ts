process.env.DISABLE_HMR = 'true';

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { geminiApiRouter } from './server/routes/geminiApi';
import { coverApiRouter } from './server/routes/coverApi';
import { mediaApiRouter } from './server/routes/mediaApi';
import { adminAuthApiRouter } from './server/routes/adminAuthApi';
import { getStorageOverview } from './server/services/storageService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Trust proxy for reverse proxies in hosted container environments (Cloud Run / iFrames)
  app.set('trust proxy', 1);
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Security headers with helmet (configured to allow loading images and scripts properly in iframe preview)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS support
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOriginEnv = process.env.CORS_ORIGIN;
      if (allowedOriginEnv) {
        const allowedOrigins = allowedOriginEnv.split(',').map(o => o.trim());
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  }));

  app.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'narrative-realm-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      storage: getStorageOverview(),
    });
  });

  // Project Gutenberg text proxy endpoint
  app.get('/api/gutenberg/:id', async (req, res) => {
    const id = req.params.id;
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
            return res.send(text);
          }
        }
      } catch {}
    }
    return res.status(502).json({ error: 'Failed to fetch from Project Gutenberg mirrors' });
  });

  // Generic CORS text proxy
  app.get('/api/proxy-text', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url param' });
    }
    try {
      const fetchRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GutenbergReader/1.0)' }
      });
      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({ error: `Target returned ${fetchRes.statusText}` });
      }
      const text = await fetchRes.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(text);
    } catch (err: any) {
      return res.status(502).json({ error: err?.message || 'Proxy error' });
    }
  });

  // API routers
  app.use('/api/covers', coverApiRouter);
  app.use('/api/gemini', geminiApiRouter);
  app.use('/api/media', mediaApiRouter);
  app.use('/api/admin', adminAuthApiRouter);

  // Vite middleware (Dev) or Static files (Prod)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
