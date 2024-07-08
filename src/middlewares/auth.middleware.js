import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // cookies will have accessToken, or we can get them through headers from mobile applications (read JWT docs)
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!accessToken) throw new ApiError(401, "Unauthorized request");

    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedAccessToken?._id).select(
      "-password -refreshToken"
    ); // Since we signed jwt token with _id
    if (!user) throw new ApiError(401, "Invalid Access token");

    // now add a value on req object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access token");
  }
});
