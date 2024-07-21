import multer from "multer";
import {nanoid} from 'nanoid';
import { ApiError } from "../utils/ApiError.util";

// We can store the uploaded file on disk or memory. Since we we recieve a big file, ram will be compromised, we will go with disk method
// We get a 'file' option in function which express don't give, express give (req, res)
const storage = multer.diskStorage({
    destination: function(req, file, callBack) {
        callBack(null, "./public/temp");
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + nanoid(8);  // We can add suffix etc for our tempfile, since user can upload many files with same name, this can potentially overwrite or append (1), etc to file name, making impossible to locate
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

// File filter to accept only specified file types
const imageFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    // Check the file extension
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    // Check the mime type
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ApiError(415, 'ERROR: Only JPEG, PNG, and PDF files are allowed!'));
    }
};

// File filter to accept only specified file types
const videoFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /mp4|mkv|mov|flv|webm|avi|wmv/;
    // Check the file extension
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    // Check the mime type
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ApiError(415, 'ERROR: Only JPEG, PNG, and PDF files are allowed!'));
    }
};

export const uploadVideos = multer({
    storage: storage,
    fileFilter: videoFilter
});

export const uploadImages = multer({
    storage: storage,
    fileFilter: imageFilter
});