import { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useSubscription } from '../../contexts/SubscriptionContext'
import PlanCard from './PlanCard'
import PaymentForm from './PaymentForm'
import { X, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const SubscriptionModal = ({ isOpen, onClose, initialTab = 'plans' }) => {
  const { 
    plans, 
    subscription, 
    createSubscription, 
    stripePromise 
  } = useSubscription()
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setActiveTab('plans')
    setSelectedPlan(null)
    setClientSecret(null)
    onClose()
  }

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') {
      setLoading(true)
      try {
        const result = await createSubscription('free')
        if (result.success) {
          toast.success('Free plan activated!')
          handleClose()
        }
      } catch (error) {
        toast.error('Failed to activate free plan')
      } finally {
        setLoading(false)
      }
      return
    }

    // For paid plans, proceed to payment
    const plan = plans.find(p => p.id === planId)
    setSelectedPlan(plan)
    
    setLoading(true)
    try {
      const result = await createSubscription(planId)
      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret)
        setActiveTab('payment')
      } else {
        toast.error('Failed to initialize payment')
      }
    } catch (error) {
      toast.error('Failed to create subscription')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    toast.success('Subscription activated successfully!')
    handleClose()
  }

  const handlePaymentError = (error) => {
    toast.error(error || 'Payment failed')
    setActiveTab('plans')
    setSelectedPlan(null)
    setClientSecret(null)
  }

  const getCurrentPlanId = () => {
    return subscription?.plan || 'free'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {activeTab === 'plans' ? 'Choose Your Plan' : 'Complete Payment'}
              </DialogTitle>
              <DialogDescription>
                {activeTab === 'plans' 
                  ? 'Select the perfect plan for your PDF processing needs'
                  : `Complete your subscription to ${selectedPlan?.name} plan`
                }
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans" disabled={activeTab === 'payment'}>
              Plans
            </TabsTrigger>
            <TabsTrigger value="payment" disabled={!clientSecret}>
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={plan.id === getCurrentPlanId()}
                  onSelectPlan={handleSelectPlan}
                />
              ))}
            </div>

            <div className="text-center space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Why upgrade?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Process More Files</h4>
                  <p className="text-muted-foreground">
                    Handle larger volumes with higher monthly limits and bigger file sizes
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">AI-Powered Features</h4>
                  <p className="text-muted-foreground">
                    Unlock document summaries, chat with PDFs, and advanced OCR
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Priority Support</h4>
                  <p className="text-muted-foreground">
                    Get faster response times and dedicated customer support
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            {clientSecret && selectedPlan && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('plans')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Plans
                  </Button>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  <div className="flex justify-between items-center">
                    <span>{selectedPlan.name} Plan</span>
                    <span className="font-semibold">${selectedPlan.price}/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Billed monthly • Cancel anytime
                  </div>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionModal