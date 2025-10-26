import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiResponse.js';

// Helper function to generate JWT and set it as a cookie
const generateTokenAndSetCookie = (res, user) => {
    const tokenPayload = {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return token;
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new ApiError(400, 'User already exists');
    }

    const user = await User.create({
        fullName,
        email,
        password,
        role,
    });

    if (user) {
        generateTokenAndSetCookie(res, user);
        const createdUser = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        };
        res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
    } else {
        throw new ApiError(400, 'Invalid user data');
    }
});


/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const token = generateTokenAndSetCookie(res, user);
        const loggedInUser = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            token: token
        };
        res.status(200).json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
    } else {
        throw new ApiError(401, 'Invalid email or password');
    }
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
    // To log out, we replace the JWT cookie with an empty string
    // and set its expiration date to a time in the past.
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0), // Set to a past date
    });

    // Send a success response
    res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});

