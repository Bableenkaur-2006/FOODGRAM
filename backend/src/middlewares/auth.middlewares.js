const foodPartnerModel =require("../models/foodpartner.model")
const userModel=require("../models/user.model")
const jwt =require("jsonwebtoken");


async function authFoodPartnerMiddleWare(req, res, next) {

    console.log("===== AUTH MIDDLEWARE =====");
    console.log("Cookies:", req.cookies);

    const token = req.cookies.token;

    console.log("Token:", token);

    if (!token) {
        console.log("NO TOKEN FOUND");
        return res.status(401).json({
            message: "Please login first"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded:", decoded);

        const foodPartner = await foodPartnerModel.findById(decoded.id);

        console.log("Food Partner:", foodPartner);

        req.foodPartner = foodPartner;

        next();

    } catch (err) {
        console.log("JWT ERROR:", err);
        return res.status(401).json({
            message: "Invalid Token"
        });
    }
}

async function authUserMiddeware(req,res,next){

    const token =req.cookies.token;

    if(!token){
        return res.status(401).json({
            message: "Please login first"
        })
    }

    try{
        const decoded =jwt.verify(token,process.env.JWT_SECRET)

        const user =await userModel.findById(decoded.id);

        req.user=user

        next()
    }

    catch(err){
        return res.status(401).json({
            message:"Invalid token"
        })
    }


}


module.exports={
    authFoodPartnerMiddleWare,
    authUserMiddeware,
}