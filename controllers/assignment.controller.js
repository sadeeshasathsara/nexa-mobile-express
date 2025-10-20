import asyncHandler from 'express-async-handler';
import Assignment from '../models/assignment.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import mongoose from 'mongoose';


/**
 * @desc    Get the user's upcoming assignments
 * @route   GET /api/assignments/upcoming
 * @access  Private
 */
export const getUpcomingAssignments = asyncHandler(async (req, res) => {
    const user = req.user;
    let query = {
        dueDate: { $gte: new Date() } // Assignments due from now onwards
    };

    if (user.role === 'tutor') {
        query.tutor = user._id;
    } else { // For students
        const student = await User.findById(user._id);
        query.course = { $in: student.enrolledCourses };
    }

    const assignments = await Assignment.find(query)
        .sort({ dueDate: 'asc' })
        .limit(5)
        .populate('course', 'title');

    res.status(200).json(new ApiResponse(200, assignments, "Upcoming assignments fetched successfully"));
});

/**
 * @desc    Get all assignments for a specific course
 * @route   GET /api/assignments/course/:courseId
 * @access  Private
 */
export const getAssignmentsByCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const user = req.user;

    // Authorization: User must be enrolled in the course or be the tutor
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }
    const isTutor = course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId);

    if (!isTutor && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view assignments for this course");
    }

    const assignments = await Assignment.find({ course: courseId }).sort({ dueDate: 'desc' });
    res.status(200).json(new ApiResponse(200, assignments, "Assignments for the course fetched successfully"));
});

/**
 * @desc    Create a new assignment for a course
 * @route   POST /api/assignments/create
 * @access  Private (Tutor)
 */
export const createAssignment = asyncHandler(async (req, res) => {
    const { courseId, title, description, dueDate } = req.body;
    const tutorId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Authorization: Check if the logged-in user is the instructor of the course
    if (course.instructor.toString() !== tutorId.toString()) {
        throw new ApiError(403, "You are not authorized to create assignments for this course");
    }

    const assignment = await Assignment.create({
        course: courseId,
        tutor: tutorId,
        title,
        description,
        dueDate
    });

    res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully"));
});

/**
 * @desc    Get details for a single assignment
 * @route   GET /api/assignments/:assignmentId
 * @access  Private
 */
export const getAssignmentById = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        throw new ApiError(400, "Invalid assignment ID format");
    }

    const assignment = await Assignment.findById(assignmentId).populate('course', 'title instructor');

    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }

    // Authorization: User must be enrolled in the course or be the tutor
    const isTutor = assignment.course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.some(id => id.toString() === assignment.course._id.toString());

    if (!isTutor && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view this assignment");
    }

    res.status(200).json(new ApiResponse(200, assignment, "Assignment details fetched successfully"));
});


/**
 * @desc    Submit work for an assignment
 * @route   POST /api/assignments/:assignmentId/submit
 * @access  Private (Student)
 */
export const submitAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { submissionContent } = req.body;
    const studentId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }

    // Check if the deadline has passed
    if (new Date(assignment.dueDate) < new Date()) {
        throw new ApiError(400, "The deadline for this assignment has passed.");
    }

    // Check if the student has already submitted
    const hasSubmitted = assignment.submissions.find(sub => sub.user.toString() === studentId.toString());
    if (hasSubmitted) {
        throw new ApiError(400, "You have already submitted this assignment.");
    }

    const submission = {
        user: studentId,
        submissionContent
    };

    assignment.submissions.push(submission);
    await assignment.save();

    res.status(201).json(new ApiResponse(201, submission, "Assignment submitted successfully"));
});
