import cron from 'node-cron';
import { publishWordpressPost } from '../drivers/wordpress/index.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const DEFAULT_TIMEZONE = 'Asia/Seoul';
const DEFAULT_STATUS = 'running';
const DEFAULT_MAX_FAILURE = 3;
const RUN_HISTORY_LIMIT = 20;

const TASK_HANDLERS = {
  wordpress_publish: publishWordpressPost
};

const STOP_KEYWORDS = ['401', '403', 'forbidden', 'unauthorized', '로그인 실패', 'login failed', '인증'];

const REGISTRY = new Map();

const sanitizePayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object') return payload;

  const copy = { ...payload };

  if (copy.appPassword) copy.appPassword = '***';
  if (copy.userPassword) copy.userPassword = '***';
  if (copy.accessToken) copy.accessToken = '***';

  return copy;
};

const toPublicRecord = (record) => ({
  ...record,
  payload: sanitizePayload(record.payload)
});

const shouldStopOnFailure = ({
  reason,
  failureCount,
  maxFailureCount = DEFAULT_MAX_FAILURE,
  forceStop = false
}) => {
  if (forceStop) return true;

  if (Number(failureCount || 0) >= Number(maxFailureCount || DEFAULT_MAX_FAILURE)) {
    return true;
  }

  if (!reason) return false;

  const normalized = String(reason).toLowerCase();
  return STOP_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const buildStopReason = ({ reason, failureCount, maxFailureCount, forceStop = false }) => {
  if (forceStop) return 'safety_stop';

  const normalized = String(reason || '').toLowerCase();
  const isCaptcha = STOP_KEYWORDS.some((keyword) => normalized.includes(keyword));

  if (isCaptcha) return 'captcha/login guard';
  if (Number(failureCount || 0) >= Number(maxFailureCount || DEFAULT_MAX_FAILURE)) {
    return 'failure threshold';
  }

  return 'retry';
};

const executeTask = async ({ jobId, taskType, payload }) => {
  const handler = TASK_HANDLERS[taskType];
  if (!handler) {
    return { ok: false, reason: `지원되지 않는 taskType: ${taskType}` };
  }

  const startAt = new Date().toISOString();
  const nextRun = new Date().toISOString();

  const row = await prisma.scheduledJob.findUnique({ where: { jobId } }).catch(() => null);
  const currentFailureCount = row?.failureCount || 0;
  const maxFailureCount = row?.maxFailureCount || DEFAULT_MAX_FAILURE;

  try {
    const result = await handler(payload || {});
    const status = result?.ok ? 'success' : 'failed';
    const error = result?.ok ? null : result.reason || 'unknown';
    const failureCount = result?.ok ? 0 : (currentFailureCount + 1);

    await prisma.scheduledJob.update({
      where: { jobId },
      data: {
        runCount: { increment: 1 },
        lastRunAt: new Date(),
        lastStatus: status,
        lastError: error,
        payload: payload || {},
        failureCount
      }
    }).catch(() => null);

    const memory = REGISTRY.get(jobId);
    if (memory?.jobRecord) {
      memory.jobRecord.lastRunAt = new Date().toISOString();
      memory.jobRecord.lastStatus = status;
      memory.jobRecord.lastError = error;
      memory.jobRecord.failureCount = failureCount;
      memory.jobRecord.runHistory = [
        {
          startAt,
          finishAt: new Date().toISOString(),
          status,
          summary: result?.ok ? 'ok' : error
        },
        ...(memory.jobRecord.runHistory || [])
      ].slice(0, RUN_HISTORY_LIMIT);
    }

    if (!result?.ok) {
      logger.error('scheduler.task.failed', {
        jobId,
        taskType,
        reason: error,
        failureCount
      });

      const forceStop = Boolean(result?.stop);
      if (shouldStopOnFailure({
        reason: error,
        failureCount,
        maxFailureCount,
        forceStop
      })) {
        await pauseSchedule(jobId, {
          autoStopReason: 'safety_stop',
          haltReason: buildStopReason({
            reason: error,
            failureCount,
            maxFailureCount,
            forceStop
          })
        }).catch(() => null);
      }
    } else {
      logger.info('scheduler.task.success', {
        jobId,
        taskType,
        nextRun
      });
    }

    return result;
  } catch (error) {
    const status = 'error';
    const message = error?.message || 'unknown';
    const failureCount = currentFailureCount + 1;

    await prisma.scheduledJob.update({
      where: { jobId },
      data: {
        runCount: { increment: 1 },
        lastRunAt: new Date(),
        lastStatus: status,
        lastError: message,
        failureCount
      }
    }).catch(() => null);

    const memory = REGISTRY.get(jobId);
    if (memory?.jobRecord) {
      memory.jobRecord.lastRunAt = new Date().toISOString();
      memory.jobRecord.lastStatus = status;
      memory.jobRecord.lastError = message;
      memory.jobRecord.failureCount = failureCount;
      memory.jobRecord.runHistory = [
        {
          startAt,
          finishAt: new Date().toISOString(),
          status,
          summary: message
        },
        ...(memory.jobRecord.runHistory || [])
      ].slice(0, RUN_HISTORY_LIMIT);
    }

    logger.error('scheduler.task.exception', {
      jobId,
      taskType,
      reason: message,
      failureCount
    });

    if (shouldStopOnFailure({ reason: message, failureCount, maxFailureCount })) {
      await pauseSchedule(jobId, {
        autoStopReason: 'runtime_exception',
        haltReason: buildStopReason({
          reason: message,
          failureCount,
          maxFailureCount
        })
      }).catch(() => null);
    }

    return { ok: false, reason: message };
  }
};

const createCronTask = (record) => {
  const task = cron.schedule(
    record.cronExpression,
    async () => {
      const current = REGISTRY.get(record.jobId)?.jobRecord;
      if (!current || current.status !== 'running') return;
      await executeTask({
        jobId: record.jobId,
        taskType: record.taskType,
        payload: record.payload
      });
    },
    {
      timezone: record.timezone || DEFAULT_TIMEZONE,
      scheduled: true
    }
  );

  return task;
};

export const registerScheduledJob = (record) => {
  const task = createCronTask(record);

  REGISTRY.set(record.jobId, {
    task,
    jobRecord: {
      ...record,
      payload: sanitizePayload(record.payload),
      runHistory: []
    }
  });

  return toPublicRecord(REGISTRY.get(record.jobId).jobRecord);
};

export const bootstrapSchedules = async () => {
  const rows = await prisma.scheduledJob.findMany({
    where: { status: { in: ['running', 'paused'] } },
    orderBy: { createdAt: 'desc' }
  });

  const jobs = [];

  for (const row of rows) {
    const handler = TASK_HANDLERS[row.taskType];
    if (!handler) {
      await prisma.scheduledJob.update({
        where: { id: row.id },
        data: {
          status: 'error',
          lastStatus: 'failed',
          lastError: `지원되지 않는 taskType: ${row.taskType}`
        }
      }).catch(() => null);
      continue;
    }

    if (!cron.validate(row.cronExpression)) {
      await prisma.scheduledJob.update({
        where: { id: row.id },
        data: {
          status: 'error',
          lastStatus: 'failed',
          lastError: `잘못된 cron 식: ${row.cronExpression}`
        }
      }).catch(() => null);
      continue;
    }

    registerScheduledJob({
      id: row.id,
      jobId: row.jobId,
      taskType: row.taskType,
      cronExpression: row.cronExpression,
      timezone: row.timezone,
      payload: row.payload || {},
      status: row.status,
      runCount: row.runCount,
      failureCount: row.failureCount,
      lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
      lastStatus: row.lastStatus,
      lastError: row.lastError,
      autoStopReason: row.autoStopReason,
      maxFailureCount: row.maxFailureCount
    });

    jobs.push(getSchedule(row.jobId));
  }

  return jobs.filter(Boolean);
};

export const createSchedule = async ({
  jobId,
  taskType,
  cronExpression,
  timezone = DEFAULT_TIMEZONE,
  payload = {},
  status = DEFAULT_STATUS,
  maxFailureCount = DEFAULT_MAX_FAILURE
} = {}) => {
  if (!taskType || !cronExpression) {
    throw new Error('taskType, cronExpression은 필수입니다.');
  }

  if (!cron.validate(cronExpression)) {
    throw new Error('올바른 cron 식이 아닙니다.');
  }

  const handler = TASK_HANDLERS[taskType];
  if (!handler) {
    throw new Error(`지원하지 않는 taskType: ${taskType}`);
  }

  const finalJobId = jobId || `job_${Date.now()}`;
  const existing = await prisma.scheduledJob.findUnique({ where: { jobId: finalJobId } }).catch(() => null);

  if (existing) {
    throw new Error(`jobId가 이미 존재합니다: ${finalJobId}`);
  }

  const created = await prisma.scheduledJob.create({
    data: {
      jobId: finalJobId,
      taskType,
      cronExpression,
      timezone,
      payload,
      status,
      maxFailureCount
    }
  });

  const jobRecord = registerScheduledJob({
    jobId: created.jobId,
    taskType: created.taskType,
    cronExpression: created.cronExpression,
    timezone: created.timezone,
    payload: created.payload,
    status: created.status,
    runCount: created.runCount,
    failureCount: created.failureCount,
    lastRunAt: created.lastRunAt ? created.lastRunAt.toISOString() : null,
    lastStatus: created.lastStatus,
    lastError: created.lastError,
    maxFailureCount: created.maxFailureCount,
    autoStopReason: created.autoStopReason
  });

  logger.info('scheduler.created', { jobId: finalJobId, taskType, cronExpression });

  return jobRecord;
};

export const getSchedule = (jobId) => {
  const item = REGISTRY.get(jobId);
  if (!item) return null;

  return toPublicRecord({ ...item.jobRecord });
};

export const getAllSchedules = () =>
  Array.from(REGISTRY.values()).map((item) => toPublicRecord(item.jobRecord));

export const removeSchedule = async (jobId) => {
  const item = REGISTRY.get(jobId);
  if (!item) return false;

  item.task.stop();
  REGISTRY.delete(jobId);

  await prisma.scheduledJob.delete({ where: { jobId } }).catch(() => null);
  return true;
};

export const pauseSchedule = async (jobId, options = {}) => {
  const item = REGISTRY.get(jobId);
  if (!item) return false;

  item.task.stop();
  item.jobRecord.status = 'paused';
  item.jobRecord.lastStatus = 'paused';

  const data = {
    status: 'paused'
  };

  if (options.autoStopReason) {
    data.lastError = options.autoStopReason;
  }

  if (options.haltReason) {
    data.autoStopReason = options.haltReason;
  }

  await prisma.scheduledJob.update({
    where: { jobId },
    data
  }).catch(() => null);

  logger.warn('scheduler.paused', {
    jobId,
    reason: options.haltReason || options.autoStopReason || 'manual'
  });

  return true;
};

export const resumeSchedule = async (jobId) => {
  const item = REGISTRY.get(jobId);
  if (!item) return false;

  item.task.start();
  item.jobRecord.status = 'running';
  item.jobRecord.lastStatus = 'running';
  item.jobRecord.autoStopReason = null;

  await prisma.scheduledJob.update({
    where: { jobId },
    data: {
      status: 'running',
      autoStopReason: null,
      lastError: null,
      failureCount: 0
    }
  }).catch(() => null);

  logger.info('scheduler.resumed', { jobId });

  return true;
};

export const getMonitorSnapshot = () => ({
  totalInMemoryJobs: REGISTRY.size,
  jobs: getAllSchedules().map((job) => ({
    jobId: job.jobId,
    taskType: job.taskType,
    status: job.status,
    lastStatus: job.lastStatus,
    failureCount: job.failureCount,
    autoStopReason: job.autoStopReason,
    runCount: job.runCount,
    lastRunAt: job.lastRunAt
  })),
  ts: new Date().toISOString()
});
