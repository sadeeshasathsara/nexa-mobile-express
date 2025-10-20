import { GridFsStorage } from 'multer-gridfs-storage';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';

dotenv.config();

const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                // Create a unique filename with the original file extension
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads' // This will create 'uploads.files' and 'uploads.chunks' collections in MongoDB
                };
                resolve(fileInfo);
            });
        });
    }
});

export default storage;

