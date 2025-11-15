import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      // Check multiple possible locations for role
      const role = user.role || user.user_metadata?.role || user.app_metadata?.role

      if (role === 'admin') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        toast.error('Access denied. Admin privileges required.')
      }
      setChecking(false)
    } else if (!loading && !user) {
      setChecking(false)
    }
  }, [user, loading])

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    toast.error('Please login to access admin panel')
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute