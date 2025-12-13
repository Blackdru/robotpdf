import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useSubscription } from '../contexts/SubscriptionContext'
import { 
  X, 
  Crown, 
  Zap, 
  Star, 
  Check, 
  Sparkles,
  ArrowRight,
  Lock,
  TrendingUp
} from 'lucide-react'

const UpgradeModal = ({ isOpen, onClose, requiredPlan = 'pro', toolName = '', toolDescription = '', feature = '', description = '' }) => {
  // Support both prop names for backward compatibility
  const displayName = toolName || feature
  const displayDescription = toolDescription || description
  const navigate = useNavigate()
  const { plans, subscription } = useSubscription()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = (planId) => {
    setLoading(true)
    navigate('/upgrade')
    onClose()
  }

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'pro':
        return <Star className="h-6 w-6 text-blue-500" />
      case 'devs':
        return <Crown className="h-6 w-6 text-purple-500" />
      default:
        return <Star className="h-6 w-6 text-blue-500" />
    }
  }

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'pro':
        return 'from-blue-500 to-cyan-500'
      case 'devs':
        return 'from-purple-500 to-indigo-500'
      default:
        return 'from-blue-500 to-purple-500'
    }
  }

  const getRecommendedPlans = () => {
    // Always use hardcoded plans with correct pricing
    return [
      {
        id: 'pro',
        name: 'Pro',
        price: 169,
        features: ['✨ Ad-Free Experience', 'Unlimited files processing', '50 MB max file size', '500 MB storage', '50 OCR/Chat/Summaries per month', 'All advanced tools']
      },
      {
        id: 'devs',
        name: 'Devs',
        price: 459,
        features: ['✨ Ad-Free Experience', '1500 API requests/month', 'Access to all API endpoints', '200 MB max file size', 'Unlimited storage & AI', 'Priority support']
      }
    ]
  }

  const recommendedPlans = getRecommendedPlans()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-surface border-border rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground">
                  Upgrade Required
                </DialogTitle>
                <div className="text-muted-foreground font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base truncate">{displayName}</span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 text-xs font-semibold flex-shrink-0">
                      <Crown className="h-3 w-3 mr-1" />
                      PRO
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs sm:text-sm">Requires a premium subscription to access</DialogDescription>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-elevated rounded-lg transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">

          

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {recommendedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-elevated rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                  plan.id === 'pro' 
                    ? 'border-blue-500/20 hover:border-blue-500/40' 
                    : 'border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                {plan.id === 'pro' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 text-xs font-semibold shadow-md">
                    Most Popular
                  </Badge>
                )}
                
                {plan.id === 'devs' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 text-xs font-semibold shadow-md">
                    For Developers
                  </Badge>
                )}

                <div className="p-4 sm:p-6">
                  {/* Icon */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                      plan.id === 'pro' 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                        : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                    }`}>
                      {plan.id === 'pro' ? <Star className="h-6 w-6 sm:h-7 sm:w-7 text-white" /> : <Crown className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl sm:text-4xl font-bold text-foreground">₹{plan.price}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium">/month</span>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {plan.id === 'pro' ? 'Perfect for regular users' : 'For developers & API access'}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6">
                    {(plan.features || []).slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3">
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                        </div>
                        <span className="line-clamp-1">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                    className={`w-full text-white hover:shadow-lg transition-all duration-200 py-2 sm:py-2.5 font-semibold rounded-xl text-sm ${
                      plan.id === 'pro' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' 
                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Upgrade to {plan.name}
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-border">
            <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500" />
                Secure payments
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-4 sm:px-5 py-2 border-border text-muted-foreground hover:bg-elevated rounded-xl text-sm"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => navigate('/pricing')}
                className="px-4 sm:px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg rounded-xl text-sm"
              >
                View All Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradeModal