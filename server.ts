process.env.DISABLE_HMR = 'true';

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
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

  // Check CLI arguments for --port or default to port 3000 (strict AI Studio dev port requirement)
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
  // Always use port 3000 in dev/studio container to prevent colliding with Nginx ingress on port 8080
  const PORT = cliPort || (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);

  // Security headers with helmet (configured to allow loading inside AI Studio iframe preview)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      frameguard: false,
      originAgentCluster: false,
    })
  );

  // Remove any conflicting frame or origin blocking headers so the dev server displays cleanly in iframe
  app.use((_req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Cross-Origin-Opener-Policy');
    res.removeHeader('Cross-Origin-Resource-Policy');
    next();
  });

  // Response compression (Gzip/Deflate) to reduce network payload by 75%+ for 10,000+ users
  app.use(compression({ threshold: 1024 }));

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

  // Global high-throughput rate limiter for API endpoints (protects against DoS / brute-force)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3000, // 3,000 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
  });
  app.use('/api/', apiLimiter);

  app.use(express.json({ limit: '15mb' }));

  // High-performance in-memory text cache with ETag support for Gutenberg texts
  interface CachedTextEntry {
    text: string;
    cachedAt: number;
    etag: string;
  }
  const textCache = new Map<string, CachedTextEntry>();
  const MAX_TEXT_CACHE_ENTRIES = 300;
  const TEXT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Health check endpoint with system metrics
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      status: 'ok',
      service: 'narrative-realm-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      storage: getStorageOverview(),
    });
  });

  // High-performance cached catalog route
  app.get('/api/catalog', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'v1',
    });
  });

  // Project Gutenberg text proxy endpoint with memory cache & 304 Not Modified
  app.get('/api/gutenberg/:id', async (req, res) => {
    const id = req.params.id;
    const cacheKey = `gutenberg_${id}`;
    const cached = textCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < TEXT_CACHE_TTL) {
      if (req.headers['if-none-match'] === cached.etag) {
        return res.status(304).end();
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('ETag', cached.etag);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
      return res.send(cached.text);
    }

    const urlsToTry = [
      `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
      `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
      `https://www.gutenberg.org/files/${id}/${id}.txt`,
    ];

    for (const url of urlsToTry) {
      try {
        const fetchRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GutenbergReader/1.0)' },
        });
        if (fetchRes.ok) {
          const text = await fetchRes.text();
          if (text && text.length > 500) {
            const etag = `W/"${crypto.createHash('md5').update(text).digest('hex')}"`;
            if (textCache.size >= MAX_TEXT_CACHE_ENTRIES) {
              const oldestKey = textCache.keys().next().value;
              if (oldestKey) textCache.delete(oldestKey);
            }
            textCache.set(cacheKey, { text, cachedAt: Date.now(), etag });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('ETag', etag);
            res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
            return res.send(text);
          }
        }
      } catch {}
    }
    return res.status(502).json({ error: 'Failed to fetch from Project Gutenberg mirrors' });
  });

  // Generic CORS text proxy with in-memory caching
  app.get('/api/proxy-text', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url param' });
    }

    const cacheKey = `proxy_${targetUrl}`;
    const cached = textCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < TEXT_CACHE_TTL) {
      if (req.headers['if-none-match'] === cached.etag) {
        return res.status(304).end();
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('ETag', cached.etag);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
      return res.send(cached.text);
    }

    try {
      const fetchRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GutenbergReader/1.0)' },
      });
      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({ error: `Target returned ${fetchRes.statusText}` });
      }
      const text = await fetchRes.text();
      const etag = `W/"${crypto.createHash('md5').update(text).digest('hex')}"`;
      if (textCache.size >= MAX_TEXT_CACHE_ENTRIES) {
        const oldestKey = textCache.keys().next().value;
        if (oldestKey) textCache.delete(oldestKey);
      }
      textCache.set(cacheKey, { text, cachedAt: Date.now(), etag });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
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
  const distHtmlPath = path.resolve(__dirname, 'dist', 'index.html');
  const hasDist = fs.existsSync(distHtmlPath);

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distHtmlPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
    });
    app.use(vite.middlewares);
  }

  // Optimize persistent socket keep-alive for 10,000+ active connections
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxHeadersCount = 2000;

  server.on('error', (err: any) => {
    console.error('Server error encountered:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection in server:', reason);
});

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
