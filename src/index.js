import 'dotenv/config'
import connectDB from './db/index.js';
import { app } from './app.js';

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`sever running on http://localhost:${process.env.PORT}/api/v1...`);
    });
    app.on('errror', (error) => {
        console.log("ERRROR: ", error);
        throw error;
    })
})
.catch((err) => {
    console.log("Connection to database failed...\nERROR: ", err);
});