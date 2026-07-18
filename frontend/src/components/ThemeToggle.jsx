import React, { useEffect, useState } from 'react'

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme')
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    const apply = (t) => {
      if (t) document.documentElement.setAttribute('data-theme', t)
      else document.documentElement.removeAttribute('data-theme')
    }

    // initialize from saved preference or system
    if (theme) {
      apply(theme)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      apply(prefersDark ? 'dark' : 'light')
    }
  }, [theme])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('theme', next) } catch (e) {}
    setTheme(next)
  }

  // Display appropriate icon
  const icon = theme === 'dark' ? '☀️' : '🌙'

  return (
    <div className="theme-toggle" aria-hidden={false}>
      <button onClick={toggle} aria-label="Toggle theme">{icon}</button>
    </div>
  )
}

export default ThemeToggle
