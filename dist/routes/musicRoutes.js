"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = require("../middlewares/multer");
const musicController_1 = require("../controllers/musicController");
const router = express_1.default.Router();
// Define the upload route
router.post('/upload', multer_1.upload.array('music', 10), musicController_1.uploadMusic);
exports.default = router;
