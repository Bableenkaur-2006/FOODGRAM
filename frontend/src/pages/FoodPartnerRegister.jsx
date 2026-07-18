import React from 'react'
import '../styles/auth.css'
import api from "../config/axios";
import {useNavigate} from 'react-router-dom'

const PartnerRegister = () => {
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const businessName = e.target.businessName.value;
        const ownerName = e.target.ownerName.value;
        const country = e.target.country.value || '';
        const contactNumber = e.target.contactNumber.value;
        const email = e.target.email.value;
        const address = e.target.address.value;
        const password = e.target.password.value;

        // Backend expects fields named `name` and `phone` — map accordingly and combine country code
        const phone = `${country}${contactNumber}`;

        api.post('https://foodgram-backend-xtmt.onrender.com/api/auth/food-partner/register', {
            name: businessName,
            ownerName,
            phone,
            email,
            address,
            password
        }, { withCredentials: true })
        .then(response => {
            console.log(response.data);
            navigate("/food-partner/profile");
        })
        .catch(error => {
            console.log("Registration Error:", error.response?.data || error.message);
            alert(error.response?.data?.message || "Registration failed");
        });
    };
    return (
        <div className="auth-container">
        <div className="auth-card">
            <div className="auth-header">
            <div className="logo">P</div>
            <div>
                <h2>Partner sign up</h2>
                <p className="lead">Create a food-partner account to manage your listings.</p>
            </div>
            </div>

            <form onSubmit={handleSubmit}>
            {/* Group business and owner on one row for faster input */}
            <div className="form-row">
                <div className="form-group">
                <label htmlFor="business">Business name</label>
                <input id="business" name="businessName" type="text" placeholder="Pizza Place" />
                </div>
                <div className="form-group">
                <label htmlFor="owner">Owner name</label>
                <input id="owner" name="ownerName" type="text" placeholder="Jane Doe" />
                </div>
            </div>

            {/* Contact as full-width field */}
                <div className="form-group">
                <label htmlFor="contact">Contact number</label>
                <div className="phone-input">
                <label className="sr-only" htmlFor="country">Country code</label>
                <select id="country" name="country" className="phone-prefix" defaultValue="+1" aria-label="Country code">
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+1">🇨🇦 +1</option>
                </select>
                <input id="contact" name="contactNumber" type="tel" placeholder="555 555 5555" />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="email">Business email</label>
                <input id="email" name="email" type="email" placeholder="owner@example.com" />
            </div>

            <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea id="address" name="address" placeholder="123 Main St, Springfield" rows={3}></textarea>
                <div className="small-note">Include city and postcode to help verification.</div>
            </div>

            <div className="form-row">
                <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Create a secure password" />
                </div>
            </div>

            <div className="actions">
                <a className="secondary" href="/food-partner/login">Have an account?</a>
                <button type="submit" className="btn">Create partner account</button>
            </div>

            <p className="small-note">We'll review your information before activating your partner account.</p>
            </form>
        </div>
        </div>
    )
}

export default PartnerRegister
