import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { removeAssets } from "../utils/removeAssets.util.js";
import {
    userRegistrationValidation,
    userEmailValidation,
    userPasswordValidation,
    userExisted,
} from "../validations/user/index.js";
import {
    uploadOnCloudinary,
    removeOneFromCloudinary,
    removeManyFromCloudinary
} from "../services/cloudinary.service.js";
import { User } from "../models/user.model.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshToken.util.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Global cookie options for sending cookies
// maxAge is different so will specify using destructureing them, else if not declare, these will become session cookies
// CLIENT SIDE HAVE TO STORE USER DATA IN COOKIES THEMSELVES AND LOAD THAT IT APPLICATION ACCORDINGLY | GACHA FRONTEND HAVE THIS FEATURE.
const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'None', // Since Backend and Frontend on different domains
};

const userRegistration = asyncHandler(async (req, res) => {
    // ALGORITHM
    // get user credencials from frontend
    // validate credentials - null check, etc
    // check if user not already exist
    // check for images and avatars
    // upload them to cloudinary
    // create user object - create entry to database
    // remove password (encrypted) and refresh token, etc unnecessary fields from response
    // check for user creation from response validation
    // remove locally stored temporary assets
    // return response

    const { fullName, email, username, password } = req.body;

    // VALIDATIONS
    userRegistrationValidation([fullName, email, username, password]); // Validate user credentials
    userEmailValidation(email); // Valid email address validation
    userExisted(username, email); // Check if another user with same credentials exists
    userPasswordValidation(password); // Check if password is empty and not contain any special symbol which may be a potential injection script

    // CHECKING FOR AVATAR AND COVER IMAGE
    // re.body is given by express, but since we used a middleware - multer, it gives us additional property of files
    // console.log(req.body);  // got only non-file data
    // console.log(req.files);    // got only file uploaded data

    // we doing so as avatar is needed, but cover image is optional (may change in future)
    let avatarLocalPath; // avatar prop defined in routes middleware - multer
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar) {
        avatarLocalPath = req.files?.avatar[0]?.path;
    } else {
        throw new ApiError(400, "ERROR: please upload a avatar");
    }

    let coverImageLocalPath; // coverImage prop defined in routes middleware - multer
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    } else {
        coverImageLocalPath = "";
    }

    try {
        // upload images to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath, username);
        if (!avatar) throw new ApiError(400, "ERROR: avatar not uploaded");

        let coverImage = "";
        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath, username);
        }
        // console.log(avatar);
        // if (!coverImage) throw new ApiError(400, "ERROR: cover image not uploaded, please retry");

        // CREATING ENTRY OF NEW USER IN DATABASE
        const user = await User.create({
            fullName,
            avatarUrl: avatar.secure_url,
            avatarPublicId: avatar.public_id, // will be used to delete assets
            coverImageUrl: coverImage?.secure_url || "", // since coverImage is optional in user madel
            coverImagePublicId: coverImage?.public_id, // will be used to delete assets
            email,
            username: username.toLowerCase(),
            password,
        });

        // CHECKING FOR NEW USER CREATION
        if (!user) throw new ApiError(500, "ERROR: failed to create new user");

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        // REMOVING ENCRYPTED PASSWORD AND REFRESH TOKEN AS USER DON'T NEED THEM FROM RESPONSE
        const createdUser = { ...user };
        delete createdUser._doc.password;
        delete createdUser._doc.refreshToken;

        // REMOVING LOCALLY STORED TEMPORARY ASSETS
        removeAssets([avatarLocalPath, coverImageLocalPath]);

        // SENDING RESPONSE
        console.log(
            `account '${createdUser._doc.username}' created successfully`
        );
        return res
            .status(201)
            .cookie("accessToken", accessToken, {cookieOptions, maxAge: 86400000}) // exp in 1 day
            .cookie("refreshToken", refreshToken, {...cookieOptions, maxAge: 864000000}) // exp in 10 days
            .json(
                new ApiResponse(
                    200,
                    createdUser._doc,
                    "User created successfully"
                )
            );
    } catch (error) {
        // REMOVING LOCALLY STORED TEMPORARY ASSETS
        removeAssets([avatarLocalPath, coverImageLocalPath]);
        throw new ApiError(500, error.message);
    }
});

