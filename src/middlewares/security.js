import { env } from '../config/env.js';

const tokenSources = (req) => {
  const header = req.get('x-api-key');
  if (header) return header;

  const bearer = req.get('authorization');
  if (bearer && bearer.toLowerCase().startsWith('bearer ')) {
    return bearer.slice(7).trim();
  }

  return '';
};

const normalizeIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const rateBuckets = new Map();
const ddosBuckets = new Map();
const blockedIps = new Map();

const buildBlockUntil = (baseBlockMs, violations = 0) =>
  Math.min(baseBlockMs * Math.max(1, violations), 600000);

const hitWindow = (buckets, key, now, windowMs, maxRequests) => {
  const bucket = buckets.get(key) || { startAt: now, count: 0, violations: 0 };
  if (now - bucket.startAt >= windowMs) {
    bucket.startAt = now;
    bucket.count = 0;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count <= maxRequests) return { ok: true, blockedUntil: null, bucket };

  bucket.violations += 1;
  const violationRate = Math.ceil(bucket.violations / 2);
  const blockedUntil = now + buildBlockUntil(env.ddosBlockMs || 20_000, violationRate);
  blockedIps.set(key, blockedUntil);
  return { ok: false, blockedUntil, bucket };
};

export const requireApiToken = (req, res, next) => {
  if (!Array.isArray(env.apiKeys) || env.apiKeys.length === 0) {
    return next();
  }

  const token = tokenSources(req);
  if (!token || !env.apiKeys.includes(token)) {
    return res.status(401).json({ ok: false, reason: 'API 인증 토큰이 없습니다.' });
  }

  return next();
};

export const applySecurityHeaders = (_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cache-Control': 'no-store'
  });
  next();
};

export const ddosProtection = (req, res, next) => {
  const ip = normalizeIp(req);
  const now = Date.now();
  const blockedUntil = blockedIps.get(ip) || 0;

  if (blockedUntil > now) {
    res.setHeader('Retry-After', String(Math.ceil((blockedUntil - now) / 1000)));
    return res.status(429).json({
      ok: false,
      reason: '요청이 너무 과도합니다. 잠시 후 다시 시도하세요.'
    });
  }

  const routeConfig = req.path.includes('/wordpress/publish')
    ? {
        windowMs: env.ddosPublishWindowMs,
        maxRequests: env.ddosPublishMaxRequests
      }
    : {
        windowMs: env.ddosWindowMs,
        maxRequests: env.ddosMaxRequests
      };

  const shortWindowCheck = hitWindow(ddosBuckets, ip, now, routeConfig.windowMs, routeConfig.maxRequests);
  if (!shortWindowCheck.ok) {
    return res.status(429).json({
      ok: false,
      reason: '짧은 시간 내 과다 요청이 감지되어 임시 차단했습니다.'
    });
  }

  next();
};

export const rateLimitApi = (req, res, next) => {
  const max = Number(env.apiRateLimitPerMinute || 0);
  if (!max || max <= 0) {
    return next();
  }

  const ip = normalizeIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;

  const record = rateBuckets.get(ip) || { startAt: now, count: 0 };
  if (now - record.startAt >= windowMs) {
    record.startAt = now;
    record.count = 0;
  }

  record.count += 1;
  rateBuckets.set(ip, record);

  if (record.count > max) {
    return res.status(429).json({
      ok: false,
      reason: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.'
    });
  }

  return next();
};

export const apiSecurity = [ddosProtection, requireApiToken, rateLimitApi];
