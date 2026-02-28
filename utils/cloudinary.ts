import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (localFilePath: string, originalName: string): Promise<UploadApiResponse | null> => {
    try {
        if (!localFilePath) return null;

        const originalBaseName = path.parse(originalName).name;

        const safePublicId = `song_${Date.now()}`;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "video",
            folder: "music_co",
            public_id: safePublicId,
            context: `song_name=${originalBaseName}`
        });

        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};

export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
    try {
        return await cloudinary.uploader.destroy(publicId, {
            resource_type: "video"
        });
    } catch (error) {
        console.error("Cloudinary delete failed:", error);
        return null;
    }
};