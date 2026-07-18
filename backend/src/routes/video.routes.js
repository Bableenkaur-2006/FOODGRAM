const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos } = require('../controllers/video.controller');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../../videos'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/', getVideos);

module.exports = router;
