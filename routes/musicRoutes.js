const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer');
const { uploadMusic } = require('../controllers/musicController');

// Define the upload route
router.post('/upload', upload.array('music', 10), uploadMusic);

module.exports = router;
