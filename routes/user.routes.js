import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

// Both routes are protected and apply to the currently logged-in user's profile.
// We can chain the .get() and .put() methods for the same '/profile' route.
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

export default router;
