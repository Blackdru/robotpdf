import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { FileText, Mail, Lock, ArrowRight, Sparkles, Shield, Zap, CheckCircle, Eye, EyeOff } from 'lucide-react'
import GoogleIcon from '../components/icons/GoogleIcon'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/tools'

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (!error) {
      navigate(from, { replace: true })
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signInWithGoogle(false) // false = login, not signup
    setLoading(false)
  }

  const features = [
    "Process unlimited PDFs",
    "Cloud storage included",
    "Advanced AI tools",
    "24/7 support"
  ]

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-16 px-3 sm:px-4 md:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Elegant Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className={`max-w-6xl w-full relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center">
          {/* Left Side - Branding & Features - Hidden on mobile */}
          <div className="hidden lg:block space-y-6 xl:space-y-8">
            {/* Logo */}
            <div className="flex items-center space-x-3 xl:space-x-4 animate-fade-in">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <img src="/logo.png" alt="RobotPDF Logo" className="relative h-12 w-12 xl:h-16 xl:w-16 object-contain drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  RobotPDF
                </h1>
                <p className="text-sm xl:text-base text-slate-600 font-medium">Your intelligent PDF companion</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-3 xl:space-y-4 animate-slide-up">
              <h2 className="text-2xl xl:text-4xl font-extrabold text-slate-900 leading-tight">
                Welcome back to the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">future of PDF</span>
              </h2>
              <p className="text-base xl:text-xl text-slate-600 leading-relaxed">
                Sign in to access your powerful toolkit and continue your workflow seamlessly.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 xl:space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                  <div className="flex-shrink-0 w-7 h-7 xl:w-8 xl:h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <CheckCircle className="h-4 w-4 xl:h-5 xl:w-5 text-white" />
                  </div>
                  <span className="text-base xl:text-lg text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">{feature}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 xl:gap-6 pt-6 xl:pt-8">
              <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  5K+
                </div>
                <div className="text-xs xl:text-sm text-slate-600 font-semibold mt-1">Active Users</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-xs xl:text-sm text-slate-600 font-semibold mt-1">PDFs Processed</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-xs xl:text-sm text-slate-600 font-semibold mt-1">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="space-y-4 sm:space-y-6 w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6 sm:mb-8">
              <div className="flex justify-center items-center mb-3 sm:mb-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-md opacity-50"></div>
                  <img src="/logo.png" alt="RobotPDF Logo" className="relative h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-slate-600 font-medium">Sign in to continue your journey</p>
            </div>

            {/* Login Form Card */}
            <Card className="border border-slate-200/50 shadow-xl bg-white/90 backdrop-blur-2xl hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-5 sm:p-8">
                <div className="hidden lg:block mb-4 lg:mb-6">
                  <h3 className="text-xl lg:text-2xl font-extrabold text-slate-900 mb-2">Sign in to your account</h3>
                  <p className="text-sm lg:text-base text-slate-600">Enter your credentials to access your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-foreground">
                      Email address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-foreground focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-foreground">
                        Password
                      </label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-foreground focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl text-white py-4 sm:py-6 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        Sign in to RobotPDF
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 sm:px-4 text-muted-foreground font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  type="button"
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 hover:border-slate-300 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                >
                  <GoogleIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Continue with Google
                </Button>

                <div className="text-center pt-4 sm:pt-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link 
                      to="/register" 
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Secure Login</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">5K+ Users</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center px-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By signing in, you agree to our{' '}
                <Link to="/terms-conditions" className="underline hover:text-blue-600 transition-colors">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="underline hover:text-blue-600 transition-colors">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
