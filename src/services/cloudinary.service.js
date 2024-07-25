import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from 'path';
import { nanoid } from "nanoid";
import { ApiError } from "../utils/ApiError.util.js";
import { removeAssets } from "../utils/removeAssets.util.js";

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        // If localFilePath is null
        if (!localFilePath)
            throw new ApiError(400, "file not exist to upload on cloudinary");


        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: folder,
            timeout: 60000,
        });

        // console.log("File uploaded successfully. ", response.url);
        // fs.unlink(localFilePath);       // Delete file after successfully uploaded on cloudinary server
        // console.log(response);
        delete response.api_key; // Delete api key used from response for security
        return response;
    } catch (error) {
        // If failed to upload, delete that locally stored file from server
        // fs.unlinkSync(localFilePath);
        console.log(error);
        return null;
    }
};

export const uploadHLSonCloudinary = async (hlsPath, username) => {
    try {
        const files = fs.readdirSync(hlsPath);
        const filesLocalPaths = files.map(file => path.join(hlsPath, file));
        const shottieId = nanoid();
        const shottieFolder = `${username}/${shottieId}`;

        const uploadPromises = filesLocalPaths.map(async file => {
            let filename = path.basename(file);
            let res = null;
            if (path.extname(filename) === '.m3u8') {
                filename = filename.replace(path.extname(filename), '');
                res = await cloudinary.uploader.upload(file, {
                    resource_type: "raw",
                    folder: shottieFolder,
                    public_id: filename,
                    timeout: 60000,
                });
            } else {
                filename = filename.replace(path.extname(filename), '');
                res = await cloudinary.uploader.upload(file, {
                    resource_type: "raw",
                    folder: shottieFolder,
                    public_id: filename,
                    timeout: 60000,
                });
            }

            return res;
        });
        const response = await Promise.all(uploadPromises);
        const shottieIndex = response.find(res => res?.display_name == 'index.m3u8')

        return shottieIndex;
    } catch (error) {
        console.log("Error while uploading HLS:", error);
        removeAssets([hlsPath]);
        return null;
    }
}

export const removeOneFromCloudinary = async (assetPublicId) => {
    try {
        const response = await cloudinary.uploader.destroy(assetPublicId);
        return response;
    } catch (error) {
        return null;
    }
};
export const removeManyFromCloudinary = async (assetPublicIdArray) => {
    try {
        const response = await cloudinary.api.delete_resources(assetPublicIdArray);
        return response;
    } catch {
        return null;
    }
};