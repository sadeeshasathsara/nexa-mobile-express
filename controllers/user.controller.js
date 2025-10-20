import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiResponse.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
    // The user object is attached to the request object by the `protect` middleware
    const user = req.user;

    if (user) {
        const userProfile = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        };
        res.status(200).json(new ApiResponse(200, userProfile, "User profile fetched successfully"));
    } else {
        throw new ApiError(404, "User not found");
    }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
    // Find the user by ID from the token
    const user = await User.findById(req.user._id);

    if (user) {
        // Update fields if they are provided in the request body
        user.fullName = req.body.fullName || user.fullName;
        user.email = req.body.email || user.email;

        // Handle password update separately to ensure it gets hashed
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        const userProfile = {
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
        };

        res.status(200).json(new ApiResponse(200, userProfile, "Profile updated successfully"));
    } else {
        throw new ApiError(404, "User not found");
    }
});
