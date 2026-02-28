"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadToCloudinary = async (localFilePath, originalName) => {
    try {
        if (!localFilePath)
            return null;
        const originalBaseName = path_1.default.parse(originalName).name;
        const safePublicId = `song_${Date.now()}`;
        const response = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "video",
            folder: "music_co",
            public_id: safePublicId,
            context: `song_name=${originalBaseName}`
        });
        fs_1.default.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        if (fs_1.default.existsSync(localFilePath))
            fs_1.default.unlinkSync(localFilePath);
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        return await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: "video"
        });
    }
    catch (error) {
        console.error("Cloudinary delete failed:", error);
        return null;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
