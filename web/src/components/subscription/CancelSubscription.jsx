import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useSubscription } from '../../contexts/SubscriptionContext'
import { AlertTriangle, Calendar, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CancelSubscription = ({ isOpen, onClose }) => {
  const { 
    subscription, 
    cancelSubscription, 
    reactivateSubscription,
    isCancelledButActive 
  } = useSubscription()
  
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const cancellationReasons = [
    'Too expensive',
    'Not using it enough',
    'Missing features I need',
    'Found a better alternative',
    'Technical issues',
    'Other'
  ]

  const handleClose = () => {
    setStep(1)
    setReason('')
    setFeedback('')
    onClose()
  }

  const handleCancel = async (immediate = false) => {
    setLoading(true)
    try {
      const result = await cancelSubscription(immediate)
      if (result.success) {
        handleClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setLoading(true)
    try {
      const result = await reactivateSubscription()
      if (result.success) {
        handleClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // If subscription is already cancelled but still active
  if (isCancelledButActive()) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-500" />
              Subscription Scheduled for Cancellation
            </DialogTitle>
            <DialogDescription>
              Your subscription is set to cancel at the end of your billing period
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <p className="text-sm text-pink-800">
                    Your subscription will end on{' '}
                    <span className="font-semibold">
                      {formatDate(subscription.current_period_end)}
                    </span>
                  </p>
                  <p className="text-xs text-pink-600 mt-1">
                    You'll continue to have access until then
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Changed your mind? You can reactivate your subscription anytime before it ends.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button 
              onClick={handleReactivate}
              disabled={loading}
            >
              {loading ? 'Reactivating...' : 'Reactivate Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "We're sorry to see you go. Help us improve by telling us why."
              : "Choose how you'd like to cancel your subscription."
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Why are you cancelling? (Optional)
              </Label>
              <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
                {cancellationReasons.map((reasonOption) => (
                  <div key={reasonOption} className="flex items-center space-x-2">
                    <RadioGroupItem value={reasonOption} id={reasonOption} />
                    <Label htmlFor={reasonOption} className="text-sm">
                      {reasonOption}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-sm font-medium">
                Additional feedback (Optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Tell us how we could improve..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Cancel at Period End (Recommended)
                    </h4>
                    <p className="text-sm text-blue-800">
                      Keep access until {formatDate(subscription?.current_period_end)} and avoid losing your data
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">
                      Cancel Immediately
                    </h4>
                    <p className="text-sm text-red-800">
                      Lose access right away. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Keep Subscription
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleCancel(false)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Cancel at Period End'}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleCancel(true)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Cancel Immediately'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CancelSubscription