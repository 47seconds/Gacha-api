import { ApiError } from "./ApiError.util.js";
import { User } from "../models/user.model.js";

export const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if(!user) throw new ApiError(400, "no such user");

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ ValidieBeforeSave: false });

    return { accessToken, refreshToken, user };
  } catch {
    throw new ApiError(500, "failed to generate access and refresh token");
  }
};
