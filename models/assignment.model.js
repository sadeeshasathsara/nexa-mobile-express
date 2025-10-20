import mongoose from 'mongoose';

// Sub-schema for student submissions
const submissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    submissionContent: {
        type: String, // Can be a link to a file or text content
        required: [true, 'Submission content is required']
    },
    grade: {
        type: String, // e.g., 'A+', '85/100', 'Pending'
        default: 'Pending'
    }
});

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course',
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    submissions: [submissionSchema]
}, {
    timestamps: true
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
