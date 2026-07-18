const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String },
    foodPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'foodPartner', required: false },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);