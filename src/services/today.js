import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

const coerceDateString = (value) => {
  if (!value) return new Date();

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatLocalDate = (value, timeZone = env.appTimezone) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const buildDateRange = (value, timeZone = env.appTimezone) => {
  const source = coerceDateString(value);
  const date = formatLocalDate(source, timeZone);
  const [year, month, day] = date.split('-').map((part) => Number(part));

  const startAt = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const endAt = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

  return { date, startAt, endAt };
};

const summarizePosts = (posts = []) => {
  const summary = {
    total: posts.length,
    pending: 0,
    published: 0,
    failed: 0,
    skipped: 0,
    unknown: 0
  };

  for (const post of posts) {
    if (post.status === 'PENDING') summary.pending += 1;
    else if (post.status === 'PUBLISHED') summary.published += 1;
    else if (post.status === 'FAILED') summary.failed += 1;
    else if (post.status === 'SKIPPED') summary.skipped += 1;
    else summary.unknown += 1;
  }

  return summary;
};

export const getTodaySnapshot = async ({ date } = {}) => {
  const { date: dateString, startAt, endAt } = buildDateRange(date, env.appTimezone);

  const posts = await prisma.postHistory.findMany({
    where: {
      createdAt: {
        gte: startAt,
        lt: endAt
      }
    },
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      keyword: true,
      publishedAt: true,
      sourceUrl: true,
      publishedUrl: true,
      errorMessage: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const jobs = await prisma.scheduledJob.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      jobId: true,
      taskType: true,
      status: true,
      runCount: true,
      failureCount: true,
      autoStopReason: true,
      lastRunAt: true,
      lastStatus: true
    }
  });

  return {
    date: dateString,
    timeZone: env.appTimezone,
    posts: {
      summary: summarizePosts(posts),
      items: posts.map((post) => ({
        ...post,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        createdAt: post.createdAt.toISOString()
      }))
    },
    jobs: {
      total: jobs.length,
      running: jobs.filter((job) => job.status === 'running').length,
      paused: jobs.filter((job) => job.status === 'paused').length,
      error: jobs.filter((job) => job.status === 'error').length,
      items: jobs.map((job) => ({
        ...job,
        lastRunAt: job.lastRunAt ? job.lastRunAt.toISOString() : null
      }))
    }
  };
};

// Duplicate export removed
