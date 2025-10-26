import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let connectionPromise = null;

const connectDB = () => {
    // If the promise already exists, return it to avoid creating new connections
    if (connectionPromise) {
        return connectionPromise;
    }

    // Create a new connection promise
    connectionPromise = mongoose.connect(process.env.MONGO_URI)
        .then(mongooseInstance => {
            console.log(`🔌 MongoDB Connected: ${mongooseInstance.connection.host}`);
            // Resolve the promise with the native DB object, which GridFS needs
            return mongooseInstance.connection.db;
        })
        .catch(err => {
            console.error(`DB Connection Error: ${err.message}`);
            process.exit(1);
        });

    return connectionPromise;
};

export default connectDB;

