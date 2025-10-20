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
    deleteLessonFromCourse
} from '../controllers/course.controller.js';
import { protect, isTutor, isStudent } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage });

// --- Public Routes ---
router.get('/featured', getFeaturedCourses);
router.route('/').get(getAllCourses);

// --- Private General Routes ---
router.get('/my-courses', protect, getMyCourses);

// --- Tutor Only Routes ---
router.post('/create', protect, isTutor, createCourse);
router.put('/:id/update', protect, isTutor, updateCourse);
router.delete('/:id/delete', protect, isTutor, deleteCourse);

// --- Student Only Routes ---
router.post('/:id/enroll', protect, isStudent, enrollInCourse);
router.post('/:id/review', protect, isStudent, createCourseReview);

// --- Lesson Management Routes ---
router.route('/:courseId/lessons')
    // Tutor adds a lesson with file uploads in a single request
    .post(protect, isTutor, upload.array('lessonFiles', 5), addLessonToCourse)
    .get(protect, getCourseLessons);

router.route('/:courseId/lessons/:lessonId')
    .put(protect, isTutor, updateLessonInCourse)
    .delete(protect, isTutor, deleteLessonFromCourse);

// --- Public Route for Single Course (must be last) ---
router.route('/:id').get(getCourseById);


export default router;

