import express from 'express';
import multer from 'multer';
import storage from '../config/storage.js';
import {
    getAllCourses,
    getFeaturedCourses,
    getMyCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    createCourseReview,
    addLessonToCourse,
    getCourseLessons,
    updateLessonInCourse,
    deleteLessonFromCourse,
    getRecommendedCourses // Import new controller
} from '../controllers/course.controller.js';
import { protect, isTutor, isStudent, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage });


// --- Specific Routes First ---
router.get('/featured', getFeaturedCourses);
router.get('/my-courses', protect, getMyCourses);
router.get('/recommendations', protect, isStudent, getRecommendedCourses); // New route for recommendations


// --- General Routes ---
router.route('/').get(getAllCourses);


// --- Tutor Only Routes ---
router.post('/create', protect, isTutor, createCourse);


// --- Student Only Routes ---
router.post('/:id/enroll', protect, isStudent, enrollInCourse);
router.post('/:id/review', protect, isStudent, createCourseReview);

// --- Lesson Management Routes ---
router.route('/:courseId/lessons')
    .post(protect, isTutor, upload.array('lessonFiles', 5), addLessonToCourse)
    .get(protect, getCourseLessons);

router.route('/:courseId/lessons/:lessonId')
    .put(protect, isTutor, updateLessonInCourse)
    .delete(protect, isTutor, deleteLessonFromCourse);

// --- Dynamic Routes for a single course (must be last) ---
router.route('/:id')
    .get(optionalAuth, getCourseById) // Correctly uses optionalAuth
    .put(protect, isTutor, updateCourse) // Moved from above for better organization
    .delete(protect, isTutor, deleteCourse); // Moved from above for better organization


export default router;

