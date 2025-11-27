// server/src/features/reading-sessions/reading-sessions.router.js
import { Router } from 'express';
import {
  startReadingSession,
  updateReadingSession,
  getReadingStats
} from './reading-sessions.controller.js';

const router = Router();

// POST /api/reading-sessions - Start reading session
router.post('/', startReadingSession);

// PUT /api/reading-sessions/:id - Update session (progress, time)
router.put('/:id', updateReadingSession);

// GET /api/reading-sessions/stats - Get reading stats for user
router.get('/stats', getReadingStats);

export default router;
