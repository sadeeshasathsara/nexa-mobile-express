import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
// Correctly import pdf-parse for ES Modules
const pdf = (await import('pdf-parse')).default;
import Course from '../models/course.model.js';
import Quiz from '../models/quiz.model.js';
import User from '../models/user.model.js'; // Import User model
import { ApiResponse, ApiError } from '../utils/apiResponse.js';

// Initialize GridFSBucket safely
let gfs;
mongoose.connection.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
    console.log("GridFS initialized successfully for quiz controller.");
});

/**
 * @desc    Generate a quiz using AI based on course content
 * @route   POST /api/quizzes/generate
 * @access  Private/Tutor
 */
export const generateQuiz = asyncHandler(async (req, res) => {
    const { courseId, selectedLessons, selectedDocuments, quizSettings } = req.body;
    const tutorId = req.user._id;

    // 1. --- AUTHORIZATION & DATA FETCHING ---
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }
    if (course.instructor.toString() !== tutorId.toString()) {
        throw new ApiError(403, "You are not authorized to generate quizzes for this course.");
    }

    // 2. --- CONTENT AGGREGATION ---
    let context = `Course Title: ${course.title}\nCourse Description: ${course.description}\n\n`;

    // Aggregate content from selected lessons
    selectedLessons.forEach(lessonId => {
        const lesson = course.lessons.id(lessonId);
        if (lesson) {
            context += `Lesson Title: ${lesson.title}\nLesson Description: ${lesson.description}\n\n`;
        }
    });

    // Aggregate content from selected documents (PDFs from GridFS)
    for (const filename of selectedDocuments) {
        if (!gfs) {
            throw new ApiError(500, "GridFS is not initialized. Please try again in a moment.");
        }
        const files = await gfs.find({ filename }).toArray();
        if (files.length > 0) {
            const file = files[0];
            if (file.contentType === 'application/pdf') {
                const stream = gfs.openDownloadStream(file._id);
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);
                const data = await pdf(buffer);
                context += `Document Content (${filename}):\n${data.text}\n\n`;
            }
        }
    }

    // 3. --- GEMINI API PROMPT & SCHEMA ---
    const questionTypes = Object.keys(quizSettings.questionTypes).filter(key => quizSettings.questionTypes[key]).join(', ');

    const systemPrompt = `You are an expert educator creating a quiz for an online course. Based on the provided context, generate a quiz that matches the user's specifications. Ensure the answers are accurate according to the context.`;

    const userQuery = `
        Context: """${context}"""
        
        Please generate a quiz with the following properties:
        - Number of Questions: ${quizSettings.numberOfQuestions}
        - Difficulty: ${quizSettings.difficulty}
        - Question Types: ${questionTypes}
        
        For multipleChoice questions, provide 4 options, with one being the correct answer.
        For trueFalse questions, the answer must be either "True" or "False".
        For shortAnswer questions, provide a concise and correct answer.
    `;

    const quizGenerationSchema = {
        type: 'OBJECT',
        properties: {
            title: { type: 'STRING' },
            difficulty: { type: 'STRING', enum: ['Easy', 'Medium', 'Hard'] },
            questions: {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: {
                        questionText: { type: 'STRING' },
                        questionType: { type: 'STRING', enum: ['multipleChoice', 'trueFalse', 'shortAnswer'] },
                        options: { type: 'ARRAY', items: { type: 'STRING' } },
                        answer: { type: 'STRING' }
                    },
                    required: ['questionText', 'questionType', 'answer']
                }
            }
        },
        required: ['title', 'difficulty', 'questions']
    };

    // 4. --- CALL GEMINI API ---
    // Use the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: quizGenerationSchema,
        }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", errorBody);
        throw new ApiError(500, "Failed to generate quiz from AI service.");
    }

    const result = await response.json();
    const quizData = JSON.parse(result.candidates[0].content.parts[0].text);

    // 5. --- SAVE QUIZ TO DATABASE ---
    const newQuiz = await Quiz.create({
        ...quizData,
        course: courseId,
        tutor: tutorId,
    });

    // Add quiz reference to the course
    course.quizzes.push(newQuiz._id);
    await course.save();

    res.status(201).json(new ApiResponse(201, newQuiz, "Quiz generated and saved successfully."));
});


/**
 * @desc    Get details for a single quiz by ID
 * @route   GET /api/quizzes/:quizId
 * @access  Private (Tutor or Enrolled Student)
 */
