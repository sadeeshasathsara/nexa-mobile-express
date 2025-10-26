import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import Course from '../models/course.model.js';
import Assignment from '../models/assignment.model.js';
import { availableSubjects, availableTags, validLanguageCodes } from '../utils/tagList.js';

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

/**
 * @desc    Get dashboard summary metrics for a tutor
 * @route   GET /api/users/tutor-dashboard
 * @access  Private (Tutor)
 */
export const getTutorDashboard = asyncHandler(async (req, res) => {
    const tutorId = req.user._id;

    // 1. Get all courses created by this tutor
    const courses = await Course.find({ instructor: tutorId });
    const courseIds = courses.map(course => course._id);
    const totalCourses = courses.length;

    // 2. Get the total number of unique students enrolled in these courses
    const totalStudents = await User.countDocuments({
        role: 'student',
        enrolledCourses: { $in: courseIds }
    });

    // 3. Get the total number of assignments (quizzes) created by this tutor
    const totalAssignments = await Assignment.countDocuments({ tutor: tutorId });

    // 4. Calculate the average rating across all of the tutor's courses
    let totalRating = 0;
    let ratedCoursesCount = 0;
    courses.forEach(course => {
        if (course.numReviews > 0) {
            totalRating += course.rating;
            ratedCoursesCount++;
        }
    });

    const rawAverage = ratedCoursesCount > 0 ? (totalRating / ratedCoursesCount) : 0;
    // Format to one decimal place and convert back to a number
    const averageRating = parseFloat(rawAverage.toFixed(1));

    const dashboardSummary = {
        totalStudents,
        totalCourses,
        totalQuizzes: totalAssignments, // Using assignments as quizzes
        averageRating: averageRating
    };

    res.status(200).json(new ApiResponse(200, dashboardSummary, "Tutor dashboard summary fetched successfully."));
});



/**
 * @desc    Update user preferences (subjects and tags)
 * @route   PUT /api/users/preferences
 * @access  Private (Student)
 */
export const updateUserPreferences = asyncHandler(async (req, res) => {
    const { subjects, tags } = req.body;
    const userId = req.user._id;

    // Optional: Validate incoming subjects and tags against predefined lists
    const validSubjects = subjects?.filter(sub => availableSubjects.includes(sub)) || [];
    const validTags = tags?.filter(tag => availableTags.includes(tag)) || [];

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.preferredSubjects = validSubjects;
    user.interestTags = validTags;

    await user.save();

    res.status(200).json(new ApiResponse(200, {
        preferredSubjects: user.preferredSubjects,
        interestTags: user.interestTags
    }, "Preferences updated successfully"));
});

/**
 * @desc    Update user's preferred language
 * @route   PUT /api/users/language
 * @access  Private (Student)
 */
export const updateUserLanguage = asyncHandler(async (req, res) => {
    const { languageCode } = req.body;
    const userId = req.user._id;

    if (!languageCode) {
        throw new ApiError(400, "Language code is required.");
    }

    // Validate the language code
    if (!validLanguageCodes.includes(languageCode)) {
        throw new ApiError(400, "Invalid language code provided.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.preferredLanguage = languageCode;
    await user.save();

    res.status(200).json(new ApiResponse(200, {
        preferredLanguage: user.preferredLanguage
    }, "Preferred language updated successfully"));
});

/**
 * @desc    Get user's preferred language
 * @route   GET /api/users/language
 * @access  Private
 */
export const getUserLanguage = asyncHandler(async (req, res) => {
    // req.user is attached by the 'protect' middleware
    const user = req.user;

    if (!user) {
        // This should theoretically not happen if 'protect' middleware is working
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, {
        preferredLanguage: user.preferredLanguage || 'en' // Return 'en' if somehow undefined
    }, "Preferred language fetched successfully"));
});