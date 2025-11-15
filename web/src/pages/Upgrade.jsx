import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useSubscription } from '../contexts/SubscriptionContext'
import PlanCard from '../components/subscription/PlanCard'
import PaymentModal from '../components/subscription/PaymentModal'
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

const Upgrade = () => {
  const navigate = useNavigate()
  const { plans, subscription, loading } = useSubscription()
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId)
    setShowModal(true)
  }

  const getCurrentPlanId = () => {
    return subscription?.plan || 'free'
  }

  // Plan comparison data - matches Pricing page exactly (INR pricing)
  const comparisonFeatures = [
    {
      feature: 'Monthly Price',
      free: 'Free',
      basic: '₹99/month',
      pro: '₹499/month'
    },
    {
      feature: 'Free Tools Usage',
      free: 'Unlimited',
      basic: 'Unlimited',
      pro: 'Unlimited'
    },
    {
      feature: 'Files per month',
      free: 'Unlimited (Free Tools)',
      basic: '50',
      pro: 'Unlimited'
    },
    {
      feature: 'Max file size',
      free: '10 MB',
      basic: '50 MB',
      pro: '200 MB'
    },
    {
      feature: 'Storage',
      free: 'No Storage',
      basic: '500 MB',
      pro: 'Unlimited'
    },
    {
      feature: 'Advanced OCR Pages',
      free: 'None',
      basic: '25',
      pro: 'Unlimited'
    },
    {
      feature: 'AI Chat Messages',
      free: 'None',
      basic: '25',
      pro: 'Unlimited'
    },
    {
      feature: 'AI Summaries',
      free: 'None',
      basic: '25',
      pro: 'Unlimited'
    },
    {
      feature: 'Advanced Tools Access',
      free: false,
      basic: true,
      pro: true
    },
    {
      feature: 'Advanced Settings',
      free: false,
      basic: false,
      pro: true
    },
    {
      feature: 'Priority Support',
      free: false,
      basic: false,
      pro: true
    }
  ]

  const renderFeatureValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-green-500 mx-auto" />
      ) : (
        <X className="h-4 w-4 text-gray-300 mx-auto" />
      )
    }
    return <span className="text-sm">{value}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page mobile-spacing-dark">
        <div className="layout-dark-container py-12">
          <div className="space-y-6">
            <div className="h-8 bg-elevated rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-elevated rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden mobile-spacing-dark">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      <div className="layout-dark-container py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="btn-dark-glass mb-4 self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <h1 className="heading-dark-1 text-gradient-hero">Choose Your Plan</h1>
          </div>
          
          <p className="body-dark-large text-card-foreground max-w-2xl mx-auto">
            Unlock the full potential of RobotPDF with advanced features, 
            higher limits, and priority support
          </p>
          
          {subscription && (
            <Badge variant="outline" className="badge-grey text-sm">
              Currently on {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} plan
            </Badge>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === getCurrentPlanId()}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card className="peach-card">
          <CardHeader>
            <CardTitle className="heading-peach-4 text-center text-foreground">Detailed Feature Comparison</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Compare all features across our plans
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-card-foreground">Feature</th>
                    <th className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-card-foreground">Free</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span className="font-medium text-card-foreground">Basic</span>
                        <Badge className="ml-1 badge-purple">Popular</Badge>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-card-foreground">Pro</span>
                        <Badge className="ml-1 badge-blue">Best Value</Badge>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, index) => (
                    <tr key={index} className="border-b border-border hover:bg-elevated/50">
                      <td className="py-3 px-4 font-medium text-card-foreground">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-card-foreground">
                        {renderFeatureValue(row.free)}
                      </td>
                      <td className="py-3 px-4 text-center text-card-foreground">
                        {renderFeatureValue(row.basic)}
                      </td>
                      <td className="py-3 px-4 text-center text-card-foreground">
                        {renderFeatureValue(row.pro)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="peach-card">
          <CardHeader>
            <CardTitle className="heading-peach-4 text-foreground">Frequently Asked Questions</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-card-foreground">Can I change plans anytime?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. 
                  Changes take effect immediately with prorated billing.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-card-foreground">What happens to my files if I downgrade?</h4>
                <p className="text-sm text-muted-foreground">
                  Your files remain safe. You'll just have lower monthly limits 
                  for new operations going forward.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-card-foreground">Is there a free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  All paid plans come with a 7-day free trial. 
                  Cancel anytime during the trial with no charges.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-card-foreground">How secure is my data?</h4>
                <p className="text-sm text-muted-foreground">
                  We use enterprise-grade security with end-to-end encryption. 
                  Your files are processed securely and never shared.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-4 py-8">
          <h2 className="heading-dark-2 text-foreground">Ready to get started?</h2>
          <p className="text-muted-foreground">
            Join thousands of users who trust RobotPDF for their document processing needs
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => handleSelectPlan('basic')}
              className="btn-purple"
            >
              Start Basic Plan
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleSelectPlan('pro')}
              className="btn-dark-outline"
            >
              Go Pro
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        plan={plans.find(p => p.id === selectedPlan)}
        onSuccess={async () => {
          // Refresh subscription data after successful payment
          window.location.reload()
        }}
      />
    </div>
  )
}

export default Upgrade