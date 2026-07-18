const mongoose = require('mongoose');


const likesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true
    }
}, {
    timestamps: true
});

// ensure a user can only like a given food item once at the database level
likesSchema.index({ user: 1, food: 1 }, { unique: true });

const Like = mongoose.model('Like', likesSchema);
module.exports = Like;