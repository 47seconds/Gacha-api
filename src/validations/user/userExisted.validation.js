import {User} from '../../models/user.model.js';
import {ApiError} from '../../utils/ApiError.util.js';

export const userExisted = async (username, email) => {
    // const existedUser = User.findOne({
    //     $or: [{username}, {email}]
    // });
    const existedUserUsername = await User.findOne({username});
    const existedUserEmail = await User.findOne({email});

    if (existedUserUsername) throw new ApiError(409, "ERROR: username already taken");
    if (existedUserEmail) throw new ApiError(409, "ERROR: another account with this email already exists");
}