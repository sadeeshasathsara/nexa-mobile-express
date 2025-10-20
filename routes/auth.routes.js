import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/auth.controller.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', logoutUser);

export default router;

