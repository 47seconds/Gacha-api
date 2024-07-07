// const asyncHandler = () => {}
// const asyncHandler = (fn) => {() => {}}
// const asyncHandler = (fn) => () => {}
// const asyncHandler = (fn) => async () => {}


// Wrap async functions using a util middleware
// Method 1 - Try and Catch
// const asyncHandler = (fn) = async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// Method 2 - Promises
const asyncHandler = (requesthandler) => {
    return (req, res, next) => {
        Promise
        .resolve(requesthandler(req, res, next))
        .catch((err) => next(err));
    }
}

export {asyncHandler}