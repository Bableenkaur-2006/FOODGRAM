const path = require('path');
const fs = require('fs');
const Video = require('../models/video.model');

// Upload video
async function uploadVideo(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const url = `/videos/${req.file.filename}`;
    // allow optional fields sent alongside the multipart upload
    const { description, foodPartner } = req.body || {};

    const video = await Video.create({
        filename: req.file.filename,
        originalname: req.file.originalname,
        url,
        description: description || undefined,
        foodPartner: foodPartner || undefined
    });
    res.status(201).json({ message: 'Video uploaded', video });
}

// Get all videos
async function getVideos(req, res) {
    const videos = await Video.find().sort({ uploadedAt: -1 });
    res.json({ videos });
}

module.exports = { uploadVideo, getVideos };