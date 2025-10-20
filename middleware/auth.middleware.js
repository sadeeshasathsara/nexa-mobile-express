import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiResponse.js';

/**
 * @desc Protects routes by verifying JWT token from cookies.
 * Attaches user object to the request if authenticated.
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Read the JWT from the 'jwt' cookie
    token = req.cookies.jwt;

    if (token) {
        try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token's payload
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                throw new ApiError(401, 'Not authorized, user not found');
            }

            next(); // Proceed to the next middleware/controller
        } catch (error) {
            console.error(error);
            throw new ApiError(401, 'Not authorized, token failed');
        }
    } else {
        throw new ApiError(401, 'Not authorized, no token');
    }
});

/**
 * @desc Middleware to check if the user is a tutor.
 * Should be used after the `protect` middleware.
 */
export const isTutor = (req, res, next) => {
    if (req.user && req.user.role === 'tutor') {
        next();
    } else {
        // Use throw to pass to the central error handler
        throw new ApiError(403, 'Not authorized as a tutor');
    }
};

/**
 * @desc Middleware to check if the user is a student.
 * Should be used after the `protect` middleware.
 */
export const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        // Use throw to pass to the central error handler
        throw new ApiError(403, 'Not authorized as a student');
    }
};