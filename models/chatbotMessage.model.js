import mongoose from 'mongoose';

const chatBotMessageSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    user: { // The student interacting with the bot
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    role: { // Who sent the message
        type: String,
        required: true,
        enum: ['user', 'model'] // 'user' for student, 'model' for AI
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Add an index for faster history retrieval
chatBotMessageSchema.index({ user: 1, course: 1, createdAt: 1 });

const ChatBotMessage = mongoose.model('ChatBotMessage', chatBotMessageSchema);

export default ChatBotMessage;
