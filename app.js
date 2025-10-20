import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// --- Import Routes ---
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';

// --- Import Error Handling Middleware ---
import { errorHandler } from './middleware/error.middleware.js';

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Use morgan for logging in development mode
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/schedule', scheduleRoutes);

// --- Health Check Route ---
app.get('/', (req, res) => {
    res.status(200).json({ message: "Welcome to the Nexa Learning API!" });
});


// --- Error Handling Middleware (Optional but Recommended) ---
app.use(errorHandler);

export default app;