export const getQuizById = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        throw new ApiError(400, "Invalid Quiz ID format");
    }

    const quiz = await Quiz.findById(quizId).populate('course', 'instructor'); // Populate course instructor only

    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Authorization: Check if the user is the tutor or enrolled in the course
    const isTutor = quiz.tutor.toString() === user._id.toString(); // Check against quiz.tutor
    const studentData = await User.findById(user._id).select('enrolledCourses');
    const isEnrolled = studentData.enrolledCourses.some(courseId => courseId.toString() === quiz.course._id.toString());

    if (!isTutor && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view this quiz.");
    }

    // Return the quiz details
    res.status(200).json(new ApiResponse(200, quiz, "Quiz details fetched successfully."));
});

/**
 * @desc    Publish or schedule a quiz
 * @route   PUT /api/quizzes/:quizId/publish
 * @access  Private (Tutor)
 */
export const publishQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { action, settings } = req.body; // action can be 'publish' or 'schedule'
    const tutorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        throw new ApiError(400, "Invalid Quiz ID format");
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Authorization: Ensure the logged-in user is the tutor who created the quiz
    if (quiz.tutor.toString() !== tutorId.toString()) {
        throw new ApiError(403, "You are not authorized to publish this quiz.");
    }

    // Update settings
    quiz.settings.sendNotifications = settings.sendNotifications ?? quiz.settings.sendNotifications;
    quiz.settings.showResults = settings.showResults ?? quiz.settings.showResults;
    quiz.settings.allowRetakes = settings.allowRetakes ?? quiz.settings.allowRetakes;

    let message = "";

    if (action === 'publish' && settings.publishNow) {
        quiz.published = true;
        quiz.scheduledPublishTime = null; // Clear any previous schedule
        message = "Quiz published successfully.";
        // TODO: Implement notification logic here if sendNotifications is true
    } else if (action === 'publish' && !settings.publishNow && settings.scheduledTime) {
        quiz.published = false; // It's not published *yet*
        quiz.scheduledPublishTime = new Date(settings.scheduledTime); // Use scheduledTime
        message = `Quiz scheduled successfully for ${quiz.scheduledPublishTime.toLocaleString()}.`;
        // TODO: Implement a background job scheduler (like node-cron or Agenda) to handle actual publishing later
    } else {
        // Handle cases like unpublishing or just saving settings without changing status
        // For simplicity, we assume the main actions are publish now or schedule
        message = "Quiz settings updated.";
        // Optionally add logic to unpublish if needed
    }

    const updatedQuiz = await quiz.save();

    res.status(200).json(new ApiResponse(200, updatedQuiz, message));
});


/**
 * @desc    Get available quizzes for the logged-in user
 * @route   GET /api/quizzes/available
 * @access  Private
 */
export const getAvailableQuizzes = asyncHandler(async (req, res) => {
    const user = req.user;
    let query = {};

    // Base filter for published or scheduled quizzes
    const now = new Date();
    const availabilityFilter = {
        $or: [
            { published: true },
            { scheduledPublishTime: { $lte: now } } // Include scheduled quizzes whose time has arrived
        ]
    };

    if (user.role === 'student') {
        // Find quizzes for courses the student is enrolled in that are available
        const student = await User.findById(user._id).select('enrolledCourses');
        if (!student) throw new ApiError(404, "Student not found");

        query = {
            course: { $in: student.enrolledCourses },
            ...availabilityFilter
        };
    } else if (user.role === 'tutor') {
        // Tutors see all quizzes they have created
        query = { tutor: user._id };
    } else {
        throw new ApiError(400, "Invalid user role");
    }

    const quizzes = await Quiz.find(query)
        .populate('course', 'title') // Populate course title
        .select('title questions difficulty course published scheduledPublishTime createdAt') // Added createdAt
        .sort('-createdAt'); // Sort by newest first

    // Map to the desired response format
    const formattedQuizzes = quizzes.map(quiz => {
        return {
            _id: quiz._id,
            name: quiz.title,
            numberOfQuestions: quiz.questions.length,
            difficulty: quiz.difficulty,
            courseName: quiz.course?.title || 'Unknown Course', // Safely access course title
            isAvailable: quiz.published || (quiz.scheduledPublishTime && quiz.scheduledPublishTime <= now), // Determine availability
            createdAt: quiz.createdAt // Include the creation date/time
        };
    });

    res.status(200).json(new ApiResponse(200, formattedQuizzes, "Available quizzes fetched successfully."));
});



