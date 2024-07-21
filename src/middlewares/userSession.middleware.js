import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshToken.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

// Check if user have session cookies so no login required
export const userSession = asyncHandler(async (req, res, next) => {
    const accessToken =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    const { refreshToken } = req.cookies; // NOTE: NEVER SEND REFRESH TOKEN FROM HEADER AS IT IS PRONE TO MAN IN THE MIDDLE ATTACK

    if (accessToken && refreshToken) {
        jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET,
            async (errorAccess, decodedAccessToken) => {
                if (errorAccess) {
                    jwt.verify(
                        refreshToken,
                        process.env.REFRESH_TOKEN_SECRET,
                        async (errorRefresh, decodedRefreshToken) => {
                            if (errorRefresh)
                                throw new ApiError(
                                    400,
                                    "ERROR: Refresh token expired or invalid"
                                );
                            const { accessToken, refreshToken, user } =
                                await generateAccessAndRefreshToken(
                                    decodedRefreshToken._id
                                );
                            const sessionUser = { ...user };
                            delete sessionUser._doc.refreshToken;
                            delete sessionUser._doc.password;
                            return res
                                .status(201)
                                .cookie(
                                    "accessToken",
                                    accessToken,
                                    cookieOptions
                                )
                                .cookie(
                                    "refreshToken",
                                    refreshToken,
                                    cookieOptions
                                )
                                .json(
                                    new ApiResponse(
                                        201,
                                        {
                                            refreshToken,
                                            accessToken,
                                            user,
                                        },
                                        "new session token generated"
                                    )
                                );
                        }
                    );
                } else {
                    const { accessToken, refreshToken, user } =
                        await generateAccessAndRefreshToken(
                            decodedAccessToken._id
                        );
                    req.user = user;
                    return res
                        .status(200)
                        .cookie("accessToken", accessToken, cookieOptions)
                        .cookie("refreshToken", refreshToken, cookieOptions)
                        .json(
                            new ApiResponse(200, user, "user already logged in")
                        );
                }
            }
        );
    } else {
        next();
    }
});
