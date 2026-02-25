import express from 'express';
import { env } from './config/env.js';
import wordpressRoutes from './routes/wordpress.js';
import schedulerRoutes from './routes/scheduler.js';
import todayRoutes from './routes/today.js';
import dashboardRoutes from './routes/dashboard.js';
import { applySecurityHeaders, apiSecurity } from './middlewares/security.js';
import { bootstrapSchedules, getMonitorSnapshot } from './services/scheduler.js';
import { logger } from './utils/logger.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(express.json({ limit: '1mb' }));
app.use(applySecurityHeaders);
app.use('/api', apiSecurity);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'blog-auto-bot', env: env.nodeEnv, version: 'phase-2' });
});

app.use('/api/wordpress', wordpressRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/today', todayRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/api/monitoring', (_req, res) => {
  res.json({ ok: true, snapshot: getMonitorSnapshot() });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Blog-Auto-Bot API',
    endpoints: {
      health: '/health',
      monitoring: '/api/monitoring',
      today: '/api/today',
      wordpress: {
        publish: 'POST /api/wordpress/publish'
      },
      scheduler: {
        list: 'GET /api/scheduler/jobs',
        create: 'POST /api/scheduler/jobs',
        detail: 'GET /api/scheduler/jobs/:jobId',
        pause: 'POST /api/scheduler/jobs/:jobId/pause',
        resume: 'POST /api/scheduler/jobs/:jobId/resume',
        remove: 'DELETE /api/scheduler/jobs/:jobId'
      },
      dashboard: '/dashboard'
    }
  });
});

(async () => {
  const booted = await bootstrapSchedules().catch((error) => {
    logger.error('scheduler.bootstrap.failed', { reason: error?.message || 'unknown' });
    return [];
  });

  const server = app.listen(env.port, () => {
    logger.info('server.started', {
      port: env.port,
      restoredJobs: booted.length
    });
  });

  if (Number(env.requestTimeoutMs) > 0) {
    server.requestTimeout = Number(env.requestTimeoutMs);
    server.setTimeout(Number(env.requestTimeoutMs));
  }
  if (Number(env.responseTimeoutMs) > 0) {
    server.headersTimeout = Number(env.responseTimeoutMs);
    server.keepAliveTimeout = Number(env.responseTimeoutMs) + 1000;
  }

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
})();
