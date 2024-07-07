import { Router } from "express";
import { userLogin, userLogout, userRegistration } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js';
import {verifyJWT} from '../middlewares/auth.middleware.js';

const userRouter = Router();

userRouter.route('/register').post(
    upload.fields([         // Added file upload middleware for avatar, and coverImage from frontend when user registers
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    userRegistration
);

userRouter.route('/login').post(userLogin);

userRouter.route('/logout').post(verifyJWT, userLogout);

export default userRouter;  