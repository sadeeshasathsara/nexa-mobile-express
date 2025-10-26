import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import http from 'http'; // Import Node.js http module
import { Server } from 'socket.io'; // Import socket.io
import jwt from 'jsonwebtoken';
import User from './models/user.model.js';
import ChatMessage from './models/chatMessage.model.js';
import Course from './models/course.model.js'; // Needed for authorization

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Or your frontend URL
        credentials: true
    }
});

// Middleware for Socket.IO authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('jwt=')[1];

        console.log("Attempting to verify token:", token);

        if (!token) {
            return next(new Error('Authentication error: No token'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }
        socket.user = user; // Attach user to the socket object
        next();
    } catch (error) {
        console.error("Socket Auth Error:", error.message);
        next(new Error('Authentication error'));
    }
});


// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.fullName} (ID: ${socket.id})`);

    socket.on('joinRoom', async (courseId) => {
        try {
            // Authorization: Check if user is enrolled or the tutor
            const course = await Course.findById(courseId).select('instructor');
            const isTutor = course.instructor.toString() === socket.user._id.toString();
            const isEnrolled = socket.user.enrolledCourses.some(id => id.toString() === courseId);

            if (isTutor || isEnrolled) {
                socket.join(courseId);
                console.log(`${socket.user.fullName} joined room: ${courseId}`);
                // Optionally emit a confirmation or user list back to the client
            } else {
                console.log(`Unauthorized attempt to join room ${courseId} by ${socket.user.fullName}`);
                // Optionally emit an error back to the client
                socket.emit('error', 'Not authorized to join this chat room.');
            }
        } catch (error) {
            console.error("Error joining room:", error.message);
            socket.emit('error', 'Error joining chat room.');
        }
    });

    socket.on('sendMessage', async ({ courseId, message }) => {
        try {
            // Basic check if user is in the room (socket.io handles this partially)
            if (!socket.rooms.has(courseId)) {
                return socket.emit('error', 'You must join the room before sending messages.');
            }

            // Save message to database
            const chatMessage = await ChatMessage.create({
                course: courseId,
                sender: socket.user._id,
                message: message
            });

            // Populate sender details for broadcasting
            const messageToSend = await ChatMessage.findById(chatMessage._id).populate('sender', 'fullName avatarUrl');

            // Broadcast message to everyone in the room *including* the sender
            io.to(courseId).emit('newMessage', messageToSend);
            console.log(`Message sent in room ${courseId} by ${socket.user.fullName}`);

        } catch (error) {
            console.error("Error sending message:", error.message);
            socket.emit('error', 'Error sending message.');
        }
    });

    socket.on('leaveRoom', (courseId) => {
        socket.leave(courseId);
        console.log(`${socket.user.fullName} left room: ${courseId}`);
    });


    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.user?.fullName || socket.id}`);
        // Socket.IO automatically handles leaving rooms on disconnect
    });
});


const startServer = async () => {
    try {
        await connectDB();
        // Use the HTTP server to listen, not the Express app directly
        server.listen(PORT, () => {
            console.log(`🚀 Server (with Socket.IO) is running on port http://localhost:${PORT}/`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

