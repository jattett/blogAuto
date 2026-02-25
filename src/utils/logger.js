const LEVEL_ORDER = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export const shouldLog = (level, currentLevel) => {
  return (LEVEL_ORDER[level] || 20) >= (LEVEL_ORDER[currentLevel] || 20);
};

const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const output = Array.isArray(obj) ? [...obj] : { ...obj };

  if (!Array.isArray(output)) {
    if (output.appPassword) output.appPassword = '***';
    if (output.userPassword) output.userPassword = '***';
    if (output.accessToken) output.accessToken = '***';
    if (output.clientSecret) output.clientSecret = '***';
    if (output.code) output.code = '***';
  }

  return output;
};

export const log = (level, event, meta = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    service: 'blog-auto-bot',
    ...sanitize(meta)
  };

  console.log(JSON.stringify(entry));
};

export const logger = {
  debug: (event, meta) => log('debug', event, meta),
  info: (event, meta) => log('info', event, meta),
  warn: (event, meta) => log('warn', event, meta),
  error: (event, meta) => log('error', event, meta)
};
