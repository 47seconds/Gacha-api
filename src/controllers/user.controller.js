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
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import { User } from "../models/user.model.js";
import {generateAccessAndRefreshToken} from '../utils/generateAccessAndRefreshToken.util.js';


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
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar
  ) {
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

  // upload images to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar)
    throw new ApiError(400, "ERROR: avatar not uploaded, please retry");

  let coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
  // console.log(avatar);
  // if (!coverImage) throw new ApiError(400, "ERROR: cover image not uploaded, please retry");

  // CREATING ENTRY OF NEW USER IN DATABASE
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // since coverImage is optional in user madel
    email,
    username: username.toLowerCase(),
    password,
  });

  // REMOVING ENCRYPTED PASSWORD AND REFRESH TOKEN AS USER DON'T NEED THEM FROM RESPONSE
  const createdUser = await User.findById(user._id).select(
    // check if user is created (may remove this process as it makes more db calls and slows platform)
    "-password -refreshToken"
  );

  // CHECKING FOR NEW USER CREATION
  if (!createdUser)
    throw new ApiError(
      500,
      "ERROR: failed to create new user. Please try again."
    );

  // REMOVING LOCALLY STORED TEMPORARY ASSETS
  removeAssets([avatarLocalPath, coverImageLocalPath]);

  // SENDING RESPONSE
  console.log(`User '${createdUser.username}' created successfully`);
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});


const userLogin  = asyncHandler(async (req, res) => {
  // ALGORITHM
  // We take data from user
  // Seach for user in database
  // Validate account password
  // generate access and refresh token
  // send cookie

  // LOGIN DATA FROM USER
  const {email, username, password} = req.body;
  if(!(email || username)) throw new ApiError(400, "ERROR: please provide email or username");

  // SEARCH FOR USER
  let loginUser = await User.findOne({
    $or: [{username}, {email}]
  });
  if (!loginUser) throw new ApiError(404, "ERROR: User does not exist");

  // VALIDATE PASSWORD
  const isPasswordValid = await loginUser.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "ERROR: wrong password");

  // GENERATE ACCESS AND REFRESH TOKEN
  const {accessToken, refreshToken, user} = await generateAccessAndRefreshToken(loginUser._id);

  // SEND COOKIE
  // we have loginUser object, but since we updated it with tokens, so we either have to call db again, or simply take updated loginUser from export of generateAccessAndRefreshToken method
  loginUser = {...user};
  // destructuring will return many properties of mongoDB response, _doc contains our response data
        delete loginUser._doc.refreshToken;
        delete loginUser._doc.password;

  const cookieOptions = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, cookieOptions)
  .cookie("refreshToken", refreshToken, cookieOptions)
  .json(
    new ApiResponse(
      200,
      {
        user: loginUser._doc, accessToken, refreshToken
      },
      "user logged in successfully"
    )
  );
});


const userLogout = asyncHandler(async (req, res) => {
  // got req.user from verifuJWT middleware
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    // {
      // new: true      // will return latest value of object after update, as we are not storing this instance in a variable
    // }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", cookieOptions)
  .clearCookie("refreshToken", cookieOptions)
  .json(
    new ApiResponse(
      200,
      {},
      "user logged out successfully"
    )
  );
});

export { userRegistration, userLogin, userLogout};
