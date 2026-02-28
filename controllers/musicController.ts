import { Request, Response } from 'express';
import { uploadToCloudinary } from '../utils/cloudinary';

export const uploadMusic = async (req: Request, res: Response): Promise<any> => {
  try {
    const files = req.files as Express.Multer.File[];
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

      return uploadToCloudinary(file.path, decodedOriginalName);
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean);

    const formattedSongs = successfulUploads.map(result => ({
      id: result?.public_id,
      url: result?.secure_url,
      name: (result?.context as any)?.custom?.song_name,
      duration: result?.duration,
      format: result?.format
    }));

    console.log("formattedSongs:", formattedSongs);

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