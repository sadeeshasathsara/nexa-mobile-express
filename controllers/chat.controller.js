import asyncHandler from 'express-async-handler';
import ChatMessage from '../models/chatMessage.model.js';
import ChatBotMessage from '../models/chatbotMessage.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';

/**
 * @desc    Get chat message history for a course
 * @route   GET /api/chat/:courseId/history
 * @access  Private (Tutor or Enrolled Student)
 */
export const getChatHistory = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const user = req.user; // Logged-in user from protect middleware
    const userIdString = user._id.toString(); // Get user ID as string for comparison

    // Authorization: Check if user is enrolled or the tutor
    const course = await Course.findById(courseId).select('instructor');
    if (!course) {
        throw new ApiError(404, "Course not found");
    }
    const isTutor = course.instructor.toString() === userIdString;
    // We need the full user object to check enrolledCourses
    const fullUser = await User.findById(userIdString).select('enrolledCourses').lean();
    const isEnrolled = fullUser.enrolledCourses.some(id => id.toString() === courseId);


    if (!isTutor && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view this chat history.");
    }

    // Fetch messages, populate sender details, sort by newest first
    const messages = await ChatMessage.find({ course: courseId })
        .populate('sender', 'fullName avatarUrl') // Select fields you want from sender
        .sort({ createdAt: 'desc' }) // Get messages in reverse chronological order
        .lean(); // Use lean() for plain JS objects, makes modification easier

    // Map through messages to add the 'isMine' flag
    const formattedMessages = messages.map(message => {
        // Mongoose automatically converts sender._id to ObjectId, convert back for comparison
        const senderIdString = message.sender?._id.toString(); // Add null check for sender
        return {
            ...message,
            isMine: senderIdString === userIdString // Check if sender is the current user
        };
    });

    res.status(200).json(new ApiResponse(200, formattedMessages, "Chat history fetched successfully."));
});


/**
 * @desc    Handle incoming message to the course chatbot
 * @route   POST /api/chat/bot/:courseId
 * @access  Private (Student or Course Tutor)
 */
export const handleBotMessage = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { message } = req.body;
    const user = req.user; // Logged-in user (could be student or tutor)

    if (!message) {
        throw new ApiError(400, "Message content is required.");
    }

    // 1. Authorization & Fetch Course Context
    const course = await Course.findById(courseId).select('title description lessons instructor').lean(); // Use lean
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Authorization check: Allow if user is enrolled OR if user is the instructor
    const isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId);
    const isInstructor = course.instructor.toString() === user._id.toString();

    if (!isEnrolled && !isInstructor) {
        throw new ApiError(403, "You must be enrolled in or the instructor of this course to use the chatbot.");
    }

    // 2. Fetch Chat History (e.g., last 10 messages) for this specific user and course
    const history = await ChatBotMessage.find({ user: user._id, course: courseId })
        .sort({ createdAt: 1 }) // Fetch oldest first for chronological order
        .limit(10) // Limit history size
        .select('role message') // Only need role and message
        .lean();
    // No need to reverse now

    // 3. Prepare Gemini Prompt
    const systemPrompt = `You are Nexi, a helpful AI tutor for the Nexa Learning platform. You are assisting a user (could be a student or the course instructor) within the '${course.title}' course. Answer questions based ONLY on the provided course context and conversation history. Be concise and encouraging. Do not invent information. If the answer isn't in the context, say you don't have that information.`;

    let courseContext = `Course Context for "${course.title}":\nDescription: ${course.description}\nLessons:\n`;
    course.lessons.forEach(lesson => {
        courseContext += `- ${lesson.title}: ${lesson.description || 'No description available.'}\n`;
    });

    // Format history for Gemini
    const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.message }]
    }));

    // Add course context and new user message
    const userQueryWithContext = `${courseContext}\n\n---\n\n${message}`;
    geminiHistory.push({ role: 'user', parts: [{ text: userQueryWithContext }] });

    // 4. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: geminiHistory,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        // Optional: Add safetySettings if needed
    };

    let aiResponseText = "Sorry, I couldn't process that request."; // Default fallback
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini Chat API Error:", errorBody);
            // Don't throw, just use fallback response
        } else {
            const result = await response.json();
            // Add safety check for candidate existence
            if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
                aiResponseText = result.candidates[0].content.parts[0].text;
            } else {
                console.error("Gemini response structure unexpected:", result);
            }
        }
    } catch (error) {
        console.error("Error calling Gemini Chat API:", error);
        // Don't throw, just use fallback response
    }

    // 5. Save messages to DB (do this even if AI call fails, to keep history)
    try {
        await ChatBotMessage.create({
            course: courseId,
            user: user._id,
            role: 'user',
            message: message // Save the original user message
        });
        await ChatBotMessage.create({
            course: courseId,
            user: user._id,
            role: 'model',
            message: aiResponseText // Save the AI's response (or fallback)
        });
    } catch (dbError) {
        console.error("Error saving chat messages:", dbError);
        // Continue to send response to user even if DB save fails
    }

    // 6. Send Response
    res.status(200).json(new ApiResponse(200, { response: aiResponseText }, "Chatbot response received."));
});

