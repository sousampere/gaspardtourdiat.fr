import express from 'express';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import cookieParser from 'cookie-parser';

import { config } from './config.js';
import { closePool, ensureSchema, waitForDatabase } from './db.js';
import { requireAuth } from './auth.js';
import { refreshIfStale, syncProjects } from './projects.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';

const app = express();

// nginx terminates the connection and forwards the real client address, so
// `req.ip` (used for login throttling) and `req.secure` must trust that hop.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

app.use('/api', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', requireAuth, adminRouter);

const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};
app.use('/api', notFound);

const onError: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[api] unhandled error:', error);

  if (res.headersSent) return;
  res.status(500).json({
    error: config.isProduction ? 'Internal server error' : message,
  });
};
app.use(onError);

async function main(): Promise<void> {
  await waitForDatabase();
  await ensureSchema();
  console.log('[api] database ready');

  const server = app.listen(config.port, () => {
    console.log(`[api] listening on :${config.port} (${config.nodeEnv})`);
  });

  // Warm the cache on boot but never let GitHub availability gate startup.
  void refreshIfStale()
    .catch(() => syncProjects())
    .catch((error: unknown) => {
      console.error('[api] initial sync failed:', (error as Error).message);
    });

  const shutdown = (signal: string) => {
    console.log(`[api] ${signal} received, shutting down…`);
    server.close(() => {
      void closePool().finally(() => process.exit(0));
    });
    // Don't hang forever on lingering keep-alive connections.
    setTimeout(() => process.exit(0), 8_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  console.error('[api] fatal startup error:', error);
  process.exit(1);
});
