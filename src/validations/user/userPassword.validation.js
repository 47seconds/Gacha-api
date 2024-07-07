import {ApiError} from '../../utils/ApiError.util.js';
import disallowedCharacters from '../../resources/disallowedCharacters.json';

export const userPasswordValidation = (password) => {
    if (password.length < 8) throw new ApiError(409, "ERROR: password should be greater than or equal to 8 letters");
    
    for (let char of password) {
        if (disallowedCharacters.includes(char)) throw new ApiError(409, `ERROR: password provided contains '${char}' character which is not allowed`);
    }
}