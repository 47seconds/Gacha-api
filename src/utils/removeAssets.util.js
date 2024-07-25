import fs from 'fs';
import path from 'path';

export const removeAssets = (assets) => {
    assets.forEach((asset) => {
        if (asset === '') return;

        try {
            const stats = fs.statSync(asset);

            if (stats.isFile()) {
                fs.unlinkSync(asset);
            } else if (stats.isDirectory()) {
                deleteDirectoryRecursive(asset);
            }
        } catch (err) {
            console.error(`Error deleting ${asset}:`, err);
        }
    });
};

const deleteDirectoryRecursive = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.statSync(curPath).isDirectory()) {
                deleteDirectoryRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(dirPath);
    }
};
