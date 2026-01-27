const { rooms } = require('../data/rooms');
const { uploadToCloudinary } = require('../utils/cloudinary');

const uploadMusic = async (req, res) => {
    try {
        const { roomId } = req.body;

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

        //? If roomId is provided, add directly to the room's queue
        if (roomId && rooms[roomId]) {
            if (!rooms[roomId].songsQueue) rooms[roomId].songsQueue = [];

            successfulUploads.forEach(result => {
                rooms[roomId].songsQueue.push({
                    id: result.public_id,
                    url: result.secure_url,
                    name: result.original_filename || "New Song",
                    duration: result.duration,
                    format: result.format
                });
            });

            // Notify everyone in the room via socket
            const io = req.app.get('socketio');
            if (io) {
                io.to(roomId).emit("queue-updated", {
                    queue: rooms[roomId].songsQueue
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: roomId ? "Uploaded and added to queue" : "Uploaded successfully",
            data: successfulUploads
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
