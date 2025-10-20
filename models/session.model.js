import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Session title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    sessionTime: {
        type: Date,
        required: [true, 'Session time is required'],
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
    meetingLink: {
        type: String,
        // In a real app, this might be auto-generated
        default: 'https://meet.example.com/class/placeholder'
    }
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
