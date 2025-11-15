import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import RazorpayPayment from './RazorpayPayment';
import PayPalPayment from './PayPalPayment';
import SubscriptionSuccessModal from '../SubscriptionSuccessModal';
import { Loader2, MapPin, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [gateway, setGateway] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Detect user location and get payment methods
  useEffect(() => {
    if (isOpen && user) {
      detectLocationAndPaymentMethods();
    }
  }, [isOpen, user]);

  const detectLocationAndPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserLocation(data.countryCode);
        setGateway(data.recommendedGateway);
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      // Default to PayPal for international
      setGateway('paypal');
    }
  };

  const initiatePayment = async () => {
    if (!plan || !user) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          plan: plan.id,
          countryCode: userLocation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const data = await response.json();
      setPaymentData(data);
      setGateway(data.gateway);

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    // Store subscription details for success modal
    setSubscriptionDetails({
      plan: plan?.id,
      expires_at: response?.subscription?.expires_at || new Date(Date.now() + 30*24*60*60*1000).toISOString()
    });
    
    // Close payment modal
    onClose();
    
    // Show success modal
    setShowSuccessModal(true);
  };
  
  const handleSuccessModalClose = async () => {
    setShowSuccessModal(false);
    
    // Refresh subscription data
    if (onSuccess) {
      await onSuccess();
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  };

  const getGatewayName = () => {
    if (gateway === 'razorpay') return 'Razorpay';
    if (gateway === 'paypal') return 'PayPal';
    return 'Payment Gateway';
  };

  const getGatewayIcon = () => {
    if (gateway === 'razorpay') {
      return <CreditCard className="h-4 w-4" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] dark-card">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {getGatewayIcon()}
            Subscribe to {plan?.name} Plan
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete your payment to activate your subscription
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Location Info */}
          {userLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-elevated/30 p-3 rounded-lg">
              <MapPin className="h-4 w-4" />
              <span>
                Detected location: <strong>{userLocation}</strong>
              </span>
              <Badge variant="outline" className="ml-auto">
                {getGatewayName()}
              </Badge>
            </div>
          )}

          {/* Loading State */}
          {loading && !paymentData && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-sm text-muted-foreground">
                Setting up your payment...
              </p>
            </div>
          )}

          {/* Payment Gateway Selection */}
          {!loading && !paymentData && (
            <div className="space-y-4">
              <div className="bg-elevated/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Plan Details</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{plan?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-bold text-foreground">
                    ₹{plan?.id === 'basic' ? '99' : '499'}/month
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <span className="text-sm text-foreground">
                    {userLocation === 'IN' ? 'All methods available' : 'Card payments only'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gateway</span>
                  <span className="text-sm text-foreground">Razorpay</span>
                </div>
              </div>

              <Button
                onClick={initiatePayment}
                className="w-full btn-purple"
                size="lg"
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* Razorpay Payment */}
          {!loading && paymentData && gateway === 'razorpay' && (
            <RazorpayPayment
              orderId={paymentData.orderId || paymentData.subscriptionId}
              amount={paymentData.amount}
              currency={paymentData.currency}
              plan={plan?.id}
              userEmail={user?.email}
              userName={user?.name || user?.email}
              countryCode={userLocation}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}

          {/* PayPal Payment */}
          {!loading && paymentData && gateway === 'paypal' && (
            <PayPalPayment
              subscriptionId={paymentData.subscriptionId}
              approvalUrl={paymentData.approvalUrl}
              amount={paymentData.amount}
              currency={paymentData.currency}
              plan={plan?.id}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>By subscribing, you agree to our Terms of Service and Privacy Policy</p>
          <p>You can cancel your subscription anytime from your account settings</p>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Success Modal */}
    <SubscriptionSuccessModal
      isOpen={showSuccessModal}
      onClose={handleSuccessModalClose}
      plan={plan?.id}
      details={subscriptionDetails}
    />
    </>
  );
};

export default PaymentModal;
