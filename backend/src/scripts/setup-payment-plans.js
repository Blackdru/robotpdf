/**
 * Setup Payment Plans Script
 * 
 * This script creates subscription plans in both Razorpay and PayPal
 * Run this once after setting up your payment gateway accounts
 * 
 * Usage: node src/scripts/setup-payment-plans.js
 */

require('dotenv').config();
const razorpayService = require('../services/razorpayService');
const paypalService = require('../services/paypalService');

async function setupRazorpayPlans() {
  console.log('\n=== Setting up Razorpay Plans ===\n');
  
  try {
    const plans = await razorpayService.createPlans();
    
    console.log('✅ Razorpay plans created successfully!\n');
    console.log('Pro Monthly Plan ID:', plans.proMonthlyPlan.id);
    console.log('Pro Yearly Plan ID:', plans.proYearlyPlan.id);
    console.log('Devs Monthly Plan ID:', plans.devsMonthlyPlan.id);
    console.log('Devs Yearly Plan ID:', plans.devsYearlyPlan.id);
    console.log('\nAdd these to your .env file:');
    console.log(`RAZORPAY_PLAN_PRO=${plans.proMonthlyPlan.id}`);
    console.log(`RAZORPAY_PLAN_PRO_YEARLY=${plans.proYearlyPlan.id}`);
    console.log(`RAZORPAY_PLAN_DEVS=${plans.devsMonthlyPlan.id}`);
    console.log(`RAZORPAY_PLAN_DEVS_YEARLY=${plans.devsYearlyPlan.id}`);
    
    return plans;
  } catch (error) {
    console.error('❌ Error creating Razorpay plans:', error.message);
    throw error;
  }
}

async function setupPayPalPlans() {
  console.log('\n=== Setting up PayPal Plans ===\n');
  
  try {
    const plans = await paypalService.createPlans();
    
    console.log('✅ PayPal plans created successfully!\n');
    console.log('Pro Plan ID:', plans.proPlan.id);
    console.log('Devs Plan ID:', plans.devsPlan.id);
    console.log('\nAdd these to your .env file:');
    console.log(`PAYPAL_PLAN_PRO=${plans.proPlan.id}`);
    console.log(`PAYPAL_PLAN_DEVS=${plans.devsPlan.id}`);
    
    return plans;
  } catch (error) {
    console.error('❌ Error creating PayPal plans:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Payment Plans Setup Script\n');
  console.log('This script will create subscription plans in Razorpay and PayPal\n');
  
  // Check environment variables
  const requiredEnvVars = {
    razorpay: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
    paypal: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_PRODUCT_ID']
  };
  
  let missingVars = [];
  
  // Check Razorpay vars
  requiredEnvVars.razorpay.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  // Check PayPal vars
  requiredEnvVars.paypal.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('��� Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease add these to your .env file and try again.');
    process.exit(1);
  }
  
  try {
    // Setup Razorpay plans
    const razorpayPlans = await setupRazorpayPlans();
    
    // Setup PayPal plans
    const paypalPlans = await setupPayPalPlans();
    
    console.log('\n✅ All payment plans created successfully!\n');
    console.log('=== Summary ===\n');
    console.log('Razorpay Plans:');
    console.log(`  Pro Monthly: ${razorpayPlans.proMonthlyPlan.id} (₹169/month)`);
    console.log(`  Pro Yearly: ${razorpayPlans.proYearlyPlan.id} (₹1500/year)`);
    console.log(`  Devs Monthly: ${razorpayPlans.devsMonthlyPlan.id} (₹459/month)`);
    console.log(`  Devs Yearly: ${razorpayPlans.devsYearlyPlan.id} (₹5000/year)`);
    console.log('\nPayPal Plans:');
    console.log(`  Pro: ${paypalPlans.proPlan.id} ($2/month)`);
    console.log(`  Devs: ${paypalPlans.devsPlan.id} ($6/month)`);
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the plan IDs above to your .env file');
    console.log('2. Configure webhooks in Razorpay and PayPal dashboards');
    console.log('3. Test the payment flow with test credentials');
    console.log('4. Deploy to production when ready\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nPlease check your API credentials and try again.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
