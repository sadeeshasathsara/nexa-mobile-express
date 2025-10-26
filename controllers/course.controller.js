import asyncHandler from 'express-async-handler';
import Course from '../models/course.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiResponse.js';
import User from '../models/user.model.js';
import Assignment from '../models/assignment.model.js';
import Session from '../models/session.model.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Quiz from '../models/quiz.model.js';

// Initialize GridFSBucket using the shared connection promise
let gfs;
connectDB().then(db => {
    gfs = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads'
    });
    console.log("GridFS initialized successfully for course controller.");
});

/**
 * @desc    Fetch all courses with optional filtering and search
 * @route   GET /api/courses
 * @access  Public
 */
export const getAllCourses = asyncHandler(async (req, res) => {
    // --- User Enrollment Check (Optional Auth) ---
    let enrolledCoursesSet = new Set();
    const token = req.cookies.jwt;

    if (token) {
        try {
            // If a token exists, verify it to find the user's enrollments
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('enrolledCourses').lean();
            if (user) {
                enrolledCoursesSet = new Set(user.enrolledCourses.map(id => id.toString()));
            }
        } catch (error) {
            // If token is invalid, just treat the user as a guest. Do not throw an error.
            console.log("Invalid token for optional auth, proceeding as guest.");
        }
    }

    // --- FILTERING ---
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'keyword'];
    excludedFields.forEach(el => delete queryObj[el]);

    let query = Course.find(queryObj);

    // --- KEYWORD SEARCH ---
    if (req.query.keyword) {
        query = query.find({
            $or: [
                { title: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } }
            ]
        });
    }

    // --- SORTING ---
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // Default sort
    }

    // --- PAGINATION ---
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default 10 per page
    const skip = (page - 1) * limit;

    // Get total count for pagination before applying skip and limit
    const totalCourses = await Course.countDocuments(query.getFilter());

    const courses = await query.skip(skip).limit(limit).populate('instructor', 'fullName').lean();

    // Add the isEnrolled flag to each course
    const coursesWithEnrollmentStatus = courses.map(course => ({
        ...course,
        isEnrolled: enrolledCoursesSet.has(course._id.toString())
    }));


    res.status(200).json(new ApiResponse(200, {
        courses: coursesWithEnrollmentStatus,
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalResults: totalCourses
    }, "Courses fetched successfully"));
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
 * @desc    Get courses for the logged-in user (enrolled for students, created for tutors)
 * @route   GET /api/courses/my-courses
 * @access  Private
 */
export const getMyCourses = asyncHandler(async (req, res) => {
    const user = req.user;

    if (user.role === 'student') {
        // --- Logic for Students: Fetch enrolled courses ---
        const student = await User.findById(user._id).populate({
            path: 'enrolledCourses',
            populate: {
                path: 'instructor',
                select: 'fullName'
            }
        });

        if (!student) {
            throw new ApiError(404, "Student not found");
        }

        res.status(200).json(new ApiResponse(200, student.enrolledCourses, "Enrolled courses fetched successfully"));

    } else if (user.role === 'tutor') {
        // --- Logic for Tutors: Fetch created courses ---
        const courses = await Course.find({ instructor: user._id });

        res.status(200).json(new ApiResponse(200, courses, "Your created courses fetched successfully"));

    } else {
        // Fallback for any other unexpected roles
        throw new ApiError(400, "Invalid user role");
    }
});

/**
 * @desc    Get a single course by ID with role-based data visibility
 * @route   GET /api/courses/:id
 * @access  Public (with enhanced data for authenticated users)
 */
export const getCourseById = asyncHandler(async (req, res) => {
    const courseId = req.params.id;
    const user = req.user; // Access user from optionalAuth middleware
    let isEnrolled = false;

    // 1. Check if user is enrolled (if a user exists)
    if (user) {
        // We need the full user object here to check enrollments
        const fullUser = await User.findById(user._id).select('enrolledCourses').lean();
        isEnrolled = fullUser.enrolledCourses.some(id => id.toString() === courseId);
    }

    // 2. Fetch the base course details
    // Populate instructor initially, quizzes will be fetched separately if needed
    const course = await Course.findById(courseId).populate('instructor', 'fullName email').lean();
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // 3. Determine if the user is the instructor
    const isInstructor = user ? course.instructor._id.toString() === user._id.toString() : false;

    // 4. Return data based on user's access level
    if (isInstructor || isEnrolled) {
        // --- FULL DATA VIEW (For Instructor or Enrolled Student) ---

        // Fetch related assignments, sessions, and quizzes
        const assignments = await Assignment.find({ course: courseId }).sort('dueDate');
        const sessions = await Session.find({ course: courseId }).sort('sessionTime');
        const quizzes = await Quiz.find({ course: courseId }).sort('-createdAt'); // Fetch quizzes

        const fullCourseData = {
            ...course,
            isEnrolled: true,
            assignments,
            sessions,
            quizzes, // Include quizzes in the response
        };

        res.status(200).json(new ApiResponse(200, fullCourseData, "Full course details fetched successfully"));

    } else {
        // --- PUBLIC PREVIEW VIEW (For Guest or Unenrolled Student) ---

        // Selectively choose fields to return for a public view
        const publicCourseData = {
            _id: course._id,
            title: course.title,
            description: course.description,
            category: course.category,
            difficulty: course.difficulty,
            durationWeeks: course.durationWeeks,
            imageUrl: course.imageUrl,
            instructor: course.instructor,
            rating: course.rating,
            numReviews: course.numReviews,
            reviews: course.reviews, // Include reviews for public view
            enrollments: course.enrollments,
            isEnrolled: false, // Explicitly set to false
        };

        res.status(200).json(new ApiResponse(200, publicCourseData, "Course preview details fetched successfully"));
    }
});


