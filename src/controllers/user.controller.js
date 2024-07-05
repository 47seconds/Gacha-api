import { asyncHandler } from '../utils/asyncHandler.util.js';

const userRegistration = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "OK"
    });
});