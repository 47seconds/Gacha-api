import { asyncHandler } from '../utils/asyncHandler.util.js';
import {userRegistrationValidation, userEmailValidation, userExisted} from '../validations/user';

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
   
});

export {userRegistration, test}