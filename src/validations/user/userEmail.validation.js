import {ApiError} from '../utils/ApiError.util.js';
import emailDomains from '../resources/emailDomains.json';

export const userEmailValidation = (userEmail) => {
    const userEmailDomain = userEmail.split('@');

    if (userEmailDomain[1] == '') {
        throw new ApiError(400, "ERROR: please provide Email correctly");
    } else if (
        emailDomains.includes(userEmailDomain[1])
    ) {
        console,log('Email is valid');
    } else {
        throw new ApiError(409, "ERROR: please provide your email address");
    }
}