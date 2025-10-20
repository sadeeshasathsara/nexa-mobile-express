// Import required packages
import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Create the server
const server = http.createServer(app);

// Define the port
const PORT = process.env.PORT || 5001;

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port http://localhost:${PORT}/`);
});