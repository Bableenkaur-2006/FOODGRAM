const foodModel=require('../models/food.model');
const storageService=require('../services/storage.service');
const likeModel=require('../models/likes.model');
const saveModel=require('../models/save.model');
const { v4:uuid}= require("uuid")
const jwt = require('jsonwebtoken');


async function createFood(req, res) {
  try {
    console.log("Food Partner:", req.foodPartner);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const fileUploadResult = await storageService.uploadFile(req.file.buffer, uuid());
    const foodItem=await foodModel.create({
        name: req.body.name,
        description:req.body.description,
        video:fileUploadResult.url,
        foodPartner: req.foodPartner._id
    })
    console.log("Upload Result:", fileUploadResult);

    res.status(201).json({
        message:"food created successfully",
        food:foodItem
    })

  } catch (error) {
    console.error("Upload Error:", error); // <-- REAL ERROR WILL SHOW HERE
    res.status(500).json({ message: error.message || error });
  }
}

async function getFoodItems(req,res){
  try {
    const foodItems = await foodModel.find({}).populate('foodPartner', 'name');
    // If authenticated, annotate items with whether the current user liked/saved them
    if (req.user && req.user._id) {
      const foodIds = foodItems.map(fi => fi._id);
      const likes = await likeModel.find({ user: req.user._id, food: { $in: foodIds } }).select('food');
      const saves = await saveModel.find({ user: req.user._id, food: { $in: foodIds } }).select('food');
      const likedSet = new Set(likes.map(l => String(l.food)));
      const savedSet = new Set(saves.map(s => String(s.food)));

      const annotated = foodItems.map(fi => ({
        ...fi.toObject(),
        liked: likedSet.has(String(fi._id)),
        saved: savedSet.has(String(fi._id)),
        likeCount: fi.likeCount || 0,
        saveCount: fi.saveCount || 0
      }));

      return res.status(200).json({ message: 'Food items fetched successfully', foodItems: annotated });
    }

    // Unauthenticated: just return items with counts
    const plain = foodItems.map(fi => ({ ...fi.toObject(), likeCount: fi.likeCount || 0, saveCount: fi.saveCount || 0 }));
    return res.status(200).json({ message: 'Food items fetched successfully', foodItems: plain });
  } catch (err) {
    console.error('Error fetching food items:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// public listing - no auth required. Returns same shape as getFoodItems for compatibility
async function getPublicFoodItems(req, res) {
  try {
    // include partner basic info to help frontend link to partner pages
    const foodItems = await foodModel.find({}).populate('foodPartner', 'name');
    const plain = foodItems.map(fi => ({ ...fi.toObject(), likeCount: fi.likeCount || 0, saveCount: fi.saveCount || 0 }));
    res.status(200).json({ message: 'Food items fetched successfully', foodItems: plain });
  } catch (err) {
    console.error('Error fetching public food items:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getFoodById(req, res) {
  try {
    const id = req.params.id;
    const item = await foodModel.findById(id).populate('foodPartner', 'name');
    if (!item) return res.status(404).json({ message: 'Not found' });

    const obj = item.toObject();
    obj.likeCount = obj.likeCount || 0;
    obj.saveCount = obj.saveCount || 0;

    // Try to detect the current user from token (optional). Don't fail if missing/invalid.
    try {
      let currentUserId = null;
      if (req.user && req.user._id) currentUserId = req.user._id;
      else if (req.cookies && req.cookies.token) {
        try {
          const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
          currentUserId = decoded && decoded.id;
        } catch (e) {
          currentUserId = null;
        }
      }

      if (currentUserId) {
        const liked = await likeModel.findOne({ user: currentUserId, food: id });
        const saved = await saveModel.findOne({ user: currentUserId, food: id });
        obj.liked = !!liked;
        obj.saved = !!saved;
      }
    } catch (e) {
      // ignore optional user detection failures
    }

    return res.status(200).json({ message: 'Food item fetched', foodItem: obj });
  } catch (err) {
    console.error('Error fetching food item by id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteFood(req, res) {
  try {
    const id = req.params.id;
    const fp = req.foodPartner;
    if (!fp) return res.status(401).json({ message: 'Not authenticated as food partner' });

    const item = await foodModel.findById(id);
    if (!item) return res.status(404).json({ message: 'Food item not found' });

    // only allow owner to delete
    if (String(item.foodPartner) !== String(fp._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // if the video is stored locally under /videos/, try to remove the file
    try {
      if (item.video && typeof item.video === 'string' && item.video.startsWith('/videos/')) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../', item.video);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Failed to remove local video file:', e.message);
    }

    await foodModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Food item deleted' });
  } catch (err) {
    console.error('Error deleting food item:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function likeFood(req, res) {
  try {
    const { foodId } = req.body;
    const user = req.user
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    
    const isAlreadyLiked = await likeModel.findOne({
      food: foodId,
      user: user._id
    })
    if (isAlreadyLiked) {
      await likeModel.deleteOne({
        food: foodId,
        user: user._id
      });
      await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: -1 } });
      const updated = await foodModel.findById(foodId).select('likeCount');
      return res.status(200).json({ message: 'Food item unliked', likeCount: updated ? updated.likeCount : 0 });
    }
    try {
  const like = await likeModel.create({ food: foodId, user: user._id });
      await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: 1 } });
      const updated = await foodModel.findById(foodId).select('likeCount');
      return res.status(201).json({ message: 'Food item liked', like, likeCount: updated ? updated.likeCount : 0 });
    } catch (createErr) {
      // Handle duplicate key (race) gracefully - treat as already liked
      if (createErr && createErr.code === 11000) {
        const updated = await foodModel.findById(foodId).select('likeCount');
        return res.status(200).json({ message: 'Food item already liked', likeCount: updated ? updated.likeCount : 0 });
      }
      throw createErr;
    }

  } catch (err) {
    console.error('Error liking food item:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function saveFood(req, res) {
  try {
    const { foodId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const isAlreadySaved = await saveModel.findOne({ food: foodId, user: user._id });
    if (isAlreadySaved) {
      await saveModel.deleteOne({ food: foodId, user: user._id });
      await foodModel.findByIdAndUpdate(foodId, { $inc: { saveCount: -1 } });
      const updated = await foodModel.findById(foodId).select('saveCount');
      return res.status(200).json({ message: 'Food item unsaved', saveCount: updated ? updated.saveCount : 0 });
    }

    try {
      const save = await saveModel.create({ food: foodId, user: user._id });
      await foodModel.findByIdAndUpdate(foodId, { $inc: { saveCount: 1 } });
      const updated = await foodModel.findById(foodId).select('saveCount');
      return res.status(201).json({ message: 'Food item saved', save, saveCount: updated ? updated.saveCount : 0 });
    } catch (createErr) {
      if (createErr && createErr.code === 11000) {
        const updated = await foodModel.findById(foodId).select('saveCount');
        return res.status(200).json({ message: 'Food item already saved', saveCount: updated ? updated.saveCount : 0 });
      }
      throw createErr;
    }
  } catch (err) {
    console.error('Error saving food item:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports={
  createFood,
  getFoodItems,
  deleteFood,
  likeFood,
  saveFood,
  getPublicFoodItems,
  getFoodById
}
