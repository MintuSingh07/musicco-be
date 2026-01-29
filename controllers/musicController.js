const { uploadToCloudinary } = require('../utils/cloudinary');

const uploadMusic = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }

        // Handle multiple files
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
        const results = await Promise.all(uploadPromises);

        const successfulUploads = results.filter(result => result !== null);

        if (successfulUploads.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to upload files to cloud"
            });
        }

        const formattedSongs = successfulUploads.map(result => ({
            id: result.public_id,
            url: result.secure_url,
            name: result.original_filename || "New Song",
            duration: result.duration,
            format: result.format
        }));

        return res.status(200).json({
            success: true,
            message: "Uploaded successfully",
            data: formattedSongs
        });

    } catch (error) {
        console.error("Music upload controller error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = { uploadMusic };
