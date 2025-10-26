import mongoose from 'mongoose';
import connectDB from '../config/db.js';

// Initialize GridFSBucket using the shared connection promise
let gfs;
connectDB().then(db => {
    gfs = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads'
    });
    console.log("GridFS initialized successfully for file controller.");
});

/**
 * @desc    Get a file from GridFS and stream it
 * @route   GET /api/files/:filename
 * @access  Public
 */
export const getFileByFilename = async (req, res) => {
    try {
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized.' });
        }
        const files = await gfs.find({ filename: req.params.filename }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        const file = files[0];

        // Set content type and stream the file
        res.set('Content-Type', file.contentType);
        const readstream = gfs.openDownloadStream(file._id);
        readstream.pipe(res);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

