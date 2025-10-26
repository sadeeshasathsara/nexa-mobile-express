import express from 'express';
import { getChatHistory, handleBotMessage } from '../controllers/chat.controller.js';
import { protect, isStudent, isTutor } from '../middleware/auth.middleware.js'; // Import isStudent

const router = express.Router();

// @route   GET /api/chat/:courseId/history
// @desc    Get chat message history for a specific course room
// @access  Private (Tutor or Enrolled Student)
router.get('/:courseId/history', protect, getChatHistory);

// @route   POST /api/chat/bot/:courseId
// @desc    Send a message to the course-specific chatbot
// @access  Private (Student)
router.post('/bot/:courseId', protect, handleBotMessage);


export default router;

