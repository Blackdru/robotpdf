import { useState } from 'react';
import { Button } from '../ui/button';
import { Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const RazorpayPayment = ({ 
  orderId, 
  amount, 
  currency, 
  plan,
  userEmail,
  userName,
  countryCode,
  onSuccess, 
  onError 
}) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Determine if user is in India for full payment options
  const isIndia = countryCode === 'IN' || currency === 'INR';

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'RobotPDF',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail
        },
        theme: {
          color: '#8B5CF6'
        },
        // For international users, show only card payment
        ...(!isIndia && {
          config: {
            display: {
              blocks: {
                card: {
                  name: 'Pay with Card',
                  instruments: [
                    {
                      method: 'card'
                    }
                  ]
                }
              },
              sequence: ['block.card'],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          method: {
            card: true,
            netbanking: false,
            wallet: false,
            upi: false
          }
        }),
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/subscriptions/verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  plan: plan
                })
              }
            );

            if (verifyResponse.ok) {
              const result = await verifyResponse.json();
              toast.success('Payment successful! Your subscription is now active.');
              onSuccess(response);
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed');
            onError(error);
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed');
        setLoading(false);
      });
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Failed to initiate payment';
      toast.error(errorMessage);
      onError(error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-elevated/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Plan</span>
          <span className="font-medium text-foreground">
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-bold text-lg text-foreground">
            ₹{(amount / 100).toFixed(2)}
          </span>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            • Secure payment powered by Razorpay
          </p>
          {isIndia ? (
            <>
              <p className="text-xs text-muted-foreground">
                • UPI, Cards, Net Banking, and Wallets supported
              </p>
              <p className="text-xs text-muted-foreground">
                • All Indian payment methods available
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                • International card payments only
              </p>
              <p className="text-xs text-muted-foreground">
                • Visa, Mastercard, Amex, and other cards supported
              </p>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            • Cancel anytime from your account settings
          </p>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full btn-purple"
        size="lg"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ₹{(amount / 100).toFixed(2)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>Secured by Razorpay • SSL Encrypted</span>
      </div>
    </div>
  );
};

export default RazorpayPayment;
