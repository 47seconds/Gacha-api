import {ApiError} from '../../utils/ApiError.util.js';

// We check for user credentials here, since all fields will be string '?' operator won't return null or undefined, since no such is present, but in future if we validate something not string here, it won't throw error and will just return null or undefined (we can compare it wil "" || null || undefined in that case)
export const userRegistrationValidation = (userCredentials) => {
    if(
        userCredentials.some((field) => field?.trim() === "")
       ) {
        throw new ApiError(400, "All fields are required!");
       }
}