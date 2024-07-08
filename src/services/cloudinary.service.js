import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "../utils/ApiError.util.js";

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        // If localFilePath is null
        if (!localFilePath)
            throw new ApiError(400, "file not exist to upload on cloudinary");

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // console.log("File uploaded successfully. ", response.url);
        // fs.unlink(localFilePath);       // Delete file after successfully uploaded on cloudinary server
        // console.log(response);
        delete response.api_key; // Delete api key used from response for security
        return response;
    } catch (error) {
        // If failed to upload, delete that locally stored file from server
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export const removeOneFromCloudinary = async (assetUrl) => {
    try {
        const response = await cloudinary.uploader.destroy(assetUrl);
        return response;
    } catch (error) {
        return null;
    }
};
export const removeManyFromCloudinary = async (assetsUrlArray) => {
    try {
        const response = await cloudinary.api.delete_resources(assetsUrlArray);
        return response;
    } catch {
        return null;
    }
};
