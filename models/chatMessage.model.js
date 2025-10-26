import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    course: { // Acts as the chat room identifier
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    // Optional: Add fields for read status, reactions, etc. later
}, {
    timestamps: true // Adds createdAt and updatedAt
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
