const express = require('express');
const foodPartnerController = require('../controllers/food-partner.controller');
const authMiddleWare = require('../middlewares/auth.middlewares');
const router = express.Router();


// GET /api/food-partner/profile - current authenticated partner
router.get('/profile', authMiddleWare.authFoodPartnerMiddleWare, foodPartnerController.getMyProfile);

// GET /api/food-partner/:id - public lookup (no auth required)
router.get('/:id', foodPartnerController.getFoodPartnerById);
module.exports = router;