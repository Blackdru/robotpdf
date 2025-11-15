require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function updateUserPlan() {
  const targetEmail = 'rajnaresh308@gmail.com';
  const targetPlan = 'premium'; // Enterprise plan
  
  try {
    console.log(`Updating user ${targetEmail} to ${targetPlan} plan...`);
    
    // First, find the user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', targetEmail)
      .single();
    
    if (userError || !user) {
      console.error('User not found:', userError?.message || 'No user with that email');
      return;
    }
    
    console.log('Found user:', user);
    
    // Check if user already has a subscription
    const { data: existingSubscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (subError && subError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking subscription:', subError.message);
      return;
    }
    
    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: targetPlan,
          status: 'active',
          current_period_end: null, // Set to null for lifetime access
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating subscription:', updateError.message);
        return;
      }
      
      console.log('Updated subscription:', updatedSub);
    } else {
      // Create new subscription
      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: targetPlan,
          status: 'active',
          current_period_end: null, // Set to null for lifetime access
          cancel_at_period_end: false
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating subscription:', createError.message);
        return;
      }
      
      console.log('Created subscription:', newSub);
    }
    
    // Reset usage for the user (optional)
    const { error: usageError } = await supabaseAdmin
      .from('subscription_usage')
      .upsert({
        user_id: user.id,
        month_year: new Date().toISOString().slice(0, 7), // YYYY-MM format
        files_processed: 0,
        storage_used: 0,
        ai_operations: 0,
        api_calls: 0
      });
    
    if (usageError) {
      console.warn('Warning: Could not reset usage:', usageError.message);
    } else {
      console.log('Reset usage for current month');
    }
    
    console.log(`✅ Successfully updated ${targetEmail} to ${targetPlan} plan!`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
updateUserPlan().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});