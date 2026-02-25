import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return !['false', '0', 'off', 'no'].includes(String(value).toLowerCase());
};

const splitCsv = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'file:./data/dev.db',
  appTimezone: process.env.APP_TIMEZONE || 'Asia/Seoul',
  wordpressDefaultSiteUrl: process.env.WORDPRESS_DEFAULT_SITE_URL || '',
  wordpressDefaultUsername: process.env.WORDPRESS_DEFAULT_USERNAME || '',
  wordpressDefaultAppPassword: process.env.WORDPRESS_DEFAULT_APP_PASSWORD || '',
  apiKeys: splitCsv(process.env.API_KEYS || ''),
  apiRateLimitPerMinute: toInteger(process.env.API_RATE_LIMIT_PER_MINUTE, 120),
  trustProxy: toBoolean(process.env.TRUST_PROXY, false),
  ddosWindowMs: toInteger(process.env.API_DDOS_WINDOW_MS, 8000),
  ddosMaxRequests: toInteger(process.env.API_DDOS_MAX_REQUESTS, 35),
  ddosPublishWindowMs: toInteger(process.env.API_DDOS_PUBLISH_WINDOW_MS, 60000),
  ddosPublishMaxRequests: toInteger(process.env.API_DDOS_PUBLISH_MAX_REQUESTS, 8),
  ddosBlockMs: toInteger(process.env.API_DDOS_BLOCK_MS, 20000),
  requestTimeoutMs: toInteger(process.env.REQUEST_TIMEOUT_MS, 15000),
  responseTimeoutMs: toInteger(process.env.RESPONSE_TIMEOUT_MS, 20000)
};
