const { supabaseAdmin } = require('../config/supabase');

class SubscriptionExpiryService {
  /**
   * Check and expire subscriptions that have passed their end date
   */
  async checkExpiredSubscriptions() {
    try {
      const now = new Date().toISOString();
      
      // Find expired subscriptions
      const { data: expiredSubs, error: findError } = await supabaseAdmin
        .from('subscriptions')
        .select('id, user_id, plan, current_period_end')
        .eq('status', 'active')
        .in('plan', ['basic', 'pro', 'premium'])
        .lt('current_period_end', now);

      if (findError) {
        console.error('Error finding expired subscriptions:', findError);
        return { success: false, error: findError };
      }

      if (!expiredSubs || expiredSubs.length === 0) {
        console.log('No expired subscriptions found');
        return { success: true, expired: 0 };
      }

      console.log(`Found ${expiredSubs.length} expired subscriptions`);

      // Update to expired status and downgrade to free
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'expired',
          plan: 'free',
          updated_at: now
        })
        .in('id', expiredSubs.map(sub => sub.id));

      if (updateError) {
        console.error('Error updating expired subscriptions:', updateError);
        return { success: false, error: updateError };
      }

      console.log(`Successfully expired ${expiredSubs.length} subscriptions`);

      // Send expiry emails
      const emailService = require('./emailService');
      for (const sub of expiredSubs) {
        try {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email, name')
            .eq('id', sub.user_id)
            .single();

          if (user) {
            await emailService.sendSubscriptionExpiryEmail(
              user.email,
              user.name,
              sub.plan
            );
          }
        } catch (emailError) {
          console.error(`Error sending expiry email to user ${sub.user_id}:`, emailError);
        }
      }

      return { 
        success: true, 
        expired: expiredSubs.length,
        subscriptions: expiredSubs 
      };
    } catch (error) {
      console.error('Error in checkExpiredSubscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start periodic check (runs every hour)
   */
  startPeriodicCheck() {
    // Run immediately
    this.checkExpiredSubscriptions();
    
    // Then run every hour
    this.interval = setInterval(() => {
      this.checkExpiredSubscriptions();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Subscription expiry checker started (runs every hour)');
  }

  /**
   * Stop periodic check
   */
  stopPeriodicCheck() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('Subscription expiry checker stopped');
    }
  }
}

module.exports = new SubscriptionExpiryService();
