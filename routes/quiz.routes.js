import express from 'express';
import {
    generateQuiz,
    getQuizById,
    publishQuiz,
    getAvailableQuizzes // Import the new controller function
} from '../controllers/quiz.controller.js';
import { protect, isTutor } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- General Protected Routes ---
router.get('/', protect, getAvailableQuizzes); // New route for available quizzes

// --- Tutor Only Routes ---
router.post('/generate', protect, isTutor, generateQuiz);
router.put('/:quizId/publish', protect, isTutor, publishQuiz);

// --- Tutor or Enrolled Student Routes ---
router.get('/:quizId', protect, getQuizById); // Should be last among GET /:quizId variants


export default router;

