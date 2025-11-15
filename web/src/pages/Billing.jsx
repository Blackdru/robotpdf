import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useSubscription } from '../contexts/SubscriptionContext'
import UsageIndicator from '../components/subscription/UsageIndicator'
import BillingHistory from '../components/subscription/BillingHistory'
import SubscriptionModal from '../components/subscription/SubscriptionModal'
import CancelSubscription from '../components/subscription/CancelSubscription'
import { 
  CreditCard, 
  Calendar, 
  Settings, 
  Crown,
  AlertCircle,
  CheckCircle,
  ArrowUpCircle
} from 'lucide-react'

const Billing = () => {
  const { 
    subscription, 
    loading, 
    isActive, 
    isCancelledButActive, 
    getPlanDisplayName 
  } = useSubscription()
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = () => {
    if (!subscription) return null
    
    if (isCancelledButActive()) {
      return <Badge variant="destructive">Cancelling</Badge>
    }
    
    switch (subscription.status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{subscription.status}</Badge>
    }
  }

  const getPlanIcon = () => {
    if (!subscription) return <CreditCard className="h-5 w-5" />
    
    switch (subscription.plan) {
      case 'premium':
        return <Crown className="h-5 w-5 text-blue-500" />
      case 'pro':
        return <ArrowUpCircle className="h-5 w-5 text-purple-500" />
      default:
        return <CreditCard className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
        {/* Subtle Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        </div>
        <div className="mobile-container py-12 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white mobile-spacing-dark relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      <div className="mobile-container py-6 sm:py-8 lg:py-12 space-y-6 sm:space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <h1 className="mobile-text-3xl font-extrabold text-slate-900 mb-2 sm:mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Billing</span> & Subscription
          </h1>
          <p className="mobile-text-base text-slate-600 leading-relaxed">
            Manage your subscription, view usage, and billing history
          </p>
        </div>

        {/* Current Subscription Card */}
        <Card className="bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all mobile-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex flex-wrap items-center gap-2 text-slate-900">
              {getPlanIcon()}
              <span>Current Plan</span>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs sm:text-sm">
              Your current subscription details and status
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">{getPlanDisplayName()} Plan</h3>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  {subscription?.planLimits?.price === 0 ? (
                    'Free'
                  ) : (
                    `${subscription?.planLimits?.price}/month`
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2 text-slate-900">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                  Billing Cycle
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  {subscription?.current_period_end ? (
                    <>
                      Next: {formatDate(subscription.current_period_end)}
                    </>
                  ) : (
                    'No billing cycle'
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2 text-slate-900">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                  Status
                </h4>
                <div className="flex items-center gap-2">
                  {isActive() ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  )}
                  <span className="text-xs sm:text-sm text-slate-900">
                    {isActive() ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Notice */}
            {isCancelledButActive() && (
              <div className="p-3 sm:p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="font-medium text-xs sm:text-sm">Subscription Ending</span>
                </div>
                <p className="text-xs sm:text-sm text-orange-600 mt-1">
                  Your subscription will end on {formatDate(subscription?.current_period_end)}. 
                  You can reactivate it anytime before then.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto mobile-btn mobile-touch-target"
              >
                <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-sm sm:text-base">{subscription?.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}</span>
              </Button>
              
              {subscription?.plan !== 'free' && isActive() && (
                <Button 
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="border-2 border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-gray-300 w-full sm:w-auto mobile-btn mobile-touch-target text-sm sm:text-base"
                >
                  {isCancelledButActive() ? 'Manage Cancellation' : 'Cancel Subscription'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Usage and Billing */}
        <Tabs defaultValue="usage" className="space-y-4 sm:space-y-6">
          <div className="mobile-overflow-x">
            <TabsList className="inline-flex w-full sm:w-auto min-w-max bg-white border-2 border-gray-200 rounded-xl p-1">
              <TabsTrigger value="usage" className="mobile-btn-sm mobile-touch-target text-xs sm:text-sm">Usage & Limits</TabsTrigger>
              <TabsTrigger value="history" className="mobile-btn-sm mobile-touch-target text-xs sm:text-sm">Billing History</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="usage" className="space-y-6">
            <UsageIndicator />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <BillingHistory />
          </TabsContent>
        </Tabs>

        {/* Plan Features */}
        {subscription?.planLimits && (
          <Card className="bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all mobile-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-slate-900">Plan Features</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm">
                What's included in your {getPlanDisplayName()} plan
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {subscription.planLimits.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 mobile-touch-target">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm capitalize text-slate-900">
                      {feature.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      
      <CancelSubscription
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </div>
  )
}

export default Billing