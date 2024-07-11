import { Router } from "express";
import {
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
    userWatchHistory,
} from "../controllers/user.controller.js";
import { uploadImages } from "../middlewares/multer.middleware.js";
import {userSession} from '../middlewares/userSession.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// verifyJWT makes a req.user field in req if user is logged in

userRouter.route("/register").post(
    uploadImages.fields([
        // Added file upload middleware for avatar, and coverImage from frontend when user registers
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    userRegistration
);

userRouter.route("/login").post(userSession, userLogin);
userRouter.route("/logout").post(verifyJWT, userLogout); // authenticate user before logout using access token
userRouter.route("/refresh-token").post(userRefreshToken); // no need to authentiate, we are generating new access token, so verifuJWT method wont work
userRouter.route("/delete-account").delete(verifyJWT, userDelete); // delete account, but we need req.url first
userRouter.route("/change-password").patch(verifyJWT, userPasswordChange); // change user password
userRouter.route("/me").get(verifyJWT, userCurrent); // get current user
userRouter.route("/update-account-details").patch(verifyJWT, userDetailsUpdate); // update account details (text only)
userRouter
    .route("/change-avatar")
    .patch(verifyJWT, uploadImages.single("avatar"), userAvatarUpdate); // update user avatar
userRouter
    .route("/change-cover-image")
    .patch(verifyJWT, uploadImages.single("coverImage"), userCoverImageUpdate); // update user cover image
userRouter.route("/channel/:username").get(verifyJWT, userChannelProfile); // get any channel profile
userRouter.route("/history").get(verifyJWT, userWatchHistory); // get user watch history

export default userRouter;
        