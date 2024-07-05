import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

// Cloudinary configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // If localFilePath is null
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        });

        console.log("File uploaded successfully. ", response.url);
        return response;
    } catch (error) {
        // If failed to upload, delete that locally stored file from server
        fs.unlinkSync(localFilePath);
        return null;
    }
}