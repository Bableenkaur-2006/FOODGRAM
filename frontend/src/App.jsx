import React from 'react'

import './App.css'
import AppRoutes from './routes/AppRoutes'
import ThemeToggle from './components/ThemeToggle'

function App() {
 
  return (
    <>
        <ThemeToggle />
        <AppRoutes />
    </>
  )
}

export default App
