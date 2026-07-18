const mongoose = require('mongoose');


function connectDB(){
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn('MONGODB_URI not set; skipping MongoDB connection (development fallback)');
        return;
    }
    mongoose.connect(uri)
        .then(()=>{
            console.log("MongoDB connected");
        })
        .catch((err)=>{
            console.log("MongoDB connection error:",err);
        })
}

module.exports= connectDB;