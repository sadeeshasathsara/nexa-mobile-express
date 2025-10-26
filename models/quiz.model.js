import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        enum: ['multipleChoice', 'trueFalse', 'shortAnswer'],
        required: true,
    },
    options: {
        type: [String], // For multiple choice questions
    },
    answer: {
        type: mongoose.Schema.Types.Mixed, // Can be a string or an array of strings
        required: true,
    }
});

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true,
    },
    questions: [questionSchema],
    // --- New Fields for Publishing ---
    published: {
        type: Boolean,
        default: false,
    },
    scheduledPublishTime: {
        type: Date,
        default: null, // Null if published immediately or not scheduled
    },
    settings: {
        sendNotifications: { type: Boolean, default: true },
        showResults: { type: Boolean, default: true },
        allowRetakes: { type: Boolean, default: false },
    }
}, {
    timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;

