import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'is invalid'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['student', 'tutor'],
        default: 'student',
    },
    education: {
        type: String,
        trim: true,
    },
    avatarUrl: {
        type: String,
        default: 'https://placehold.co/400x400/7B68EE/FFFFFF?text=User',
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    createdCourses: [{ // Note: This field seems unused based on current logic, might remove later
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    preferredSubjects: {
        type: [String],
        default: []
    },
    interestTags: {
        type: [String],
        default: []
    },
    // --- New Language Preference Field ---
    preferredLanguage: {
        type: String,
        default: 'en', // Default to English
        trim: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Middleware to hash password before saving a user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);

export default User;

