import mongoose from 'mongoose';

// Sub-schema for individual lecture materials (PDF, Video, etc.)
const lessonMaterialSchema = new mongoose.Schema({
    materialType: {
        type: String,
        enum: ['Video', 'PDF', 'Slide', 'External Link'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    // GridFS metadata
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    filename: {
        type: String,
    },
    contentType: {
        type: String,
    }
});

// Sub-schema for a single lesson within a course
const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    weekNumber: {
        type: Number,
    },
    materials: [lessonMaterialSchema]
});


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
    numReviews: {
        type: Number,
        default: 0,
    },
    reviews: [{
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }],
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
    lessons: [lessonSchema] // Using the detailed lesson schema
}, {
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

export default Course;

