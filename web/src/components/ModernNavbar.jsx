import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { Button } from './ui/button'
import { 
  FileText, 
  User, 
  Settings, 
  LogOut,
  Shield,
  GitMerge,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  ArrowUpCircle,
  FolderOpen,
  Home,
  Star,
  Sparkles,
  Rocket,
  DollarSign,
  Code,
  HelpCircle,
  BarChart3,
  Bell,
  Sun,
  Moon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const ModernNavbar = () => {
  const { user, signOut } = useAuth()
  const { subscription } = useSubscription()
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActivePath = (path) => location.pathname === path

  const navItems = [
    { path: '/files', label: 'Files', icon: FolderOpen },
    { path: '/tools', label: 'Tools', icon: GitMerge },
    { path: '/advanced-tools', label: 'Pro Tools', icon: Sparkles, isPro: true },
  ]

  const publicNavItems = [
    { path: '/pricing', label: 'Pricing', icon: DollarSign },
    { path: '/developers', label: 'Developers', icon: Code },
  ]

  const getVisibleNavItems = () => {
    return navItems
  }

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-md' 
            : 'bg-white/80 backdrop-blur-md'
        } border-b border-gray-200/80`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative group-hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <img src="/icon.png" alt="RobotPDF" className="relative h-10 w-10 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  RobotPDF
                </span>
                <span className="text-[10px] text-slate-500 font-medium -mt-1">
                  AI-Powered Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {getVisibleNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActivePath(item.path) 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.isPro && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-md">
                      PRO
                    </span>
                  )}
                </Link>
              ))}

              {/* Public Navigation Items */}
              {publicNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActivePath(item.path) 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 px-3 rounded-xl hover:bg-gray-50 flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="hidden sm:block text-left">
                          <div className="text-sm font-semibold text-slate-900">
                            {user.name || user.user_metadata?.name || 'User'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {subscription?.plan === 'pro' ? 'Pro' : subscription?.plan === 'basic' ? 'Basic' : 'Free'} Plan
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 p-2 bg-white/98 backdrop-blur-xl border border-gray-200 rounded-xl shadow-lg">
                      {/* User Info Header */}
                      <div className="px-3 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {user.name || user.user_metadata?.name || user.email}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                                subscription?.plan === 'pro' 
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                  : subscription?.plan === 'basic'
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {subscription?.plan === 'pro' ? 'PRO' : subscription?.plan === 'basic' ? 'BASIC' : 'FREE'} PLAN
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/profile')}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <Settings className="mr-3 h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Profile Settings</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => navigate('/billing')}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <CreditCard className="mr-3 h-4 w-4 text-slate-500" />
                          <div className="flex-1">
                            <span className="font-medium text-slate-700">Billing & Usage</span>
                            <span className="block text-xs text-slate-500">Manage subscription</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                          onClick={() => navigate('/developers')}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <Code className="mr-3 h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Developer Portal</span>
                        </DropdownMenuItem>

                        {/* Upgrade Button for Free/Basic Users */}
                        {(!subscription?.plan || subscription?.plan !== 'pro') && (
                          <DropdownMenuItem 
                            onClick={() => navigate('/upgrade')}
                            className="px-3 py-2 mt-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 cursor-pointer transition-all group"
                          >
                            <ArrowUpCircle className="mr-3 h-4 w-4 text-white" />
                            <div className="flex-1">
                              <span className="font-semibold text-white">Upgrade to Pro</span>
                              <span className="block text-xs text-indigo-100">Unlock all features</span>
                            </div>
                            <Sparkles className="h-4 w-4 text-white" />
                          </DropdownMenuItem>
                        )}

                        {/* Admin Panel */}
                        {(user.role === 'admin' || user.user_metadata?.role === 'admin') && (
                          <>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem 
                              onClick={() => navigate('/admin')}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 cursor-pointer transition-all"
                            >
                              <Shield className="mr-3 h-4 w-4 text-red-600" />
                              <div className="flex-1">
                                <span className="font-semibold text-red-900">Admin Panel</span>
                                <span className="block text-xs text-red-700">System management</span>
                              </div>
                            </DropdownMenuItem>
                          </>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-100 pt-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/help')}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <HelpCircle className="mr-3 h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Help & Support</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={handleSignOut}
                          className="px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors group"
                        >
                          <LogOut className="mr-3 h-4 w-4 text-slate-500 group-hover:text-red-600" />
                          <span className="font-medium text-slate-700 group-hover:text-red-600">Sign Out</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                /* Auth Buttons - Desktop Only */
                <div className="hidden md:flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="px-6 py-2 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 rounded-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/98 backdrop-blur-xl border-b border-gray-200 shadow-lg md:hidden">
          <div className="px-4 py-4">
            <div className="space-y-1 mb-4">
              {getVisibleNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActivePath(item.path)
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.isPro && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-md ml-auto">
                      PRO
                    </span>
                  )}
                </Link>
              ))}
              
              {publicNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActivePath(item.path)
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {!user && (
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline"
                  asChild 
                  className="w-full rounded-xl"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/register">
                    <Rocket className="mr-2 h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  )
}

export default ModernNavbar
