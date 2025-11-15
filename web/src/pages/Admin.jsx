import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatFileSize, formatDate } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  Users, 
  Activity, 
  HardDrive,
  Search,
  Shield,
  Trash2,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Database,
  FileText,
  Download,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  LineChart
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import toast from 'react-hot-toast'

const Admin = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [storageUsage, setStorageUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activityPage, setActivityPage] = useState(1)
  const [activityTotalPages, setActivityTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [currentPage, filterRole])

  useEffect(() => {
    loadActivity()
  }, [activityPage])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const [statsResponse, usersResponse, activityResponse, storageResponse] = await Promise.all([
        api.getAdminStats(),
        api.getUsers(1, 20),
        api.getAdminActivity(1, 20),
        api.getStorageUsage()
      ])
      
      setStats(statsResponse.stats)
      setUsers(usersResponse.users)
      setTotalPages(usersResponse.pagination.pages)
      setActivity(activityResponse.activity)
      setActivityTotalPages(activityResponse.pagination.pages)
      setStorageUsage(storageResponse.storageByUser)
    } catch (error) {
      toast.error('Failed to load admin data')
      console.error('Admin data load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.getUsers(currentPage, 20, searchTerm)
      setUsers(response.users)
      setTotalPages(response.pagination.pages)
    } catch (error) {
      toast.error('Failed to load users')
    }
  }

  const loadActivity = async () => {
    try {
      const response = await api.getAdminActivity(activityPage, 20)
      setActivity(response.activity)
      setActivityTotalPages(response.pagination.pages)
    } catch (error) {
      toast.error('Failed to load activity')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAdminData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleSearchUsers = async () => {
    setCurrentPage(1)
    await loadUsers()
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole)
      toast.success('User role updated successfully')
      await loadUsers()
      if (selectedUser?.id === userId) {
        await loadUserDetails(userId)
      }
    } catch (error) {
      toast.error('Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await api.deleteUser(userId)
      toast.success('User deleted successfully')
      setUserDetailsOpen(false)
      await loadAdminData()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const loadUserDetails = async (userId) => {
    try {
      setLoadingDetails(true)
      const response = await api.getUserDetails(userId)
      setUserDetails(response)
      setSelectedUser(response.user)
    } catch (error) {
      toast.error('Failed to load user details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleViewUser = async (user) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
    await loadUserDetails(user.id)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'pro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'premium':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'upload':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'merge':
      case 'split':
      case 'compress':
      case 'convert':
        return <Settings className="h-4 w-4 text-purple-500" />
      case 'ocr':
      case 'summarize':
        return <BarChart3 className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(user => user.role === filterRole)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive system management and analytics
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <UserPlus className="h-3 w-3 mr-1" />
                  +{stats.newUsersThisMonth} this month
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Database className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Files uploaded to system
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalStorage)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Total storage capacity
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Operations (last 30 days)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popular Operations */}
      {stats?.popularOperations && Object.keys(stats.popularOperations).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Operations (Last 30 Days)
            </CardTitle>
            <CardDescription>Most frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.popularOperations)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([operation, count]) => (
                  <div key={operation} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getActionIcon(operation)}
                      <span className="text-sm font-medium capitalize">{operation}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <HardDrive className="h-4 w-4" />
            <span className="hidden sm:inline">Storage</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="gap-2"
            onClick={() => navigate('/admin/analytics')}
          >
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Visitor Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage all registered users ({users.length} total)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {stats?.totalUsers || 0} Users
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearchUsers} className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold truncate">{user.name}</p>
                            <Badge className={user.role === 'admin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }>
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateUserRole(
                                user.id, 
                                user.role === 'admin' ? 'user' : 'admin'
                              )}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Activity Log</CardTitle>
                  <CardDescription>
                    Real-time monitoring of user activities and operations
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {activity.length} Recent
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activity.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">
                          {getActionIcon(item.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {item.users?.name || 'Unknown User'}
                            </p>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {item.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.users?.email || 'No email'}
                          </p>
                          {item.files?.filename && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {item.files.filename}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Activity Pagination */}
              {activityTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {activityPage} of {activityTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                      disabled={activityPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage(p => Math.min(activityTotalPages, p + 1))}
                      disabled={activityPage === activityTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Storage Usage Analytics</CardTitle>
                  <CardDescription>
                    Detailed storage consumption by user
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {formatFileSize(stats?.totalStorage || 0)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {storageUsage.length === 0 ? (
                  <div className="text-center py-12">
                    <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No storage data available</p>
                  </div>
                ) : (
                  storageUsage.map((user, index) => {
                    const storagePercent = stats?.totalStorage 
                      ? (user.totalStorage / stats.totalStorage) * 100 
                      : 0
                    
                    return (
                      <div
                        key={user.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 rounded-full flex items-center justify-center">
                              <HardDrive className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold truncate">{user.name}</p>
                                {index < 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Top {index + 1}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg">{formatFileSize(user.totalStorage)}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <FileText className="h-3 w-3" />
                              {user.fileCount} files
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Storage Usage</span>
                            <span>{storagePercent.toFixed(1)}% of total</span>
                          </div>
                          <Progress value={storagePercent} className="h-2" />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the selected user
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{userDetails.user.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{userDetails.user.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Role</Label>
                      <Badge className={userDetails.user.role === 'admin' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }>
                        {userDetails.user.role}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Member Since</Label>
                      <p className="font-medium">{formatDate(userDetails.user.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{userDetails.stats.totalFiles}</p>
                      <p className="text-sm text-muted-foreground">Total Files</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <HardDrive className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{formatFileSize(userDetails.stats.totalStorage)}</p>
                      <p className="text-sm text-muted-foreground">Storage Used</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{userDetails.stats.totalActivity}</p>
                      <p className="text-sm text-muted-foreground">Activities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateUserRole(
                    userDetails.user.id,
                    userDetails.user.role === 'admin' ? 'user' : 'admin'
                  )}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {userDetails.user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteUser(userDetails.user.id)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load user details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Admin