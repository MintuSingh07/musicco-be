const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // This will handle video/audio/image
            folder: "music_co"
        });

        // File has been uploaded successfully
        console.log("File is uploaded on cloudinary", response.url);

        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // Remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed", error);
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "video"
        });

        return response;

    } catch (error) {
        console.error("Cloudinary delete failed", error);
        return null;
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
