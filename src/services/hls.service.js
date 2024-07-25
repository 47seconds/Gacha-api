import { ApiError } from "../utils/ApiError.util.js"
import { ApiResponse } from "../utils/ApiResponse.util.js"
import path from 'path';
import fs from 'fs';
import util from 'util';
import { exec } from "child_process"

const execAsync = util.promisify(exec);

export const processShottie = async (shottieVideoPath, username) => {
    
    const outputDir = path.dirname(shottieVideoPath);
    const hlsPath = path.join(outputDir, username);
    
    if (!fs.existsSync(hlsPath)) fs.mkdirSync(hlsPath, {recursive: true});

    const ffmpegConversionCommand = `ffmpeg -i ${shottieVideoPath} -codec:v libx264 -codec:a aac -hls_time 5 -hls_playlist_type vod -hls_segment_filename "${hlsPath}/segment%02d.ts" -start_number 0 "${hlsPath}/index.m3u8"`;

    await execAsync(ffmpegConversionCommand);

    return hlsPath;
}