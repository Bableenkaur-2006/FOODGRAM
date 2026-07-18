import React, { useState } from 'react'
import '../styles/auth.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const PartnerLogin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            console.log('Attempting partner login with:', { email });
           const response = await axios.post(
                'https://foodgram-backend-xtmt.onrender.com/api/auth/food-partner/login',
                {
                    email,
                    password
                },
                {
                    withCredentials: true
                }
            );
            
            console.log('Partner login successful:', response.data);
            console.log('Navigating to profile page...');
            
            // Trigger profile refresh event for other components
            window.dispatchEvent(new Event('profileRefresh'));
            
            navigate("/food-partner/profile");
        } catch (err) {
            console.error('Partner login error:', err);
            console.error('Error details:', err.response?.data);
            console.error('Error status:', err.response?.status);
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="auth-container">
        <div className="auth-card">
            <div className="auth-header">
            <div className="logo">P</div>
            <div>
                <h2>Partner sign in</h2>
                <p className="lead">Sign in to manage your food partner dashboard.</p>
            </div>
            </div>

            <form onSubmit={handleSubmit}>
            {error && (
                <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    {error}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="email">Business email</label>
                <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="owner@example.com" 
                    required 
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    disabled={loading}
                />
            </div>

            <div className="actions">
                <a className="secondary" href="/food-partner/register">Create partner account</a>
                <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </div>

            <p className="small-note">Need help? <a href="#">Contact support</a></p>
            </form>
        </div>
        </div>
    )
}

export default PartnerLogin
