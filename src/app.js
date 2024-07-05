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
import userRouter from './routes/user.routes.js';

// Declare routes
app.use('/users', userRouter);

export {app}