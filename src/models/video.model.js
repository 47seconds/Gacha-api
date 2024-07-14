import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videoUrl: {
            type: String,    // Cloudinary / AWS media bucket url
            required: true,
        },
        videoPublicId: {
            type: String,
            required: true
        },
        thumbnailUrl: {
            type: String,    // Cloudinary / AWS media bucket url
            required: true
        },
        thumbnailPublicId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,   // Cloudinary / AWS media bucket give duration of media
            required: true
        },
        views: {
            type: Number,
            default: 0,
            // required: true  // since default is 0, no need for required field
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);