import express from 'express';
import {
    getUpcomingSessions,
    getSessionsByDate,
    createSession,
    updateSession
} from '../controllers/schedule.controller.js';
import { protect, isTutor } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- General Protected Routes (Students & Tutors) ---
router.get('/upcoming', protect, getUpcomingSessions);
router.get('/:date', protect, getSessionsByDate);

// --- Tutor Only Routes ---
router.post('/create-session', protect, isTutor, createSession);
router.put('/:sessionId/update', protect, isTutor, updateSession);

export default router;
