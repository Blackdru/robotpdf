import { useState } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2, CreditCard, Shield } from 'lucide-react'

const PaymentForm = ({ clientSecret, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
        redirect: 'if_required'
      })

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message)
          onError(error.message)
        } else {
          setMessage('An unexpected error occurred.')
          onError('An unexpected error occurred.')
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      setMessage('An unexpected error occurred.')
      onError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const paymentElementOptions = {
    layout: 'tabs',
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <PaymentElement 
              options={paymentElementOptions}
              className="p-4 border rounded-lg"
            />
            
            <AddressElement 
              options={{ mode: 'billing' }}
              className="p-4 border rounded-lg"
            />
          </div>

          {message && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={!stripe || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Payment'
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secured by Stripe • SSL Encrypted</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Your subscription will start immediately after payment</p>
            <p>• You can cancel anytime from your account settings</p>
            <p>• All payments are processed securely by Stripe</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PaymentForm