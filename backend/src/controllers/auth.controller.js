const userModel= require("../models/user.model")
const foodPartnerModel=require("../models/foodpartner.model")
const bcrypt =require('bcryptjs');
const jwt= require('jsonwebtoken');


async function registerUser(req, res) {
    try {
        console.log("REGISTER API HIT");
        console.log(req.body);

        const { fullName, email, password } = req.body;

        const isUserAlreadyExists = await userModel.findOne({ email });

        console.log("Existing:", isUserAlreadyExists);

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "User Already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            fullName,
            email,
            password: hashedPassword
        });

        console.log("USER CREATED:", user);

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET
        );

        res.cookie("token", token);

        res.status(201).json({
            message: "User Registered Successfully",
            user
        });

    } catch (err) {
        console.log("REGISTER ERROR:");
        console.log(err);

        return res.status(500).json({
            error: err.message
        });
    }
}

async function loginUser(req,res){
    const {email, password}= req.body;
   
    const user= await userModel.findOne({
        email
    })

    if(!user){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const isPssworsValid=await bcrypt.compare(password,user.password);
    if(!isPssworsValid){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const token=jwt.sign({
        id:user._id,
    },process.env.JWT_SECRET)
    res.cookie("token",token)

    res.status(200).json({
        message:"User Logged in Successfully",
        user:{
            _id:user._id,
            email:user.email,
            fullName:user.fullName
        }
    })

}

function logoutUser(req,res){
    res.clearCookie("token");
    res.status(200).json({
        message:"User logged out successfully"
    });
}

async function registerFoodPartner(req,res){
    const {name,email,password,phone,address,ownerName}= req.body;

    const isAccoutAlreadyExists=await foodPartnerModel.findOne({
        email
    })

    if(isAccoutAlreadyExists){
        return res.status(400).json({
            message:"Food partner accout already exists"
        })
    }

    const hashedPassword =await bcrypt.hash(password,10)

    const foodPartner= await foodPartnerModel.create({
        name,
        email,
        password:hashedPassword,
        phone,
        address,
        ownerName
    })

    const token= jwt.sign({
        id: foodPartner._id,

    },process.env.JWT_SECRET)
    
    res.cookie("token",token)

    res.status(201).json({
        message:"Food Partner registered Successfully",
        foodPartner:{
            _id: foodPartner._id,
            email:foodPartner.email,
            name:foodPartner.name,
            address: foodPartner.address,
            phone: foodPartner.phone,
            ownerName: foodPartner.ownerName
        }
    })
}

async function loginFoodPartner(req,res){
    const {email,password}=req.body;

    const foodPartner=await foodPartnerModel.findOne({
        email
    })

    if(!foodPartner){
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid= await bcrypt.compare(password,foodPartner.password);

    if(!isPasswordValid){
         return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign({
        id:foodPartner._id,
    },process.env.JWT_SECRET)

    res.cookie("token",token)

    res.status(200).json({
        message:"Food Partner logged in Successfully",
        foodPartner:{
            _id:foodPartner._id,
            email:foodPartner.email,
            name: foodPartner.name
        }
    })
}

function logoutFoodPartner(req,res){
    res.clearCookie("token");
    res.status(200).json({
        message: "Food Partner logged out successfully"
    });
}
module.exports= {
    registerUser,
    loginUser,
    logoutUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner
}