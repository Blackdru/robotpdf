import { useState } from 'react'
import { Check, Code, Zap, Star } from 'lucide-react'
import { useSubscription } from '../../contexts/SubscriptionContext'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

const PlanCard = ({ plan, isCurrentPlan = false, onSelectPlan, billingPeriod = 'monthly' }) => {
  const [loading, setLoading] = useState(false)
  const { subscription, isActive } = useSubscription()

  const handleSelectPlan = async () => {
    if (loading || isCurrentPlan) return
    
    setLoading(true)
    try {
      await onSelectPlan(plan.id)
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = () => {
    switch (plan.id) {
      case 'free':
        return <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
      case 'pro':
        return <Star className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
      case 'devs':
        return <Code className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
      default:
        return <Star className="h-5 w-5 sm:h-6 sm:w-6" />
    }
  }

  const getPlanColor = () => {
    switch (plan.id) {
      case 'free':
        return 'border-grey-700'
      case 'pro':
        return 'border-blue-500/30 shadow-lg shadow-blue-500/20'
      case 'devs':
        return 'border-purple-500/30 shadow-xl shadow-purple-500/20'
      default:
        return 'border-grey-700'
    }
  }

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary'
    return plan.id === 'free' ? 'outline' : 'default'
  }

  const canUpgrade = () => {
    if (!subscription) return plan.id !== 'free'
    
    const planHierarchy = { free: 0, pro: 1, devs: 2 }
    const currentLevel = planHierarchy[subscription.plan] || 0
    const targetLevel = planHierarchy[plan.id] || 0
    
    return targetLevel > currentLevel
  }

  const canDowngrade = () => {
    if (!subscription) return false
    
    const planHierarchy = { free: 0, pro: 1, devs: 2 }
    const currentLevel = planHierarchy[subscription.plan] || 0
    const targetLevel = planHierarchy[plan.id] || 0
    
    return targetLevel < currentLevel
  }

  // Get plan-specific features to display
  const getPlanFeatures = () => {
    const isYearly = billingPeriod === 'yearly'
    switch (plan.id) {
      case 'free':
        return [
          'Unlimited use of free tools',
          '10 MB max file size',
          'No storage',
          'No AI features',
          'No advanced tools access'
        ]
      case 'pro':
        return isYearly ? [
          '✨ Ad-Free Experience',
          'Unlimited files processing',
          '100 MB max file size',
          '1 GB storage',
          '500 Advanced OCR pages/year',
          '500 AI chat messages/year',
          '500 AI summaries/year',
          'Access to all advanced tools'
        ] : [
          '✨ Ad-Free Experience',
          'Unlimited files processing',
          '50 MB max file size',
          '500 MB storage',
          '50 Advanced OCR pages/month',
          '50 AI chat messages/month',
          '50 AI summaries/month',
          'Access to all advanced tools'
        ]
      case 'devs':
        return isYearly ? [
          '✨ Ad-Free Experience',
          '20000 API requests/year',
          'Access to all API endpoints',
          '200 MB max file size',
          'Unlimited storage',
          'Unlimited OCR, AI chat & summaries',
          'Priority support'
        ] : [
          '✨ Ad-Free Experience',
          '1500 API requests/month',
          'Access to all API endpoints',
          '200 MB max file size',
          'Unlimited storage',
          'Unlimited OCR, AI chat & summaries',
          'Priority support'
        ]
      default:
        return []
    }
  }

  const planFeatures = getPlanFeatures()

  const getPrice = () => {
    if (plan.price === 0) return 0
    return billingPeriod === 'yearly' ? (plan.priceYearly || plan.price * 12) : plan.price
  }

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg dark-card ${getPlanColor()}`}>
      {plan.id === 'pro' && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm">
          Most Popular
        </Badge>
      )}
      
      {plan.id === 'devs' && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 hover:bg-purple-600 text-xs sm:text-sm">
          API Access
        </Badge>
      )}

      <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
        <div className="flex justify-center mb-2">
          {getPlanIcon()}
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">{plan.name}</CardTitle>
        <CardDescription className="text-base sm:text-lg text-card-foreground">
          {getPrice() === 0 ? (
            <span className="text-xl sm:text-2xl font-bold">Free</span>
          ) : (
            <>
              <span className="text-2xl sm:text-3xl font-bold">₹{getPrice()}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
            </>
          )}
        </CardDescription>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          {plan.id === 'free' && 'Perfect for getting started'}
          {plan.id === 'pro' && 'Great for regular users'}
          {plan.id === 'devs' && 'For developers & API access'}
        </p>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        <div className="space-y-1.5 sm:space-y-2">
          {planFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-card-foreground leading-tight">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <div className="p-4 sm:p-6 pt-0">
        <Button
          className="w-full text-sm sm:text-base py-2 sm:py-3"
          variant={getButtonVariant()}
          onClick={handleSelectPlan}
          disabled={loading || isCurrentPlan}
        >
          {loading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : plan.id === 'free' ? (
            'Get Started'
          ) : (
            `Choose ${plan.name}`
          )}
        </Button>
      </div>
    </Card>
  )
}

export default PlanCard