/**
 * @desc    Create a new course
 * @route   POST /api/courses/create
 * @access  Private/Tutor
 */
export const createCourse = asyncHandler(async (req, res) => {
    // req.user is available from the 'protect' middleware
    const { title, description, category, difficulty, durationWeeks } = req.body;

    const course = new Course({
        title,
        description,
        category,
        instructor: req.user._id, // The logged-in tutor is the instructor
        difficulty,
        durationWeeks
    });

    const createdCourse = await course.save();
    res.status(201).json(new ApiResponse(201, createdCourse, "Course created successfully"));
});


/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id/update
 * @access  Private/Tutor
 */
export const updateCourse = asyncHandler(async (req, res) => {
    const { title, description, category, difficulty, durationWeeks } = req.body;

    const course = await Course.findById(req.params.id);

    if (course) {
        // Authorization check: Ensure the user updating the course is the one who created it.
        if (course.instructor.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "User not authorized to update this course");
        }

        course.title = title || course.title;
        course.description = description || course.description;
        course.category = category || course.category;
        course.difficulty = difficulty || course.difficulty;
        course.durationWeeks = durationWeeks || course.durationWeeks;

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
    const course = await Course.findById(req.params.id);

    if (course) {
        // Authorization check: Ensure the user deleting the course is the one who created it.
        if (course.instructor.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "User not authorized to delete this course");
        }

        await course.deleteOne();
        res.status(200).json(new ApiResponse(200, {}, "Course deleted successfully"));

    } else {
        throw new ApiError(404, "Course not found");
    }
});


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


// --- LESSON MANAGEMENT CONTROLLERS ---

/**
 * @desc    Add a lesson to a course with file uploads
 * @route   POST /api/courses/:courseId/lessons
 * @access  Private/Tutor
 */
export const addLessonToCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // In a multipart/form-data request, non-file fields come in req.body.
    // We expect a JSON string named 'lessonData' with the lesson's metadata.
    if (!req.body.lessonData) {
        throw new ApiError(400, "Lesson data is missing.");
    }

    const { title, description, weekNumber, materialsMeta } = JSON.parse(req.body.lessonData);

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to add lessons to this course");
    }

    // Map the uploaded file info from req.files to the metadata provided.
    const materials = materialsMeta.map((meta, index) => {
        const file = req.files[index];
        if (!file) {
            // This case handles materials that are just links, with no file upload
            return meta;
        }
        // Save file to GridFS
        const stream = gfs.openUploadStream(file.originalname, {
            contentType: file.mimetype,
        });
        stream.end(file.buffer);

        return {
            ...meta,
            fileId: stream.id,
            filename: file.originalname,
            contentType: file.mimetype,
        };
    });

    const newLesson = {
        title,
        description,
        weekNumber,
        materials,
    };

    course.lessons.push(newLesson);
    await course.save();

    res.status(201).json(new ApiResponse(201, course.lessons.slice(-1)[0], "Lesson added successfully"));
});

/**
 * @desc    Get all lessons for a course
 * @route   GET /api/courses/:courseId/lessons
 * @access  Private (Tutor or Enrolled Student)
 */
export const getCourseLessons = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const user = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const isTutor = course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId);

    if (!isTutor && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view these lessons");
    }

    const lessonsWithFileUrls = course.lessons.map(lesson => {
        const materialsWithUrls = lesson.materials.map(material => {
            if (material.filename) {
                return {
                    ...material.toObject(),
                    url: `/api/files/${material.filename}`
                }
            }
            return material.toObject();
        });
        return {
            ...lesson.toObject(),
            materials: materialsWithUrls
        }
    });

    res.status(200).json(new ApiResponse(200, lessonsWithFileUrls, "Lessons fetched successfully"));
});

