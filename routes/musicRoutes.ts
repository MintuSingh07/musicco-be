import express from 'express';
import { upload } from '../middlewares/multer';
import { uploadMusic } from '../controllers/musicController';

const router = express.Router();

// Define the upload route
router.post('/upload', upload.array('music', 10), uploadMusic);

export default router;
