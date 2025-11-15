const { supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

async function updateUserToPro(email) {
  try {
    console.log(`Updating user ${email} to lifetime pro plan...`);
    
    // First, find the user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      console.error('User not found:', userError?.message || 'No user with this email');
      return false;
    }
    
    console.log('Found user:', user.name, user.email);
    
    // Update or create subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date('2099-12-31').toISOString(), // Lifetime
          cancel_at_period_end: false,
          cancelled_at: null,
          metadata: {
            ...existingSubscription.metadata,
            lifetime: true,
            upgraded_by: 'admin',
            upgraded_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return false;
      }
      
      console.log('✅ Subscription updated successfully');
    } else {
      // Create new pro subscription
      const { error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date('2099-12-31').toISOString(), // Lifetime
          cancel_at_period_end: false,
          started_at: new Date().toISOString(),
          metadata: {
            lifetime: true,
            upgraded_by: 'admin',
            upgraded_at: new Date().toISOString()
          }
        });
      
      if (createError) {
        console.error('Error creating subscription:', createError);
        return false;
      }
      
      console.log('✅ Pro subscription created successfully');
    }
    
    // Reset usage for the current month to give them a fresh start
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { error: usageError } = await supabaseAdmin
      .from('subscription_usage')
      .upsert({
        user_id: user.id,
        month_year: currentMonth,
        files_processed: 0,
        storage_used: 0,
        ai_operations: 0,
        api_calls: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month_year'
      });
    
    if (usageError) {
      console.warn('Warning: Could not reset usage stats:', usageError.message);
    } else {
      console.log('✅ Usage stats reset for current month');
    }
    
    console.log(`🎉 User ${email} successfully upgraded to lifetime Pro plan!`);
    return true;
    
  } catch (error) {
    console.error('Error updating user to pro:', error);
    return false;
  }
}

// Run the script
const email = 'rajnaresh308@gmail.com';
updateUserToPro(email)
  .then(success => {
    if (success) {
      console.log('✅ Update completed successfully');
    } else {
      console.log('❌ Update failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });