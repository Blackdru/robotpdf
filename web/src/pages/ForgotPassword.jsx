import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Mail, Lock, ArrowRight, CheckCircle, Shield, ArrowLeft, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: email, 2: otp & password
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { forgotPassword, resetPassword, resendOTP } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await forgotPassword(email)
    
    if (!error) {
      setStep(2)
    }
    
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await resetPassword(email, otp, newPassword)
    
    if (!error) {
      navigate('/login')
    }
    
    setLoading(false)
  }

  const handleResendOTP = async () => {
    setLoading(true)
    await resendOTP(email, 'password_reset')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-16 px-3 sm:px-4 md:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Elegant Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className={`max-w-lg w-full relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="space-y-4 sm:space-y-6">
          {/* Logo & Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center items-center mb-3 sm:mb-4">
              <img src="/logo.png" alt="RobotPDF Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {step === 1 ? 'Reset Your Password' : 'Enter New Password'}
            </h2>
            <p className="text-sm text-muted-foreground px-4">
              {step === 1 
                ? 'Enter your email to receive a password reset code'
                : `Enter the code sent to ${email}`
              }
            </p>
          </div>

          {/* Reset Password Form Card */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-xl">
            <CardContent className="p-5 sm:p-8">
          
          {step === 1 ? (
                <form onSubmit={handleRequestOTP} className="space-y-4 sm:space-y-5">
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

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Sending code...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Mail className="mr-2 h-5 w-5" />
                        Send Reset Code
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </div>
                    )}
                  </Button>

                  <div className="text-center pt-4">
                    <Link 
                      to="/login" 
                      className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors inline-flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Link>
                  </div>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="otp" className="block text-xs sm:text-sm font-semibold text-foreground">
                      Verification Code
                    </label>
                    <div className="relative">
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-foreground text-center text-2xl sm:text-3xl tracking-widest font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Check your email for the verification code
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-foreground">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong password"
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
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-foreground">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-foreground focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Resetting password...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Reset Password
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </div>
                    )}
                  </Button>

                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the code?
                    </p>
                    <Button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Resend Code
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setOtp('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground inline-flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Change email
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-xs font-medium">Secure Reset</span>
            </div>
            <div className="flex items-center space-x-2">
              <KeyRound className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span className="text-xs font-medium">Encrypted</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center px-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Remember your password?{' '}
              <Link to="/login" className="underline hover:text-blue-600 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
