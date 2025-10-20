import express from 'express';
import {
    getAllCourses,
    getFeaturedCourses,
    getMyCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    createCourseReview
} from '../controllers/course.controller.js';
import { protect, isTutor, isStudent } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Public Routes ---
router.get('/featured', protect, getFeaturedCourses);
router.route('/').get(protect, getAllCourses);

// --- Private General Routes ---
router.get('/my-courses', protect, getMyCourses); // For both students and tutors

// --- Tutor Only Routes ---
router.post('/create', protect, isTutor, createCourse);
router.put('/:id/update', protect, isTutor, updateCourse);
router.delete('/:id/delete', protect, isTutor, deleteCourse);

// --- Student Only Routes ---
router.post('/:id/enroll', protect, isStudent, enrollInCourse);
router.post('/:id/review', protect, isStudent, createCourseReview);

// --- Public Route for Single Course ---
router.route('/:id').get(getCourseById);


export default router;