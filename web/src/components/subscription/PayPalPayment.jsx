import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const PayPalPayment = ({ 
  subscriptionId,
  approvalUrl,
  amount, 
  currency, 
  plan,
  onSuccess, 
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalRef = useRef();

  useEffect(() => {
    // Load PayPal SDK
    const loadPayPalScript = () => {
      if (window.paypal) {
        setSdkReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
      script.addEventListener('load', () => setSdkReady(true));
      script.addEventListener('error', () => {
        toast.error('Failed to load PayPal SDK');
      });
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, []);

  useEffect(() => {
    if (sdkReady && paypalRef.current && subscriptionId) {
      // Render PayPal button
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'subscribe'
        },
        createSubscription: function(data, actions) {
          // Use the subscription ID from backend
          return subscriptionId;
        },
        onApprove: async function(data) {
          try {
            setLoading(true);
            toast.success('Subscription activated successfully!');
            onSuccess(data);
          } catch (error) {
            console.error('Subscription approval error:', error);
            toast.error('Failed to activate subscription');
            onError(error);
          } finally {
            setLoading(false);
          }
        },
        onError: function(err) {
          console.error('PayPal error:', err);
          toast.error('Payment failed. Please try again.');
          onError(err);
        },
        onCancel: function() {
          toast.error('Payment cancelled');
        }
      }).render(paypalRef.current);
    }
  }, [sdkReady, subscriptionId]);

  const handleDirectApproval = () => {
    if (approvalUrl) {
      window.location.href = approvalUrl;
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
            ${(amount / 100).toFixed(2)} {currency}
          </span>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            • Secure payment powered by PayPal
          </p>
          <p className="text-xs text-muted-foreground">
            • Pay with PayPal balance or credit/debit card
          </p>
          <p className="text-xs text-muted-foreground">
            • Cancel anytime from your account settings
          </p>
        </div>
      </div>

      {/* PayPal Button Container */}
      <div ref={paypalRef} className="min-h-[150px]" />

      {/* Fallback button if PayPal SDK fails to load */}
      {!sdkReady && approvalUrl && (
        <Button
          onClick={handleDirectApproval}
          disabled={loading}
          className="w-full btn-blue"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            'Continue with PayPal'
          )}
        </Button>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>Secured by PayPal • SSL Encrypted</span>
      </div>
    </div>
  );
};

export default PayPalPayment;
