import multer from "multer";
import {nanoid} from 'nanoid';

// We can store the uploaded file on disk or memory. Since we we recieve a big file, ram will be compromised, we will go with disk method
// We get a 'file' option in function which express don't give, express give (req, res)
const storage = multer.diskStorage({
    destination: function(req, file, callBack) {
        callBack(null, "./public/temp");
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + nanoid(8);  // We can add suffix etc for our tempfile, since user can upload many files with same name, this can potentially overwrite or append (1), etc to file name, making impossible to locate
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

export const upload = multer({
    storage: storage
});