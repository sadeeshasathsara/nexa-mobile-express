import express from 'express';
import {
    getUserProfile,
    updateUserProfile,
    getUserSummary,
    getTutorDashboard,
    updateUserPreferences,
    updateUserLanguage, // Import new controller
    getUserLanguage
} from '../controllers/user.controller.js';
import { protect, isTutor, isStudent } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route for getting and updating the user's own profile
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Route for students to update their preferences
router.put('/preferences', protect, isStudent, updateUserPreferences);

// Route for students to update their preferred language
router.put('/language', protect, updateUserLanguage);
router.get('/language', protect, getUserLanguage);

// Route for getting user summary metrics (can be student or tutor)
router.get('/summary', protect, getUserSummary);

// Route for getting tutor dashboard summary
router.get('/tutor-dashboard', protect, isTutor, getTutorDashboard);


export default router;