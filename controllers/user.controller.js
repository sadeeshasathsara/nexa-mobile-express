import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is available from the protect middleware
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
        res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
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
    const user = await User.findById(req.user._id);

    if (user) {
        user.fullName = req.body.fullName || user.fullName;
        user.email = req.body.email || user.email;
        user.education = req.body.education || user.education;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.status(200).json(new ApiResponse(200, {
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
            education: updatedUser.education,
        }, "Profile updated successfully"));

    } else {
        throw new ApiError(404, "User not found");
    }
});

/**
 * @desc    Get summary metrics for the logged-in user
 * @route   GET /api/users/summary
 * @access  Private
 */
export const getUserSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // We need to fetch the user with populated course details to calculate hours
    const user = await User.findById(userId).populate('enrolledCourses', 'durationWeeks');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 1. Calculate total courses
    const totalCourses = user.enrolledCourses.length;

    // 2. Calculate total hours
    // Assuming an average of 4 study hours per week per course
    const totalHours = user.enrolledCourses.reduce((acc, course) => {
        return acc + (course.durationWeeks || 0) * 4;
    }, 0);

    // 3. Calculate achievements (can be made more complex later)
    // For now, let's assume 1 achievement for every 3 courses enrolled.
    const totalAchievements = Math.floor(totalCourses / 3);

    const summaryMetrics = [
        {
            icon: "book",
            label: "Courses",
            value: totalCourses
        },
        {
            icon: "clock",
            label: "Hours",
            value: totalHours
        },
        {
            icon: "trophy",
            label: "Achievements",
            value: totalAchievements
        }
    ];

    res.status(200).json(new ApiResponse(200, { summaryMetrics }, "User summary data fetched successfully."));
});

