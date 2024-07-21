import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

        const userSchema = new Schema(
            {
                username: {
                    type: String,
                    required: true,
                    unique: true,
                    lowercase: true,
                    trim: true,
                    index: true     // This is used on a field that will be searched most (ONLY USE WHEN NECESSARY AS IT WILL COST)
                },
                email: {
                    type: String,
                    required: true,
                    unique: true,
                    lowercase: true,
                    trim: true,
                },
                fullName: {
                    type: String,
                    required: true,
                    unique: false,
                    lowercase: false,
                    trim: true,
                    index: true     // This is used on a field that will be searched most (ONLY USE WHEN NECESSARY AS IT WILL COST)
                },
                avatarUrl: {
                    type: String,   // Cloudinary / AWS media bucket
                    required: true,
                },
                avatarPublicId: {   // will be used to delete assets
                    type: String,
                    required: true
                },
                coverImageUrl: {
                    type: String,   // Cloudinary / AWS media bucket
                    required: false
                },
                coverImagePublicId: {   // will be used to delete assets
                    type: String,
                    required: false
                },
                watchHistory: [
                    {
                        type: mongoose.Types.ObjectId,
                        ref: 'Video'
                    }
                ],
                password: {
                    type: String,
                    required: [true, 'Password is required']
                },  
                refreshToken: {
                    type: String
                }
            },
            {
                timestamps: true
            }
        );

userSchema.pre('save', async function(next) {               // pre is a hook and save is a middleware used to execute code 'pre' to 'save' in database
    if (!this.isModified('password')) return next();        // Only hash password when it is modified or first time entered, not just when user change its avatar, or anything, otherwise this will hash password beyond recovery
    this.password = await bcrypt.hash(this.password, 10);   // We use function rather than arrow function so we have access to context (i.e. userSchema), and hash password field just before saving it to database with 10 rounds of encryption (variable, more rounds means beter encryption, but more time)
    next();
});

// Here we defined custom hook for comparing password
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
}

// Generating tokens
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(    // Read jwt docs to learn more, encryption here dont take much time, thats why some people have security concerns
        {
            _id: this._id,
            // email: this.email,
            // username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(    // Same as above, just refresh token holds less info, as it keeps refreshing
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model('User', userSchema);