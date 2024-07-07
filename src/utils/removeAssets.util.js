    import fs from 'fs';

    export const removeAssets = (assets) => {
        assets.map((asset) => {
            if (asset === '') {}
            else fs.unlinkSync(asset);
        });
    }