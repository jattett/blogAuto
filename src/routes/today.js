import express from 'express';
import { getTodaySnapshot } from '../services/today.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const snapshot = await getTodaySnapshot({ date: req.query.date });
    return res.json({ ok: true, snapshot });
  } catch (error) {
    return res.status(500).json({ ok: false, reason: error?.message || '오늘 현황 조회 실패' });
  }
});

export default router;
