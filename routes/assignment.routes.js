import express from 'express';
import {
    getUpcomingAssignments,
    getAssignmentsByCourse,
    createAssignment,
    getAssignmentById,
    submitAssignment
} from '../controllers/assignment.controller.js';
import { protect, isTutor, isStudent } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- General Protected Routes (Students & Tutors) ---
router.get('/upcoming', protect, getUpcomingAssignments);

// --- Tutor Only Routes ---
router.post('/create', protect, isTutor, createAssignment);

// --- Routes organized to avoid conflict ---
router.get('/course/:courseId', protect, getAssignmentsByCourse);
router.get('/:assignmentId', protect, getAssignmentById);

// --- Student Only Routes ---
router.post('/:assignmentId/submit', protect, isStudent, submitAssignment);


export default router;
