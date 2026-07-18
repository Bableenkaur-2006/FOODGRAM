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
const allowed = [
    "http://localhost:5176",
    "http://localhost:5177",
    "https://foodgram-frontend-3nbq.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowed.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options(/.*/, cors());
app.use(cookieParser());
app.use(express.json());

// Serve videos statically
app.use('/videos', express.static(path.join(__dirname, '../../videos')));



app.get("/",(req,res)=>{
    res.send("Hello World");
});
app.get("/test", (req, res) => {
    res.send("TEST ROUTE WORKING");
});

app.get("/api/test", (req, res) => {
    res.send("API TEST WORKING");
});

app.use('/api/auth',authRoutes);
app.use('/api/food',foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

app.use('/api/videos', videoRoutes);

module.exports = app;