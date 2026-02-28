"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMusic = void 0;
const cloudinary_1 = require("../utils/cloudinary");
const uploadMusic = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }
        const uploadPromises = files.map(file => {
            const decodedOriginalName = Buffer
                .from(file.originalname, 'latin1')
                .toString('utf8');
            return (0, cloudinary_1.uploadToCloudinary)(file.path, decodedOriginalName);
        });
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(Boolean);
        const formattedSongs = successfulUploads.map(result => ({
            id: result?.public_id,
            url: result?.secure_url,
            name: result?.context?.custom?.song_name,
            duration: result?.duration,
            format: result?.format
        }));
        console.log("formattedSongs:", formattedSongs);
        return res.status(200).json({
            success: true,
            message: "Uploaded successfully",
            data: formattedSongs
        });
    }
    catch (error) {
        console.error("Music upload controller error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.uploadMusic = uploadMusic;
