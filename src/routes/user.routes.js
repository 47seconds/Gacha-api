import { Router } from "express";
import { userRegistration } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.route('/register').post(userRegistration);
userRouter.route('/register').get(userRegistration);

export default userRouter;  