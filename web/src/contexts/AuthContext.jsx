import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    // Check URL for OAuth callback tokens
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    const tokenType = urlParams.get('type')
    const error = urlParams.get('error')
    const message = urlParams.get('message')

    // Handle OAuth errors (like account already exists)
    if (error) {
      if (error === 'account_exists' && message) {
        toast.error(decodeURIComponent(message))
      } else if (error === 'oauth_failed') {
        toast.error('Google sign-in failed. Please try again.')
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      setLoading(false)
      return
    }

    if (accessToken && refreshToken && tokenType === 'custom') {
      // OAuth callback with custom JWT tokens
      const sessionData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 7 * 24 * 60 * 60
      }
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      setSession(sessionData)
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Fetch user data
      fetchCurrentUser(accessToken)
      return
    }

    // Check for stored session
    const storedSession = localStorage.getItem('auth_session')
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession)
        setSession(parsedSession)
        fetchCurrentUser(parsedSession.access_token)
      } catch (error) {
        console.error('Error parsing stored session:', error)
        localStorage.removeItem('auth_session')
        setLoading(false)
      }
    } else {
      // Check for Supabase session (for Google OAuth backward compatibility)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session)
          setUser(session?.user ?? null)
          localStorage.setItem('supabase.auth.token', session.access_token)
        }
        setLoading(false)
      })

      // Listen for Supabase auth changes (for Google OAuth)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          
          // Check if this is a Google OAuth user
          if (session.user?.app_metadata?.provider === 'google') {
            const googleEmail = session.user.email;
            const googleId = session.user.id;
            const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || googleEmail.split('@')[0];
            
            try {
              // Call our backend to handle account linking
              const response = await fetch(`${API_BASE_URL}/auth/link-google-account`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  googleEmail,
                  googleId,
                  googleName
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.customToken) {
                  // Use custom JWT token for our system
                  const sessionData = {
                    access_token: data.customToken.access_token,
                    refresh_token: data.customToken.refresh_token,
                    expires_in: 7 * 24 * 60 * 60
                  };
                  localStorage.setItem('auth_session', JSON.stringify(sessionData));
                  setSession(sessionData);
                  setUser(data.user);
                  
                  // Only show toast on initial link, not on every auth state change
                  if (data.linked && !localStorage.getItem('google_linked_shown')) {
                    toast.success('Google account linked successfully!');
                    localStorage.setItem('google_linked_shown', 'true');
                  }
                  return;
                }
              }
            } catch (error) {
              console.error('Account linking failed:', error);
            }
          }
          
          // Fallback to regular Supabase session
          setSession(session)
          setUser(session?.user ?? null)
          localStorage.setItem('supabase.auth.token', session.access_token)
        }
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token invalid, clear session
        localStorage.removeItem('auth_session')
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('auth_session')
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.shouldLogin) {
          // User already exists, redirect to login
          throw new Error(data.error || 'Account already exists. Please log in instead.')
        }
        throw new Error(data.error || 'Registration failed')
      }

      toast.success('OTP sent to your email! Please verify to complete registration.')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const verifyOTP = async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed')
      }

      // Store session
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in
      }
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      setSession(sessionData)
      setUser(data.user)

      toast.success('Email verified successfully! Welcome to RobotPDF!')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const resendOTP = async (email, type = 'verification') => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, type })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      toast.success('OTP sent successfully!')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsVerification) {
          throw new Error('Please verify your email first. Check your inbox for the OTP.')
        }
        throw new Error(data.error || 'Login failed')
      }

      // Store session
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in
      }
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      setSession(sessionData)
      setUser(data.user)

      toast.success('Welcome back!')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signInWithGoogle = async (isSignup = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const storedSession = localStorage.getItem('auth_session')
      
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession)
          
          // Call logout endpoint
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${parsedSession.access_token}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (err) {
          console.error('Logout API error:', err)
        }
      }

      // Try Supabase signout for Google OAuth users (ignore errors)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.auth.signOut({ scope: 'local' })
        }
      } catch (err) {
        console.error('Supabase signout error:', err)
      }

      // Clear local storage
      localStorage.removeItem('auth_session')
      localStorage.removeItem('supabase.auth.token')
      
      setSession(null)
      setUser(null)

      toast.success('Signed out successfully')
      return { error: null }
    } catch (error) {
      console.error('Signout error:', error)
      // Still clear local state even if API calls fail
      localStorage.removeItem('auth_session')
      localStorage.removeItem('supabase.auth.token')
      setSession(null)
      setUser(null)
      return { error: null }
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      toast.success('Password reset OTP sent to your email!')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      toast.success('Password reset successfully! Please login with your new password.')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      // For Supabase OAuth users
      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error

      toast.success('Profile updated successfully')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const refreshSession = async () => {
    try {
      const storedSession = localStorage.getItem('auth_session')
      if (!storedSession) return { error: 'No session found' }

      const parsedSession = JSON.parse(storedSession)

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: parsedSession.refresh_token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh session')
      }

      // Update stored session
      const newSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in
      }
      localStorage.setItem('auth_session', JSON.stringify(newSession))
      setSession(newSession)

      return { error: null }
    } catch (error) {
      console.error('Session refresh error:', error)
      // Clear invalid session
      localStorage.removeItem('auth_session')
      setSession(null)
      setUser(null)
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    verifyOTP,
    resendOTP,
    signIn,
    signInWithGoogle,
    signUpWithGoogle: () => signInWithGoogle(true),
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
