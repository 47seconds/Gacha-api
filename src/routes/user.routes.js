import { Router } from "express";
import { userRegistration } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js';

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

export default userRouter;  