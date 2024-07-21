            import express, { urlencoded } from 'express';
            import cors from 'cors';
            import cookieParser from 'cookie-parser';

            const app = express();
            app.use(cors({
                origin: process.env.CORS_ORIGIN,
                credentials: true,
            }))

            app.use(express.json({limit: '16kb'}));     // Our server can now accept json, with limit 16kb so server wont be flooded.
            app.use(urlencoded({extended: true, limit: '16kb'}));   // handles request from url with special url encoding, extended means json nesting is allowed, and limit is again set.
            app.use(express.static('public'));  // the files/assets that are stored in server to be accessed everywhere.
            app.use(cookieParser());

            // Import routes
            const apiRoute = express.Router();
            import userRouter from './routes/user.routes.js';
            import videoRouter from './routes/video.routes.js';

            // Declare routes
            apiRoute.use('/user', userRouter);
            apiRoute.use('/video', videoRouter);

            // Main route from API
            app.use('/api/v1', apiRoute);

            export {app}