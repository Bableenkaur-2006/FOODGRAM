const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
} else {
    console.warn('ImageKit credentials not found; using local storage fallback for uploads.');
}

async function uploadFile(file, fileName) {
    // if imagekit initialized, upload there
    if (imagekit) {
        const result = await imagekit.upload({ file: file, fileName: fileName });
        return result; // ImageKit response contains url
    }

    // Local fallback: write file buffer to backend /videos folder (ensure folder exists)
    const videosDir = path.join(__dirname, '../../videos');
    try {
        if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
        // ensure fileName is safe
        const safeName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_');
        const outPath = path.join(videosDir, safeName);
        // file may be a Buffer or base64 string
        if (Buffer.isBuffer(file)) {
            fs.writeFileSync(outPath, file);
        } else if (typeof file === 'string') {
            // assume base64
            const matches = file.match(/^data:.*;base64,(.*)$/);
            const b64 = matches ? matches[1] : file;
            fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
        } else {
            throw new Error('Unsupported file type for local upload fallback');
        }
        return { url: `/videos/${safeName}`, filePath: outPath };
    } catch (err) {
        throw err;
    }
}

module.exports = {
    uploadFile,
};