import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // Single theme - always dark/modern blue-purple
  const [theme] = useState('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Always apply dark theme
    root.classList.remove('light')
    root.classList.add('dark')
    
    // Set body background
    document.body.style.backgroundColor = '#0A0F1E'
  }, [])

  // Dummy functions for compatibility (do nothing)
  const toggleTheme = () => {
    // No-op - single theme only
  }

  const setLightTheme = () => {
    // No-op - single theme only
  }

  const setDarkTheme = () => {
    // No-op - single theme only
  }

  const value = {
    theme: 'dark',
    isDark: true,
    isLight: false,
    mounted,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
