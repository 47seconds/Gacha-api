import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { processShottie } from "../services/hls.service.js";
import { uploadHLSonCloudinary } from "../services/cloudinary.service.js";
import { removeAssets } from "../utils/removeAssets.util.js";
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
    if (!user) throw new ApiError(401, "unauthorized! login before upload");

    const { caption } = req.body;
    if (!caption) throw new ApiError(400, "video caption required");

    let videoLocalPath;
    if (req.files && Array.isArray(req.files.video) && req.files.video) {
        videoLocalPath = req.files.video[0]?.path;
    } else throw new ApiError(400, "no video uploaded");

    // let thumbnailLocalPath;
    // if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail) {
    //     thumbnailLocalPath = req.files.thumbnail[0]?.path;
    // } else throw new ApiError(400, "no thumbnail was uploaded");
    const shottieLocalPath = await processShottie(
        videoLocalPath,
        req?.user.username
    );
    const video = await uploadHLSonCloudinary(
        shottieLocalPath,
        req?.user.username
    );
    if (!video)
        throw new ApiError(500, "failed to upload video on cloudinary server");

    // const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    // if (!thumbnail) throw new ApiError(500, "failed to upload thumbnail on cloudinary server");

    const uploadedVideo = await Video.create({
        videoUrl: video.secure_url,
        videoPublicId: video.public_id,
        // thumbnailUrl: thumbnail.url,
        // thumbnailPublicId: thumbnail.public_id,
        caption: caption,
        owner: req.user,
    });
    if (!uploadedVideo)
        throw new ApiError(500, "ERROR: failed to upload video on database");

    // revoving local assets
    removeAssets([
        videoLocalPath,
        shottieLocalPath,
        // thumbnailLocalPath,
    ]);

    // no need to destructure into a new variable as all fieldes will be sent in response
    return res
        .status(200)
        .json(
            new ApiResponse(200, uploadedVideo, "video uploaded successfully")
        );
});

const videoIdSearch = asyncHandler(async (req, res) => {
    const { videoid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoid))
        throw new ApiError(401, "invalid video id");

    try {
        const video = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoid),
                },
            },
            {
                $lookup: {
                    localField: "owner",
                    from: "users",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatarUrl: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner",
                    },
                },
            },
        ]);

        if (!video?.length) throw new ApiError(400, "no such video exists");

        return res
            .status(200)
            .json(new ApiResponse(200, video[0], "video fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const getSortedAllLatestVideos = asyncHandler(async (req, res) => {
    try {
        const latestVideos = await Video.find({}, "videoUrl")
            .sort({ updatedAt: -1 })
            .limit(5);

        // since latestVideos return a object array of 'videoUrl'
        const latestVideosUrls = latestVideos.map((video) => video.videoUrl);
        return res
            .status(200)
            .json(
                new ApiResponse(200, latestVideosUrls, "videos urls fetched")
            );
    } catch (error) {
        throw new ApiError(500, "ERROR: failed to fetch videos");
    }
});

export { videoUpload, videoIdSearch, getSortedAllLatestVideos };