const userLogin = asyncHandler(async (req, res) => {
    // ALGORITHM
    // We take data from user or we take credendials cookies
    // Search for user in database
    // Validate account password or if access and
    // generate access and refresh token
    // send cookie

    // LOGIN DATA FROM USER
    const { email, username, password } = req.body;
    if (!(email || username))
        throw new ApiError(400, "ERROR: please provide email or username");

    // SEARCH FOR USER
    let loginUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!loginUser) throw new ApiError(404, "ERROR: User does not exist");

    // VALIDATE PASSWORD
    const isPasswordValid = await loginUser.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "ERROR: wrong password");

    // GENERATE ACCESS AND REFRESH TOKEN
    const { accessToken, refreshToken, user } =
        await generateAccessAndRefreshToken(loginUser._id);

    // SEND COOKIE
    // we have loginUser object, but since we updated it with tokens, so we either have to call db again, or simply take updated loginUser from export of generateAccessAndRefreshToken method
    loginUser = { ...user };
    // destructuring will return many properties of mongoDB response, _doc contains our response data
    delete loginUser._doc.refreshToken;
    delete loginUser._doc.password;
    const loggedInUser = {
        ...loginUser._doc,
        // refreshToken,
        // accessToken
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, {...cookieOptions, maxAge: 86400000}) // exp in 1 dat
        .cookie("refreshToken", refreshToken, {...cookieOptions, maxAge: 864000000}) // exp in 10 day
        .json(
            new ApiResponse(200, loggedInUser, "user logged in successfully")
        );
});

const userLogout = asyncHandler(async (req, res) => {
    // got req.user from verifuJWT middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            },
        },
        {
            new: true, // will return latest value of object after update, as we are not storing this instance in a variable
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const userRefreshToken = asyncHandler(async (req, res) => {
    // Look for refresh token from cookies
    const cookieRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    const decodedRefreshToken = jwt.verify(
        cookieRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedRefreshToken) throw new ApiError(401, "unauthorized request");

    // Look for user from decoded token's payload
    const requestUser = await User.findById(decodedRefreshToken?._id);
    if (!requestUser) throw new ApiError(400, "Invalid refresh token");

    // Compare refresh tokens from decoded and from database
    if (requestUser?.refreshToken !== cookieRefreshToken)
        throw new ApiError(401, "refresh token expired or invalid");

    // Refresh refresh token and give new access token
    const { accessToken, refreshToken } = generateAccessAndRefreshToken(
        requestUser._id
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken,
                },
                "access token generated"
            )
        );
});

const userCurrent = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "user fetched successfully"));
});

const userPasswordChange = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isEnteredPasswordCorrect =
        await user.isPasswordCorrect(currentPassword);

    if (!isEnteredPasswordCorrect)
        throw new ApiError(401, "entered password is incorrect");

    user.password = newPassword;
    await user.save({
        ValidateBeforeSave: false,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"));
});

const userDetailsUpdate = asyncHandler(async (req, res) => {
    // These fields may chage in future
    let { username, fullName, email } = req.body;

    if (!(username || email || fullName))
        throw new ApiError(400, "none of the details are changed");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                // in case only some details are required to change
                fullName: fullName || req.user.fullname,
                email: email || req.user.email,
                username: username || req.user.username,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "user details updated"));
});

const userAvatarUpdate = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "no avatar was uploaded");

    try {
        const oldAvatarPublicId = req.user?.avatarPublicId;

        const avatar = await uploadOnCloudinary(avatarLocalPath, username);
        if (!avatar.secure_url) throw new ApiError(500, "unable to upload avatar");

        let user = await User.findByIdAndUpdate(
            req?.user._id,
            {
                $set: {
                    avatarUrl: avatar.secure_url,
                    avatarPublicId: avatar.public_id,
                },
            },
            {
                new: true,
            }
        );

        if (!user) throw new ApiError(500, "failed to update avatar");

        let oldAvatarRemovedResponse;
        try {
            oldAvatarRemovedResponse =
                await removeOneFromCloudinary(oldAvatarPublicId);
        } catch (error) {
            oldAvatarRemovedResponse = null;
        }

        removeAssets([avatarLocalPath]);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user,
                    avatarDeleteStatus: oldAvatarRemovedResponse,
                },
                "avatar updated successfully"
            )
        );
    } catch (error) {
        removeAssets([avatarLocalPath]);
        throw new ApiError(500, error.message);
    }
});

const userCoverImageUpdate = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath)
        throw new ApiError(400, "no cover image was uploaded");

    try {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath, username);
        if (!coverImage.secure_url)
            throw new ApiError(500, "unable to upload cover image");

        const oldCoverImagePublicId = req.user?.coverImagePublicId;

        const user = await User.findByIdAndUpdate(
            req?.user._id,
            {
                $set: {
                    coverImageUrl: coverImage.secure_url,
                    coverImagePublicId: coverImage.public_id,
                },
            },
            {
                new: true,
            }
        );

        if (!user) throw new ApiError(500, "failed to update cover image");

        let oldCoverImageRemovedResponse;
        try {
            oldCoverImageRemovedResponse = await removeOneFromCloudinary(
                oldCoverImagePublicId
            );
        } catch (error) {
            oldCoverImageRemovedResponse = null;
        }

        removeAssets([coverImageLocalPath]);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user,
                    coverImageDeleteStatus: oldCoverImageRemovedResponse,
                },
                "cover image updated successfully"
            )
        );
    } catch (error) {
        removeAssets([coverImageLocalPath]);
        throw new ApiError(500, error.message);
    }
});

