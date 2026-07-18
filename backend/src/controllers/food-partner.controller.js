const foodPartnerModel = require('../models/foodpartner.model');
const mongoose = require('mongoose');

async function getFoodPartnerById(req, res) {
    try {
        const foodPartnerId = req.params.id;
        // validate id
        if (!mongoose.isValidObjectId(foodPartnerId)) {
            return res.status(400).json({ message: 'Invalid food partner id' });
        }
        const foodPartner = await foodPartnerModel.findById(foodPartnerId);
        if (!foodPartner) {
            return res.status(404).json({ message: 'Food Partner not found' });
        }
        res.status(200).json({ message: 'Food Partner fetched successfully', foodPartner });
    } catch (error) {
        console.error('Error in getFoodPartnerById:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// return profile for currently authenticated food partner
async function getMyProfile(req, res) {
    try {
        // auth middleware should attach req.foodPartner
        const fp = req.foodPartner;
        if (!fp) return res.status(401).json({ message: 'Not authenticated as food partner' });
        // avoid returning sensitive fields like password
        const safe = {
            _id: fp._id,
            name: fp.name,
            ownerName: fp.ownerName,
            email: fp.email,
            phone: fp.phone,
            address: fp.address
        };
        res.status(200).json({ message: 'Profile fetched', foodPartner: safe });
    } catch (err) {
        console.error('Error in getMyProfile:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getFoodPartnerById,
    getMyProfile
};