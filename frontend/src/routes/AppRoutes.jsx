import React from 'react'
import { BrowserRouter as Router , Route, Routes} from 'react-router-dom';

import UserRegister from '../pages/UserRegister'
import UserLogin from '../pages/UserLogin'
import FoodPartnerRegister from '../pages/FoodPartnerRegister'
import FoodPartnerLogin from '../pages/FoodPartnerLogin'
import Home from '../pages/Home'
import Home1 from '../pages/general/Home1'
import CreateFood from '../pages/food-partner/CreateFood'
import Profile from '../pages/food-partner/Profile'
import Saved from '../pages/general/Saved'
import SavedReels from '../pages/general/SavedReels'

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element ={<Home />} />
                <Route path="/general" element ={<Home1 />} />
                <Route path="/user/register" element ={<UserRegister />} />
                <Route path="/user/login" element ={<UserLogin />} />
                <Route path="/food-partner/register" element ={<FoodPartnerRegister />} />
                <Route path="/food-partner/login" element ={<FoodPartnerLogin />} />
                <Route path="/food-partner/profile" element ={<Profile />} />
                <Route path="/food-partner/:id" element ={<Profile />} />
                <Route path="/create-food" element ={<CreateFood />} />
                <Route path="/saved" element ={<Saved />} />
                <Route path="/saved/reels" element ={<SavedReels />} />
            </Routes>
        </Router>
    )
}

export default AppRoutes