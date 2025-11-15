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
      case 'basic':
        return <Zap className="h-6 w-6 text-purple-500" />
      case 'pro':
        return <Crown className="h-6 w-6 text-blue-500" />
      default:
        return <Star className="h-6 w-6 text-blue-500" />
    }
  }

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'basic':
        return 'from-purple-500 to-pink-500'
      case 'pro':
        return 'from-blue-500 to-indigo-500'
      default:
        return 'from-blue-500 to-purple-500'
    }
  }

  const getRecommendedPlans = () => {
    // Always use hardcoded plans with correct pricing
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: 99,
        features: ['50 files/month', '25 OCR pages', '25 AI chat messages', '25 AI summaries', 'All advanced tools']
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 499,
        features: ['Unlimited files', 'Unlimited OCR', 'Unlimited AI chat', 'Unlimited AI summaries', 'All advanced tools & settings', 'Priority support']
      }
    ]
  }

  const recommendedPlans = getRecommendedPlans()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white/98 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  Upgrade Required
                </DialogTitle>
                <DialogDescription className="text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{displayName}</span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2.5 py-0.5 text-xs font-semibold">
                      <Crown className="h-3 w-3 mr-1" />
                      PRO
                    </Badge>
                  </div>
                  <span className="text-sm">Requires a premium subscription to access</span>
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">

          

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                  plan.id === 'basic' 
                    ? 'border-blue-200 hover:border-blue-300' 
                    : 'border-purple-200 hover:border-purple-300'
                }`}
              >
                {plan.id === 'basic' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 text-xs font-semibold shadow-md">
                    Most Popular
                  </Badge>
                )}
                
                {plan.id === 'pro' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 text-xs font-semibold shadow-md">
                    Best Value
                  </Badge>
                )}

                <div className="p-6">
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      plan.id === 'basic' 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                        : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                    }`}>
                      {plan.id === 'basic' ? <Zap className="h-7 w-7 text-white" /> : <Crown className="h-7 w-7 text-white" />}
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-slate-900">₹{plan.price}</span>
                      <span className="text-sm text-slate-500 font-medium">/month</span>
                    </div>
                    <p className="text-slate-600 text-sm">
                      {plan.id === 'basic' ? 'Perfect for regular users' : 'For power users and teams'}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mb-6">
                    {(plan.features || []).slice(0, plan.id === 'basic' ? 5 : 6).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                    className={`w-full text-white hover:shadow-lg transition-all duration-200 py-2.5 font-semibold rounded-xl ${
                      plan.id === 'basic' 
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
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Secure payments
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-5 py-2 border-gray-300 text-slate-600 hover:bg-gray-50 rounded-xl"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => navigate('/pricing')}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg rounded-xl"
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