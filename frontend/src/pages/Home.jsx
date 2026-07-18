import React from 'react'
import '../styles/auth.css'

const Home = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">FD</div>
          <div>
            <h2>Welcome to FoodApp</h2>
            <p className="lead">Choose how you'd like to join — as a customer or as a food partner.</p>
          </div>
        </div>

        <div className="home-actions">
          <a href="/user/register" className="btn">Register as user</a>
          <a href="/food-partner/register" className="btn btn-outline">Register as food partner</a>
        </div>

        <p className="small-note" style={{textAlign:'center'}}>Already registered? <a href="/user/login">User sign in</a> or <a href="/food-partner/login">Partner sign in</a></p>
      </div>
    </div>
  )
}

export default Home
