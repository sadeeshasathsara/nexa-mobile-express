import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to the User model (for the tutor)
    },
    description: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    enrollments: {
        type: Number,
        default: 0,
    },
    durationWeeks: {
        type: Number,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true,
    },
    imageUrl: {
        type: String,
        default: 'https://placehold.co/600x400/7B68EE/FFFFFF?text=Course',
    },
    // You can add more complex fields for course content
    // e.g., lessons, quizzes, assignments
    lessons: [{
        title: String,
        content: String,
        videoUrl: String,
    }]
}, {
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

export default Course;

