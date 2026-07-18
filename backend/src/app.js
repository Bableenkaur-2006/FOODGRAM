// create server
const express = require('express');
const cookieParser =require('cookie-parser');
const authRoutes=require('./routes/auth.routes');
const foodRoutes =require('./routes/food.routes');
const foodPartnerRoutes =require('./routes/food-partner.routes');
const videoRoutes = require('./routes/video.routes');
const path = require('path');
const cors =require('cors');

const app = express();
// Allow frontend dev servers on 5176 and 5177 (adjust or use env var for production)
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        const allowed = ['http://localhost:5176', 'http://localhost:5177'];
        if (allowed.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // don't throw an exception here; inform CORS middleware the origin is not allowed
            // which will result in the appropriate CORS response without crashing the server
            console.warn('CORS blocked origin:', origin);
            callback(null, false);
        }
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Serve videos statically
app.use('/videos', express.static(path.join(__dirname, '../../videos')));



app.get("/",(req,res)=>{
    res.send("Hello World");
})

app.use('/api/auth',authRoutes);
app.use('/api/food',foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

app.use('/api/videos', videoRoutes);

module.exports = app;