import { Router } from "express";
import {
    userLogin,
    userLogout,
    userRegistration,
    userRefreshToken,
    userDelete,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
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

userRouter.route("/login").post(userLogin);

userRouter.route("/logout").post(verifyJWT, userLogout); // authenticate user before logout using access token

userRouter.route("/refresh-token").post(userRefreshToken); // no need to authentiate, we are generating new access token, so verifuJWT method wont work

userRouter.route("/delete-account").delete(verifyJWT, userDelete);        // delete account, but we need req.url first

export default userRouter;
