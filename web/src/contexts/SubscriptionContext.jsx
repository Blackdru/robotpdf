import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SubscriptionContext = createContext({})

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

export const SubscriptionProvider = ({ children }) => {
  const { user, session } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingHistory, setBillingHistory] = useState([])

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  // Helper function to get auth token (same logic as API client)
  const getAuthToken = () => {
    // First, try to get JWT token from new auth system
    const authSession = localStorage.getItem('auth_session')
    if (authSession) {
      try {
        const sessionData = JSON.parse(authSession)
        if (sessionData.access_token) {
          return sessionData.access_token
        }
      } catch (e) {
        
      }
    }

    // Fallback to Supabase token (for Google OAuth backward compatibility)
    let token = localStorage.getItem('supabase.auth.token')
    
    if (!token) {
      // Try to get token from Supabase session - search for project-specific key
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const supabaseSession = localStorage.getItem(key)
          if (supabaseSession) {
            try {
              const sessionData = JSON.parse(supabaseSession)
              if (sessionData.access_token) {
                token = sessionData.access_token
                break
              }
            } catch (e) {
              
            }
          }
        }
      }
    }

    // Fallback to session prop if available
    if (!token && session?.access_token) {
      token = session.access_token
    }

    return token
  }

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  // Load available plans
  const loadPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans`)
      const data = await response.json()
      setPlans(data.plans)
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Failed to load subscription plans')
    }
  }

  // Load user's current subscription
  const loadSubscription = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await apiCall('/subscriptions/current')
      setSubscription(data.subscription)
    } catch (error) {
      console.error('Error loading subscription:', error)
      // Don't show error toast for subscription loading as user might not have one
    } finally {
      setLoading(false)
    }
  }

  // Load usage statistics
  const loadUsage = async () => {
    if (!user) return

    try {
      const data = await apiCall('/subscriptions/usage')
      setUsage(data)
    } catch (error) {
      console.error('Error loading usage:', error)
      // Set default usage data to prevent UI issues
      setUsage({
        usage: {
          files_processed: 0,
          storage_used: 0,
          ocr_operations: 0,
          ai_operations: 0,
          api_calls: 0
        },
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        }
      })
    }
  }

  // Load billing history
  const loadBillingHistory = async () => {
    if (!user) return

    try {
      const data = await apiCall('/subscriptions/billing-history')
      setBillingHistory(data.history)
    } catch (error) {
      console.error('Error loading billing history:', error)
    }
  }

  // Create subscription
  const createSubscription = async (plan) => {
    try {
      const data = await apiCall('/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })

      if (plan === 'free') {
        toast.success('Free plan activated!')
        await loadSubscription()
        return { success: true }
      }

      // For paid plans, return client secret for Stripe payment
      return {
        success: true,
        clientSecret: data.clientSecret,
        subscriptionId: data.subscriptionId,
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error(error.message || 'Failed to create subscription')
      return { success: false, error: error.message }
    }
  }

  // Cancel subscription
  const cancelSubscription = async (immediate = false) => {
    try {
      const data = await apiCall('/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({ immediate }),
      })

      toast.success(data.message)
      await loadSubscription()
      return { success: true }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(error.message || 'Failed to cancel subscription')
      return { success: false, error: error.message }
    }
  }

  // Reactivate subscription
  const reactivateSubscription = async () => {
    try {
      const data = await apiCall('/subscriptions/reactivate', {
        method: 'POST',
      })

      toast.success(data.message)
      await loadSubscription()
      return { success: true }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast.error(error.message || 'Failed to reactivate subscription')
      return { success: false, error: error.message }
    }
  }

  // Update subscription plan
  const updatePlan = async (newPlan) => {
    try {
      const data = await apiCall('/subscriptions/plan', {
        method: 'PUT',
        body: JSON.stringify({ plan: newPlan }),
      })

      toast.success(data.message)
      await loadSubscription()
      return { success: true }
    } catch (error) {
      console.error('Error updating plan:', error)
      toast.error(error.message || 'Failed to update plan')
      return { success: false, error: error.message }
    }
  }

  // Check if user has access to a feature
  const hasFeature = (feature) => {
    if (!subscription?.planLimits) return false
    return subscription.planLimits.features.includes(feature) || 
           subscription.planLimits.features.includes('all_features')
  }

  // Check if user is within a specific limit
  const isWithinLimit = (limitType) => {
    if (!subscription?.planLimits || !usage) return false
    
    const limit = subscription.planLimits[limitType]
    if (limit === -1) return true // Unlimited
    
    let currentUsage = 0
    switch (limitType) {
      case 'filesPerMonth':
        currentUsage = usage.usage.files_processed
        break
      case 'storageLimit':
        currentUsage = usage.usage.storage_used
        break
      case 'aiOperations':
        currentUsage = usage.usage.ai_operations
        break
      case 'apiCalls':
        currentUsage = usage.usage.api_calls
        break
      default:
        return false
    }
    
    return currentUsage < limit
  }

  // Get remaining limit for a specific type
  const getRemainingLimit = (limitType) => {
    if (!subscription?.planLimits || !usage) return 0
    
    const limit = subscription.planLimits[limitType]
    if (limit === -1) return -1 // Unlimited
    
    let currentUsage = 0
    switch (limitType) {
      case 'filesPerMonth':
        currentUsage = usage.usage.files_processed
        break
      case 'storageLimit':
        currentUsage = usage.usage.storage_used
        break
      case 'aiOperations':
        currentUsage = usage.usage.ai_operations
        break
      case 'apiCalls':
        currentUsage = usage.usage.api_calls
        break
      default:
        return 0
    }
    
    return Math.max(0, limit - currentUsage)
  }

  // Get usage percentage for a specific limit
  const getUsagePercentage = (limitType) => {
    if (!subscription?.planLimits || !usage) return 0
    
    const limit = subscription.planLimits[limitType]
    if (limit === -1) return 0 // Unlimited
    
    let currentUsage = 0
    switch (limitType) {
      case 'filesPerMonth':
        currentUsage = usage.usage.files_processed
        break
      case 'storageLimit':
        currentUsage = usage.usage.storage_used
        break
      case 'aiOperations':
        currentUsage = usage.usage.ai_operations
        break
      case 'apiCalls':
        currentUsage = usage.usage.api_calls
        break
      default:
        return 0
    }
    
    return Math.min(100, (currentUsage / limit) * 100)
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    if (bytes === -1) return 'Unlimited'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format number with commas
  const formatNumber = (num) => {
    if (num === -1) return 'Unlimited'
    return num.toLocaleString()
  }

  // Check if subscription is active
  const isActive = () => {
    return subscription?.status === 'active' || subscription?.status === 'trialing'
  }

  // Check if subscription is cancelled but still active
  const isCancelledButActive = () => {
    return subscription?.cancel_at_period_end && isActive()
  }

  // Get plan display name
  const getPlanDisplayName = () => {
    if (!subscription) return 'Free'
    return subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
  }

  // Refresh all subscription data
  const refreshSubscriptionData = async () => {
    await Promise.all([
      loadSubscription(),
      loadUsage(),
      loadBillingHistory(),
    ])
  }

  // Load data when user changes
  useEffect(() => {
    if (user && session) {
      loadSubscription()
      loadUsage()
      loadBillingHistory()
    } else {
      setSubscription(null)
      setUsage(null)
      setBillingHistory([])
      setLoading(false)
    }
  }, [user, session])

  // Load plans on mount
  useEffect(() => {
    loadPlans()
  }, [])

  const value = {
    // State
    subscription,
    usage,
    plans,
    loading,
    billingHistory,
    
    // Actions
    createSubscription,
    cancelSubscription,
    reactivateSubscription,
    updatePlan,
    refreshSubscriptionData,
    
    // Helpers
    hasFeature,
    isWithinLimit,
    getRemainingLimit,
    getUsagePercentage,
    formatFileSize,
    formatNumber,
    isActive,
    isCancelledButActive,
    getPlanDisplayName,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}