/**
 * @desc    Update a lesson in a course
 * @route   PUT /api/courses/:courseId/lessons/:lessonId
 * @access  Private/Tutor
 */
export const updateLessonInCourse = asyncHandler(async (req, res) => {
    // Note: This simplified update does not handle file changes.
    // A full implementation would require deleting old files from GridFS
    // and handling new file uploads.
    const { title, description, weekNumber, materials } = req.body;
    const { courseId, lessonId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update lessons in this course");
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    lesson.title = title || lesson.title;
    lesson.description = description || lesson.description;
    lesson.weekNumber = weekNumber || lesson.weekNumber;
    lesson.materials = materials || lesson.materials;

    await course.save();
    res.status(200).json(new ApiResponse(200, lesson, "Lesson updated successfully"));
});

/**
 * @desc    Delete a lesson from a course
 * @route   DELETE /api/courses/:courseId/lessons/:lessonId
 * @access  Private/Tutor
 */
export const deleteLessonFromCourse = asyncHandler(async (req, res) => {
    // Note: A full implementation would require deleting associated files from GridFS.
    const { courseId, lessonId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete lessons from this course");
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    lesson.deleteOne();
    await course.save();

    res.status(200).json(new ApiResponse(200, {}, "Lesson deleted successfully"));
});

/**
 * @desc    Get AI-powered course recommendations for the logged-in student
 * @route   GET /api/courses/recommendations
 * @access  Private (Student)
 */
export const getRecommendedCourses = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    // 1. Fetch student data (enrolled courses, preferences)
    const student = await User.findById(studentId).populate('enrolledCourses', 'title'); // Only populate title needed for context
    if (!student) {
        throw new ApiError(404, "Student not found");
    }
    const enrolledCourseIds = student.enrolledCourses.map(c => c._id);
    const enrolledCourseTitles = student.enrolledCourses.map(c => c.title).join(', ');

    // 2. Fetch all available courses (excluding enrolled ones)
    const availableCourses = await Course.find({ _id: { $nin: enrolledCourseIds } })
        .select('_id title description category difficulty') // Select fields needed for context
        .lean(); // Use lean for performance

    // 3. Prepare context for Gemini
    let studentProfileSummary = `Student is currently enrolled in: ${enrolledCourseTitles || 'None'}. `;
    if (student.preferredSubjects && student.preferredSubjects.length > 0) {
        studentProfileSummary += `Preferred subjects: ${student.preferredSubjects.join(', ')}. `;
    }
    if (student.interestTags && student.interestTags.length > 0) {
        studentProfileSummary += `Interest tags: ${student.interestTags.join(', ')}. `;
    }
    if (student.education) {
        studentProfileSummary += `Education background: ${student.education}.`;
    }

    const availableCoursesContext = availableCourses.map(c =>
        `ID: ${c._id}, Title: ${c.title}, Category: ${c.category}, Difficulty: ${c.difficulty}, Description: ${c.description}`
    ).join('\n');

    // 4. Gemini API Prompt & Schema
    const systemPrompt = "You are an academic advisor for the Nexa online learning platform. Your goal is to recommend relevant courses to students based on their profile and the available course catalog.";

    const userQuery = `
        Based on the following student profile and the list of available courses, please recommend 3-5 courses (provide only their IDs) that would be a good next step for this student. Prioritize courses that logically follow or complement their enrolled courses, match their preferred subjects and interest tags, and consider the difficulty level. 

        Student Profile:
        ${studentProfileSummary}

        Available Courses:
        ${availableCoursesContext}
    `;

    const recommendationSchema = {
        type: 'OBJECT',
        properties: {
            recommendedCourseIds: {
                type: 'ARRAY',
                items: { type: 'STRING' } // Expecting MongoDB ObjectIds as strings
            }
        },
        required: ["recommendedCourseIds"]
    };

    // 5. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: recommendationSchema,
        }
    };

    let recommendedCourseIds = [];
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini Recommendation API Error:", errorBody);
            // Fallback: Return featured courses if AI fails
            const featured = await getFeaturedCourses(req, res); // Reuse existing function
            return; // Exit here as featured function sends response
        }

        const result = await response.json();
        recommendedCourseIds = JSON.parse(result.candidates[0].content.parts[0].text).recommendedCourseIds;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback: Return featured courses if AI fails
        const featured = await getFeaturedCourses(req, res); // Reuse existing function
        return; // Exit here as featured function sends response
    }

    // 6. Fetch recommended course details from DB
    const recommendedCourses = await Course.find({ _id: { $in: recommendedCourseIds } })
        .populate('instructor', 'fullName'); // Populate instructor name

    res.status(200).json(new ApiResponse(200, recommendedCourses, "Recommended courses fetched successfully."));
});

