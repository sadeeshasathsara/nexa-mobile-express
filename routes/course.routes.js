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
    createCourseReview,
    addLessonToCourse,
    getCourseLessons,
    updateLessonInCourse,
    deleteLessonFromCourse
} from '../controllers/course.controller.js';
import { protect, isTutor, isStudent } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Public Routes ---
router.get('/featured', getFeaturedCourses);
router.route('/').get(getAllCourses);

// --- Private General Routes ---
router.get('/my-courses', protect, getMyCourses);

// --- Tutor Only Routes ---
router.post('/create', protect, isTutor, createCourse);
router.put('/:id/update', protect, isTutor, updateCourse); // Note: Renamed from :courseId for consistency
router.delete('/:id/delete', protect, isTutor, deleteCourse); // Note: Renamed from :courseId for consistency

// --- Student Only Routes ---
router.post('/:id/enroll', protect, isStudent, enrollInCourse); // Note: Renamed from :courseId
router.post('/:id/review', protect, isStudent, createCourseReview); // Note: Renamed from :courseId

// --- Lesson Management Routes ---
router.route('/:courseId/lessons')
    .post(protect, isTutor, addLessonToCourse) // Tutor adds a lesson
    .get(protect, getCourseLessons); // Tutor or enrolled student gets lessons

router.route('/:courseId/lessons/:lessonId')
    .put(protect, isTutor, updateLessonInCourse) // Tutor updates a lesson
    .delete(protect, isTutor, deleteLessonFromCourse); // Tutor deletes a lesson

// --- Public Route for Single Course (must be last) ---
router.route('/:id').get(getCourseById);


export default router;

