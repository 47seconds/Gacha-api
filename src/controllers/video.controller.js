import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import {User} from '../models/user.model.js';
import {Video} from '../models/video.model.js';
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import ffmpeg from "ffmpeg";
import mongoose from "mongoose";

const videoUpload = asyncHandler(async (req, res) => {
    // ALGORITHM
    // verify user login
    // get video title and optional description
    // get video
    // get thumbnail
    // upload video on cloudinary
    // upload thumbnail on cloudinary
    // upload video details on database
    // remove locally stored assets
    // response with video response

    const user = User.findById(req?.user._id);
    if(!user) throw new ApiError(401, "unauthorized! login before upload");

    const {title, description} = req.body.title;
    if(!title) throw new ApiError(400, "video title required");
    if(!description) description = title;       // description setted to title by default

    let videoLocalPath;
    if(req.files && Array.isArray(req.files.video) && req.files.video) {
        videoLocalPath = req.files.video[0]?.path;
    } else throw new ApiError(400, "no video uploaded");

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail) {
        thumbnailLocalPath = req.files.thumbnail[0]?.path;
    } else throw new ApiError(400, "no thumbnail was uploaded");

    const video = await uploadOnCloudinary(videoLocalPath);
    if (!video) throw new ApiError(500, "failed to upload video on cloudinary server");
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) throw new ApiError(500, "failed to upload thumbnail on cloudinary server");

    const uploadedVideo = await Video.create({
        videoUrl: video.url,
        videoPublicId: video.public_id,
        thumbnailUrl: thumbnail.url,
        thumbnailPublicId: thumbnail.public_id,
        title,
        description: description,
        duration: video.duration,
        owner: req.user
    });
    if(!uploadedVideo) throw new ApiError(500, "ERROR: failed to upload video on database");

    // revoving local assets
    removeAssets([videoLocalPath, thumbnailLocalPath]);

    // no need to destructure into a new variable as all fieldes will be sent in response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            uploadedVideo,
            "video uploaded successfully"
        )
    );
});

const videoIdSearch = asyncHandler(async (req, res) => {
    const {vedioid} = req.params;
    const video = Video.aggregate([
        {
            $match:
            _id = mongoose.Types.ObjectId(vedioid)
        },
        {
            $lookup: {
                localField: 'owner',
                from: 'users',
                foreignField: '_id',
                as: 'owner',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatarUrl: 1
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            }
                        }
                    }
                ]
            },
        }
    ]);

    if (!video?.length) throw new ApiError(400, "no such video exists");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video[0],
            "video fetched successfully"
        )
    )
});

export {videoUpload, videoIdSearch}