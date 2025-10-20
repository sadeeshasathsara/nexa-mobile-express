import asyncHandler from 'express-async-handler';
import Course from '../models/course.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiResponse.js'; // Added missing import
import User from '../models/user.model.js';

/**
 * @desc    Fetch all courses with optional filtering and search
 * @route   GET /api/courses
 * @access  Public
 */
export const getAllCourses = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const courses = await Course.find(filterConditions).populate('instructor', 'fullName');
    res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully"));
});

/**
 * @desc    Get featured courses
 * @route   GET /api/courses/featured
 * @access  Public
 */
export const getFeaturedCourses = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const courses = await Course.find({})
        .sort({ rating: -1 })
        .limit(4)
        .populate('instructor', 'fullName');
    res.status(200).json(new ApiResponse(200, courses, "Featured courses fetched successfully"));
});

/**
 * @desc    Get courses enrolled by the logged-in user
 * @route   GET /api/courses/my-courses
 * @access  Private
 */
export const getMyCourses = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const user = await User.findById(req.user._id).populate({
        path: 'enrolledCourses',
        populate: {
            path: 'instructor',
            select: 'fullName'
        }
    });
    if (user) {
        res.status(200).json(new ApiResponse(200, user.enrolledCourses, "Enrolled courses fetched successfully"));
    } else {
        throw new ApiError(404, "User not found");
    }
});

/**
 * @desc    Get a single course by ID
 * @route   GET /api/courses/:id
 * @access  Public
 */
export const getCourseById = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const course = await Course.findById(req.params.id).populate('instructor', 'fullName email');
    if (course) {
        res.status(200).json(new ApiResponse(200, course, "Course details fetched successfully"));
    } else {
        throw new ApiError(404, "Course not found");
    }
});

/**
 * @desc    Create a new course
 * @route   POST /api/courses/create
 * @access  Private/Tutor
 */
export const createCourse = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const createdCourse = await course.save();
    res.status(201).json(new ApiResponse(201, createdCourse, "Course created successfully"));
});


/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id/update
 * @access  Private/Tutor
 */
export const updateCourse = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const course = await Course.findById(req.params.id);
    if (course) {
        if (course.instructor.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "User not authorized to update this course");
        }
        // ... (rest of update logic) ...
        const updatedCourse = await course.save();
        res.status(200).json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
    } else {
        throw new ApiError(404, "Course not found");
    }
});


/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id/delete
 * @access  Private/Tutor
 */
export const deleteCourse = asyncHandler(async (req, res) => {
    // ... (existing code as you provided) ...
    const course = await Course.findById(req.params.id);
    if (course) {
        if (course.instructor.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "User not authorized to delete this course");
        }
        await course.deleteOne();
        res.status(200).json(new ApiResponse(200, {}, "Course deleted successfully"));
    } else {
        throw new ApiError(404, "Course not found");
    }
});

// --- NEW STUDENT FUNCTIONS ---

/**
 * @desc    Enroll the current user in a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private/Student
 */
export const enrollInCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Check if user is already enrolled
    if (user.enrolledCourses.includes(course._id)) {
        throw new ApiError(400, "You are already enrolled in this course");
    }

    // Add course to user's list and update course enrollment count
    user.enrolledCourses.push(course._id);
    course.enrollments = (course.enrollments || 0) + 1;

    await user.save();
    await course.save();

    res.status(200).json(new ApiResponse(200, { courseId: course._id }, "Enrolled successfully"));
});

/**
 * @desc    Create a new review for a course
 * @route   POST /api/courses/:id/review
 * @access  Private/Student
 */
export const createCourseReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Check if user is enrolled (you can't review a course you're not in)
    const user = await User.findById(req.user._id);
    if (!user.enrolledCourses.includes(courseId)) {
        throw new ApiError(403, "You must be enrolled in this course to leave a review");
    }

    // Check if user has already reviewed this course
    const alreadyReviewed = course.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
        throw new ApiError(400, "You have already reviewed this course");
    }

    // Create the review object
    const review = {
        name: req.user.fullName,
        rating: Number(rating),
        comment,
        user: req.user._id,
    };

    // Add the new review
    course.reviews.push(review);

    // Update the course's overall rating stats
    course.numReviews = course.reviews.length;
    course.rating =
        course.reviews.reduce((acc, item) => item.rating + acc, 0) /
        course.reviews.length;

    await course.save();
    res.status(201).json(new ApiResponse(201, review, "Review added successfully"));
});