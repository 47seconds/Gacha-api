import { ApiError } from '../utils/ApiError.util.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import {userRegistrationValidation, userEmailValidation, userExisted} from '../validations/user';
import {uploadOnCloudinary} from '../services/cloudinary.service.js';
import {User} from '../models/user.model.js';

const userRegistration = asyncHandler( async (req, res) => {
   // get user credencials from frontend
   // validate credentials - null check, etc
   // check if user not already exist
   // check for images and avatars
   // upload them to cloudinary
   // create user object - create entry to database
   // remove password (encrypted) and refresh token, etc unnecessary fields from response
   // check for user creation from response validation
   // return response

   const [fullName, email, username, password] = req.body;
   console.log("email: ", email);

   // Validations
   userRegistrationValidation([fullName, email, username, password]);   // Validate user credentials
   userEmailValidation(email);                                          // Valid email address validation
   userExisted(username, email);                                        // Check if another user with same credentials exists
   userPasswordValidation(password);                                    // Check if password is empty and not contain any special symbol which may be a potential injection script
   
   // checking for avatar and coverimage
   // re.body is given by express, but since we used a middleware - multer, it gives us additional property of files
   const avatarLocalPath = req.files?.avatar[0]?.path;            // avatar prop defined in routes middleware - multer
   const coverImageLocalPath = req.files?.coverImage[0]?.path;    // coverImage prop defined in routes middleware - multer
   if (!avatarLocalPath) throw new ApiError(400, "ERROR: please upload a avatar");
   // if (!coverImageLocalPath) throw new ApiError(400, "ERROR: please upload a cover image");

   // upload images to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if (!avatar) throw new ApiError(400, "ERROR: avatar not uploaded, please retry");
   // if (!coverImage) throw new ApiError(400, "ERROR: cover image not uploaded, please retry");

   // create entry in database for new user
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",     // since coverImage is optional in user madel
      email,
      username: username.toLowerCase(),
      password,
   });

   // removing encrypted password and refreshToken as user dont need them from response
   const createdUser = await User.findById(user._id).select(   // check if user is created (this process may be removed as it makes more db calls and slows platform)
      "-password -refreshToken"
   );

   // checking for user creation
   if(!createdUser) throw new ApiError(500, "ERROR: failed to create new user. Please try again.");

   //sending response
   return res.status(201).json(
      new ApiResponse(200, createdUser, "User created successfully")
   );
});

export {userRegistration, test}