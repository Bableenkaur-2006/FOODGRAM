import React from 'react'
import '../styles/auth.css'
import api from "../config/axios";
import { useNavigate } from 'react-router-dom'

const UserRegister = () => {

     const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await api.post(
        "https://foodgram-backend-xtmt.onrender.com/api/auth/user/register",
        {
          fullName: firstName + " " + lastName,
          email,
          password
        },
        { withCredentials: true } // if backend uses cookies
      );

      console.log(response.data);

      navigate("/");

    } catch (error) {
      console.log("Registration Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Registration failed");
    }
  };
    return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">U</div>
          <div>
            <h2>Create account</h2>
            <p className="lead">Register as a user to browse and order food.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input name="firstName" id="firstName" type="text" placeholder="John" required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input name="lastName" id="lastName" type="text" placeholder="Doe" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input name="email" id="email" type="email" placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input name="password" id="password" type="password" placeholder="••••••••" required />
          </div>

          <div className="actions">
            <a className="secondary" href="/user/login">Already have an account?</a>
            <button type="submit" className="btn">Create account</button>
          </div>

          <p className="small-note">By creating an account you agree to our terms and privacy policy.</p>
        </form>
      </div>
    </div>
  )
}

export default UserRegister
