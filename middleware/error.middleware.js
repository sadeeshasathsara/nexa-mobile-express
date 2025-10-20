/**
 * @desc Handles requests for routes that do not exist.
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the next middleware
};

/**
 * @desc A centralized error handler for the application.
 * Catches errors passed by `next(error)` and sends a formatted response.
 */
const errorHandler = (err, req, res, next) => {
    // Sometimes an error might come in with a 200 status code, so we override it
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Mongoose specific error for bad ObjectIds
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    }

    res.status(statusCode).json({
        message: message,
        // Only show the stack trace in development for debugging
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };
