import asyncHandler from 'express-async-handler';
import Session from '../models/session.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';

/**
 * @desc    Get the user's upcoming sessions
 * @route   GET /api/schedule/upcoming
 * @access  Private
 */
export const getUpcomingSessions = asyncHandler(async (req, res) => {
    const user = req.user;
    let query = {
        sessionTime: { $gte: new Date() } // Sessions from now onwards
    };

    if (user.role === 'tutor') {
        query.tutor = user._id;
    } else { // For students
        const student = await User.findById(user._id);
        query.course = { $in: student.enrolledCourses };
    }

    const sessions = await Session.find(query)
        .sort({ sessionTime: 'asc' }) // Sort by the soonest
        .limit(5) // Limit to the next 5 sessions
        .populate('course', 'title category')
        .populate('tutor', 'fullName');

    res.status(200).json(new ApiResponse(200, sessions, "Upcoming sessions fetched successfully"));
});

/**
 * @desc    Get all sessions for a specific date
 * @route   GET /api/schedule/:date
 * @access  Private
 */
export const getSessionsByDate = asyncHandler(async (req, res) => {
    const { date } = req.params; // Expects date in YYYY-MM-DD format
    const user = req.user;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let query = {
        sessionTime: { $gte: startOfDay, $lte: endOfDay }
    };

    if (user.role === 'tutor') {
        query.tutor = user._id;
    } else {
        const student = await User.findById(user._id);
        query.course = { $in: student.enrolledCourses };
    }

    const sessions = await Session.find(query)
        .sort({ sessionTime: 'asc' })
        .populate('course', 'title')
        .populate('tutor', 'fullName');

    res.status(200).json(new ApiResponse(200, sessions, `Sessions for ${date} fetched successfully`));
});

/**
 * @desc    Schedule a new session for a course
 * @route   POST /api/schedule/create-session
 * @access  Private (Tutor)
 */
export const createSession = asyncHandler(async (req, res) => {
    const { courseId, title, description, sessionTime, meetingLink } = req.body;
    const tutorId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Authorization: Check if the logged-in user is the instructor of the course
    if (course.instructor.toString() !== tutorId.toString()) {
        throw new ApiError(403, "You are not authorized to create sessions for this course");
    }

    const session = await Session.create({
        course: courseId,
        tutor: tutorId,
        title,
        description,
        sessionTime,
        meetingLink
    });

    res.status(201).json(new ApiResponse(201, session, "Session created successfully"));
});

/**
 * @desc    Update or reschedule a session
 * @route   PUT /api/schedule/:sessionId/update
 * @access  Private (Tutor)
 */
export const updateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { title, description, sessionTime, meetingLink } = req.body;
    const tutorId = req.user._id;

    const session = await Session.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    // Authorization: Check if the logged-in tutor owns this session
    if (session.tutor.toString() !== tutorId.toString()) {
        throw new ApiError(403, "You are not authorized to update this session");
    }

    session.title = title || session.title;
    session.description = description || session.description;
    session.sessionTime = sessionTime || session.sessionTime;
    session.meetingLink = meetingLink || session.meetingLink;

    const updatedSession = await session.save();

    res.status(200).json(new ApiResponse(200, updatedSession, "Session updated successfully"));
});
