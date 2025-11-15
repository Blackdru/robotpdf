const Stripe = require('stripe');
const { supabaseAdmin } = require('../config/supabase');
const { getStripePriceId } = require('../../../shared/currencies');

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Create a Stripe customer
   */
  async createCustomer(email, name, userId, currency = 'USD') {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        preferred_locales: [this.getLocaleFromCurrency(currency)],
        metadata: {
          userId,
          preferredCurrency: currency
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a subscription with currency support
   */
  async createSubscription(customerId, plan, userId, currency = 'USD') {
    try {
      // Get the correct price ID for the plan and currency
      const priceId = getStripePriceId(plan, currency);
      
      if (!priceId) {
        throw new Error(`Price ID not found for plan: ${plan}, currency: ${currency}`);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          plan,
          currency
        }
      });

      // Update subscription in database
      await this.updateSubscriptionInDatabase(subscription, userId);

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscription
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Get locale from currency code
   */
  getLocaleFromCurrency(currency) {
    const localeMap = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      INR: 'en-IN',
      CAD: 'en-CA',
      AUD: 'en-AU',
      JPY: 'ja-JP',
      BRL: 'pt-BR',
      MXN: 'es-MX',
      SGD: 'en-SG',
      CHF: 'de-CH',
      CNY: 'zh-CN',
      SEK: 'sv-SE',
      NOK: 'nb-NO',
      DKK: 'da-DK',
      PLN: 'pl-PL',
      NZD: 'en-NZ',
      ZAR: 'en-ZA',
      AED: 'ar-AE',
      SAR: 'ar-SA'
    };
    
    return localeMap[currency] || 'en-US';
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Immediately cancel a subscription
   */
  async cancelSubscriptionImmediately(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription immediately:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a subscription
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Update subscription plan with currency support
   */
  async updateSubscriptionPlan(subscriptionId, newPlan, currency = 'USD') {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Get the correct price ID for the new plan and currency
      const newPriceId = getStripePriceId(newPlan, currency);
      
      if (!newPriceId) {
        throw new Error(`Price ID not found for plan: ${newPlan}, currency: ${currency}`);
      }
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          ...subscription.metadata,
          plan: newPlan,
          currency
        }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw new Error('Failed to update subscription plan');
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(amount, currency = 'usd', customerId, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        metadata
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error('Failed to get payment methods');
    }
  }

  /**
   * Get customer's invoices
   */
  async getInvoices(customerId, limit = 10) {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit
      });

      return invoices;
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw new Error('Failed to get invoices');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await this.updateSubscriptionInDatabase(subscription, userId);
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await this.updateSubscriptionInDatabase(subscription, userId);
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription on deletion:', error);
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    
    // Record payment transaction
    const { error } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: invoice.metadata?.userId,
        subscription_id: subscriptionId,
        stripe_payment_intent_id: invoice.payment_intent,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        metadata: {
          invoice_id: invoice.id,
          customer_id: customerId
        }
      });

    if (error) {
      console.error('Error recording payment transaction:', error);
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    
    // Record failed payment transaction
    const { error } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: invoice.metadata?.userId,
        subscription_id: subscriptionId,
        stripe_payment_intent_id: invoice.payment_intent,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        metadata: {
          invoice_id: invoice.id,
          customer_id: customerId,
          failure_reason: invoice.last_finalization_error?.message
        }
      });

    if (error) {
      console.error('Error recording failed payment transaction:', error);
    }

    // Update subscription status if needed
    if (subscriptionId) {
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (subError) {
        console.error('Error updating subscription status on payment failure:', subError);
      }
    }
  }

  /**
   * Handle trial will end
   */
  async handleTrialWillEnd(subscription) {
    // You can implement email notifications or other actions here
    console.log(`Trial will end for subscription: ${subscription.id}`);
  }

  /**
   * Update subscription in database
   */
  async updateSubscriptionInDatabase(stripeSubscription, userId) {
    // Get plan from metadata (more reliable than price ID mapping)
    const plan = stripeSubscription.metadata?.plan || 'free';
    const currency = stripeSubscription.metadata?.currency || 'USD';

    const subscriptionData = {
      user_id: userId,
      plan,
      status: stripeSubscription.status,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      cancelled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : null,
      trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : null,
      trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
      metadata: {
        ...stripeSubscription.metadata,
        currency
      },
      updated_at: new Date().toISOString()
    };

    // Upsert subscription
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
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw new Error('Failed to get customer');
    }
  }
}

module.exports = new StripeService();