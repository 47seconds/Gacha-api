import { Router } from "express";
import {videoUpload, videoIdSearch} from '../controllers/video.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadVideos } from "../middlewares/multer.middleware.js";

const videoRouter = Router();

videoRouter.route('/upload').post(
    verifyJWT,
    uploadVideos.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail"
        }
    ]),
    videoUpload
);

videoRouter.route('/get-video/:vedioid').get(videoIdSearch);

export default videoRouter;