const userDelete = asyncHandler(async (req, res) => {
    if (!req.user?._id) throw new ApiError(400, "user is not logged in");

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(400, "user does not exist");

    try {
        const response = await User.findByIdAndDelete(req?.user._id);
        const avatarCoverImageDeleteResponse = await removeManyFromCloudinary([
            req.user.avatarPublicId,
            req.user?.coverImagePublicId,
        ]);

        console.log(`account '${response.username}' deleted successfully`);
        return res
            .status(200)
            .clearCookie("accessToken", cookieOptions) // clear cookies on logout else, when login these cookies interfere
            .clearCookie("refreshToken", cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        response,
                        cloudinaryDeleteStatus: avatarCoverImageDeleteResponse,
                    },
                    "user deleted successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, "failed to delete user");
    }
});

const userChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) throw new ApiError(400, "no username provided");

    const channel = await User.aggregate([
        {
            // First: search for user
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            // Second: users who suscribed to same channel, therefore select current channel for subscribers
            // The $lookup stage performs a left outer join with the subscriptions collection. It matches the _id field of the users (from the User collection) with the channel field in the subscriptions collection. The results are stored in the subscribers field of the user document.
            $lookup: {
                from: "subscriptions", // since MongoDB changes collection names to plural with lowercases
                localField: "_id", // user id for current channel (got from $match pipeline that returned/passed channel's user details)
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            // Third: current channel who suscribed to other channel, therefore select subscriber as our current channel has suscribed to other channel
            $lookup: {
                from: "subscriptions", // since MongoDB changes collection names to plural with lowercases
                localField: "_id", // user id for current channel
                foreignField: "subscriber",
                as: "suscribedToChannels",
            },
        },
        {
            // Forth: count subscribers and suscribed channels
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                suscribedToChannelsCount: {
                    $size: "$suscribedToChannels",
                },
                isSuscribed: {
                    // if our current user has suscribed to current channel
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            // Fifth: choose what data regarding curring channel to display on frontend
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                suscribedToChannelsCount: 1,
                isSuscribed: 1,
                avatarUrl: 1,
                coverImageUrl: 1,
                // email: 1
            },
        },
    ]);

    // if no channel is found
    if (!channel?.length) throw new ApiError(400, "no such channel exists");

    return res.status(200).json(
        new ApiResponse(
            200,
            channel[0], // since only one channel with unique username
            "channel fetched successfully"
        )
    );
});

// const userWatchHistory = asyncHandler(async (req, res) => {
//     const user = await User.aggregate([
//         {
//             // find user
//             $match: {
//                 // since mongoose _id is moongose OnjectId object, but req.user._id will be string, by parsing it mongoose take care of converting it to ObjectId, but pipelines don't, so we have to forcefylly convert it
//                 _id: new mongoose.Types.ObjectId(req.user._id),
//             },
//         },
//         {
//             $lookup: {
//                 localField: "watchHistory",
//                 from: "videos",
//                 foreignField: "_id",
//                 as: "watchHistory",
//                 pipeline: [
//                     // since watchHistory has owner field as user, we need that info too
//                     {
//                         $lookup: {
//                             localField: "owner",
//                             from: "users",
//                             foreignField: "_id",
//                             as: "owner",
//                             pipeline: [
//                                 {
//                                     $project: {
//                                         // as each owner has its own user properties -> [{fullname, username, ...}], if this pipeline was done outside, we would have array of users (owners) will all details -> [{fullname, ...(all)}, {...}, ...], and sorting them would have been very difficult
//                                         fullName: 1,
//                                         username: 1,
//                                         avatarUrl: 1,
//                                     },
//                                 },
//                             ],
//                         },
//                     },
//                     {
//                         $addFields: {
//                             owner: {
//                                 // for frontend, since only first object in array is our owner, just send that as response
//                                 $first: "$owner",
//                             },
//                         },
//                     },
//                 ],
//             },
//         },
//     ]);

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 user[0].watchHistory,
//                 "user watch history fetched successfully"
//             )
//         );
// });

const userLikedVideos = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likedBy",
                as: "likes",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "video", // from likes model
                            foreignField: "_id",
                            as: "likedVideoDetails",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "owner",
                                        foreignField: "_id",
                                        as: "ownerDetails",
                                        pipeline: [
                                            {
                                                $project: {
                                                    fullName: 1,
                                                    username: 1,
                                                    avatarUrl: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $arrayElemAt: ["$ownerDetails", 0]
                                        }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $addFields: {
                            video: {
                                $arrayElemAt: ["$likedVideoDetails", 0]
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedVideos: {
                    $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                            video: "$$like.video"
                        }
                    }
                }
            }
        }
    ]);

    if (!user) throw new ApiError(400, "no such user to view liked videos");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user.likedVideos,
            "liked videos fetched successfully"
        )
    );
});

export {
    userRegistration,
    userLogin,
    userLogout,
    userRefreshToken,
    userPasswordChange,
    userCurrent,
    userDetailsUpdate,
    userAvatarUpdate,
    userCoverImageUpdate,
    userDelete,
    userChannelProfile,
    // userWatchHistory,
    userLikedVideos,
};
