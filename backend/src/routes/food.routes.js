const express= require('express');
const foodController=require("../controllers/food.controller")
const authMiddleware= require("../middlewares/auth.middlewares")
const router =express.Router();
const multer= require('multer');


const upload= multer({
    storage: multer.memoryStorage(),
})


/* Post: /api/food/ [protected]*/
router.post('/',authMiddleware.authFoodPartnerMiddleWare,
    upload.single("video"),
    foodController.createFood);




/* GET /API/FOOD/ [protected]*/

// public listing available at /api/food/public
router.get('/public', foodController.getPublicFoodItems);

// authenticated listing for logged-in users (keeps existing behavior)
router.get('/', authMiddleware.authUserMiddeware, foodController.getFoodItems);


router.post('/like',
    authMiddleware.authUserMiddeware,
    foodController.likeFood

)


router.post('/save',
    authMiddleware.authUserMiddeware,
    foodController.saveFood
)

// GET /api/food/:id - fetch single item (public). Delete route is after this so it doesn't clash.
router.get(
    '/saved',
    authMiddleware.authUserMiddeware,
    foodController.getSavedFood
);
router.get('/:id', foodController.getFoodById);

// DELETE /api/food/:id - delete a food item (food partner must be authenticated)
router.delete('/:id', authMiddleware.authFoodPartnerMiddleWare, foodController.deleteFood);


module.exports=router