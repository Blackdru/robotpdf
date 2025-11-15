const paypal = require('@paypal/checkout-server-sdk');
const { supabaseAdmin } = require('../config/supabase');

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

// PayPal client
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

class PayPalService {
  /**
   * Create a PayPal subscription
   */
  async createSubscription(userId, plan, email, name) {
    try {
      const planDetails = this.getPlanDetails(plan);
      
      if (!planDetails) {
        throw new Error(`Invalid plan: ${plan}`);
      }

      // Create subscription request
      const request = new paypal.v1.billing.SubscriptionsCreateRequest();
      request.requestBody({
        plan_id: planDetails.paypalPlanId,
        subscriber: {
          name: {
            given_name: name?.split(' ')[0] || 'User',
            surname: name?.split(' ').slice(1).join(' ') || 'Name'
          },
          email_address: email
        },
        application_context: {
          brand_name: 'RobotPDF',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.FRONTEND_URL}/billing?success=true`,
          cancel_url: `${process.env.FRONTEND_URL}/billing?cancelled=true`
        },
        custom_id: userId
      });

      const response = await client().execute(request);
      const subscription = response.result;

      // Store subscription in database
      await this.updateSubscriptionInDatabase(subscription, userId, plan);

      return {
        subscriptionId: subscription.id,
        approvalUrl: subscription.links.find(link => link.rel === 'approve')?.href,
        subscription
      };
    } catch (error) {
      console.error('Error creating PayPal subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Create a PayPal order for one-time payment
   */
  async createOrder(amount, currency, userId, plan, email) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: (amount / 100).toFixed(2) // Convert from cents to dollars
          },
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
          custom_id: userId
        }],
        application_context: {
          brand_name: 'RobotPDF',
          locale: 'en-US',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/billing?success=true`,
          cancel_url: `${process.env.FRONTEND_URL}/billing?cancelled=true`
        }
      });

      const response = await client().execute(request);
      return response.result;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Capture PayPal order payment
   */
  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      
      const response = await client().execute(request);
      return response.result;
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      throw new Error('Failed to capture payment');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const request = new paypal.v1.billing.SubscriptionsGetRequest(subscriptionId);
      const response = await client().execute(request);
      return response.result;
    } catch (error) {
      console.error('Error getting PayPal subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, reason = 'Customer request') {
    try {
      const request = new paypal.v1.billing.SubscriptionsCancelRequest(subscriptionId);
      request.requestBody({
        reason: reason
      });

      await client().execute(request);

      // Update database
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('paypal_subscription_id', subscriptionId);

      return { status: 'cancelled' };
    } catch (error) {
      console.error('Error canceling PayPal subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Suspend a subscription
   */
  async suspendSubscription(subscriptionId, reason = 'Customer request') {
    try {
      const request = new paypal.v1.billing.SubscriptionsSuspendRequest(subscriptionId);
      request.requestBody({
        reason: reason
      });

      await client().execute(request);

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('paypal_subscription_id', subscriptionId);

      return { status: 'suspended' };
    } catch (error) {
      console.error('Error suspending PayPal subscription:', error);
      throw new Error('Failed to suspend subscription');
    }
  }

  /**
   * Activate a subscription
   */
  async activateSubscription(subscriptionId, reason = 'Customer request') {
    try {
      const request = new paypal.v1.billing.SubscriptionsActivateRequest(subscriptionId);
      request.requestBody({
        reason: reason
      });

      await client().execute(request);

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('paypal_subscription_id', subscriptionId);

      return { status: 'active' };
    } catch (error) {
      console.error('Error activating PayPal subscription:', error);
      throw new Error('Failed to activate subscription');
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhookSignature(headers, body) {
    try {
      const request = new paypal.notifications.WebhookVerifySignatureRequest();
      request.requestBody({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: body
      });

      const response = await client().execute(request);
      return response.result.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  /**
   * Handle PayPal webhook events
   */
  async handleWebhook(event) {
    try {
      const eventType = event.event_type;
      const resource = event.resource;

      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.UPDATED':
          await this.handleSubscriptionUpdated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(resource);
          break;

        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await this.handleSubscriptionSuspended(resource);
          break;

        case 'BILLING.SUBSCRIPTION.EXPIRED':
          await this.handleSubscriptionExpired(resource);
          break;

        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentCompleted(resource);
          break;

        case 'PAYMENT.SALE.REFUNDED':
          await this.handlePaymentRefunded(resource);
          break;

        default:
          console.log(`Unhandled PayPal event type: ${eventType}`);
      }
    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }

  /**
   * Handle subscription activated
   */
  async handleSubscriptionActivated(subscription) {
    const userId = subscription.custom_id;
    if (!userId) return;

    await this.updateSubscriptionInDatabase(subscription, userId, subscription.plan_id);
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    const userId = subscription.custom_id;
    if (!userId) return;

    await this.updateSubscriptionInDatabase(subscription, userId, subscription.plan_id);
  }

  /**
   * Handle subscription cancelled
   */
  async handleSubscriptionCancelled(subscription) {
    const userId = subscription.custom_id;
    if (!userId) return;

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id);
  }

  /**
   * Handle subscription suspended
   */
  async handleSubscriptionSuspended(subscription) {
    const userId = subscription.custom_id;
    if (!userId) return;

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id);
  }

  /**
   * Handle subscription expired
   */
  async handleSubscriptionExpired(subscription) {
    const userId = subscription.custom_id;
    if (!userId) return;

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id);
  }

  /**
   * Handle payment completed
   */
  async handlePaymentCompleted(payment) {
    const subscriptionId = payment.billing_agreement_id;
    
    // Get subscription to find user
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (!subscription) return;

    // Record payment transaction
    await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscriptionId,
        paypal_payment_id: payment.id,
        amount: Math.round(parseFloat(payment.amount.total) * 100), // Convert to cents
        currency: payment.amount.currency,
        status: 'succeeded',
        payment_method: 'paypal',
        metadata: {
          payment_mode: payment.payment_mode,
          state: payment.state
        }
      });
  }

  /**
   * Handle payment refunded
   */
  async handlePaymentRefunded(refund) {
    const saleId = refund.sale_id;
    
    // Update transaction status
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'refunded',
        metadata: {
          refund_id: refund.id,
          refund_amount: refund.amount.total
        }
      })
      .eq('paypal_payment_id', saleId);
  }

  /**
   * Update subscription in database
   */
  async updateSubscriptionInDatabase(paypalSubscription, userId, planId) {
    // Extract plan name from plan_id or use default
    const plan = this.extractPlanFromId(planId) || 'basic';

    const subscriptionData = {
      user_id: userId,
      plan: plan,
      status: paypalSubscription.status?.toLowerCase() || 'active',
      paypal_subscription_id: paypalSubscription.id,
      current_period_start: paypalSubscription.start_time 
        ? new Date(paypalSubscription.start_time).toISOString()
        : new Date().toISOString(),
      current_period_end: paypalSubscription.billing_info?.next_billing_time
        ? new Date(paypalSubscription.billing_info.next_billing_time).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancel_at_period_end: false,
      payment_method: 'paypal',
      metadata: {
        plan_id: planId,
        custom_id: paypalSubscription.custom_id
      },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error updating subscription in database:', error);
      throw error;
    }
  }

  /**
   * Extract plan name from PayPal plan ID
   */
  extractPlanFromId(planId) {
    if (!planId) return null;
    
    if (planId.includes('basic') || planId === process.env.PAYPAL_PLAN_BASIC) {
      return 'basic';
    } else if (planId.includes('pro') || planId === process.env.PAYPAL_PLAN_PRO) {
      return 'pro';
    }
    
    return null;
  }

  /**
   * Get plan details with PayPal plan IDs
   */
  getPlanDetails(plan) {
    const plans = {
      basic: {
        name: 'Basic',
        amount: 100, // $1.00
        currency: 'USD',
        paypalPlanId: process.env.PAYPAL_PLAN_BASIC || 'P-BASIC'
      },
      pro: {
        name: 'Pro',
        amount: 1000, // $10.00
        currency: 'USD',
        paypalPlanId: process.env.PAYPAL_PLAN_PRO || 'P-PRO'
      }
    };

    return plans[plan];
  }

  /**
   * Create PayPal billing plans (run this once to set up plans)
   */
  async createPlans() {
    try {
      // Create Basic plan
      const basicPlanRequest = new paypal.v1.billing.PlansCreateRequest();
      basicPlanRequest.requestBody({
        product_id: process.env.PAYPAL_PRODUCT_ID,
        name: 'Basic Plan',
        description: 'Basic subscription plan with 100 files per month',
        status: 'ACTIVE',
        billing_cycles: [{
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: '1.00',
              currency_code: 'USD'
            }
          }
        }],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        }
      });

      const basicPlanResponse = await client().execute(basicPlanRequest);
      console.log('Basic Plan created:', basicPlanResponse.result.id);

      // Create Pro plan
      const proPlanRequest = new paypal.v1.billing.PlansCreateRequest();
      proPlanRequest.requestBody({
        product_id: process.env.PAYPAL_PRODUCT_ID,
        name: 'Pro Plan',
        description: 'Pro subscription plan with unlimited files',
        status: 'ACTIVE',
        billing_cycles: [{
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: '10.00',
              currency_code: 'USD'
            }
          }
        }],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        }
      });

      const proPlanResponse = await client().execute(proPlanRequest);
      console.log('Pro Plan created:', proPlanResponse.result.id);

      return {
        basicPlan: basicPlanResponse.result,
        proPlan: proPlanResponse.result
      };
    } catch (error) {
      console.error('Error creating PayPal plans:', error);
      throw error;
    }
  }
}

module.exports = new PayPalService();
