import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import jwt from 'jsonwebtoken';
import { generateAccessAndRefreshToken } from "./generateAccessAndRefreshToken.util.js";

export const generateUserAccessToken = asyncHandler(async (req, res, next) => {
    // Look for refresh token from cookies
    const cookieRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    try {
        const decodedRefreshToken = jwt.verify(cookieRefreshToken, REFRESH_TOKEN_SECRET);
        if(!decodedRefreshToken) throw new ApiError(401, "unauthorized request");
    
        // Look for user from decoded token's payload
        const requestUser = await User.findById(decodedRefreshToken?._id);
        if(!requestUser) throw new ApiError(400, "Invalid refresh token");
    
        // Compare refresh tokens from decoded and from database
        if(requestUser?.refreshToken !== decodedRefreshToken) throw new ApiError(401, "refresh token expired or invalid");
    } catch (error) {
        throw new ApiError(500, "failed to verify refresh token");
    }

    // Refresh refresh token and give new access token
    const {accessToken, refreshToken, user} = generateAccessAndRefreshToken(requestUser._id);
    return {accessToken, refreshToken, user};
});