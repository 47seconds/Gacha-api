import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
    {
        VideoFile: {
            type: String,    // Cloudinary / AWS media bucket url
            required: true,
        },
        thumbnail: {
            type: String,    // Cloudinary / AWS media bucket url
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