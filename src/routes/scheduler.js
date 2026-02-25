import express from 'express';
import {
  createSchedule,
  getAllSchedules,
  getSchedule,
  pauseSchedule,
  removeSchedule,
  resumeSchedule
} from '../services/scheduler.js';

const router = express.Router();

router.get('/jobs', (_req, res) => {
  const jobs = getAllSchedules();
  res.json({ ok: true, jobs });
});

router.post('/jobs', async (req, res) => {
  try {
    const { jobId, taskType, cronExpression, timezone, payload, maxFailureCount } = req.body || {};

    if (!taskType || !cronExpression) {
      return res.status(400).json({ ok: false, reason: 'taskType, cronExpression은 필수입니다.' });
    }

    const created = await createSchedule({
      jobId,
      taskType,
      cronExpression,
      timezone,
      payload,
      maxFailureCount
    });

    return res.json({ ok: true, job: created });
  } catch (error) {
    return res.status(400).json({ ok: false, reason: error?.message || '스케줄 생성 실패' });
  }
});

router.get('/jobs/:jobId', (req, res) => {
  const job = getSchedule(req.params.jobId);
  if (!job) {
    return res.status(404).json({ ok: false, reason: 'jobId를 찾을 수 없습니다.' });
  }

  return res.json({ ok: true, job });
});

router.delete('/jobs/:jobId', async (req, res) => {
  const ok = await removeSchedule(req.params.jobId);
  if (!ok) {
    return res.status(404).json({ ok: false, reason: 'jobId를 찾을 수 없습니다.' });
  }

  return res.json({ ok: true, jobId: req.params.jobId, status: 'removed' });
});

router.post('/jobs/:jobId/pause', async (req, res) => {
  const ok = await pauseSchedule(req.params.jobId);
  if (!ok) {
    return res.status(404).json({ ok: false, reason: 'jobId를 찾을 수 없습니다.' });
  }

  return res.json({ ok: true, jobId: req.params.jobId, status: 'paused' });
});

router.post('/jobs/:jobId/resume', async (req, res) => {
  const ok = await resumeSchedule(req.params.jobId);
  if (!ok) {
    return res.status(404).json({ ok: false, reason: 'jobId를 찾을 수 없습니다.' });
  }

  return res.json({ ok: true, jobId: req.params.jobId, status: 'running' });
});

export default router;
