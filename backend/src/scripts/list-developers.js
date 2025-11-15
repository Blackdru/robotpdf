#!/usr/bin/env node

/**
 * CLI script to list all developers
 * 
 * Usage:
 *   node list-developers.js
 */

require('dotenv').config();
const developerService = require('../services/developerService');

async function main() {
  console.log('📋 Fetching all developers...\n');

  try {
    const developers = await developerService.listDevelopers();

    if (developers.length === 0) {
      console.log('No developers found.');
      return;
    }

    console.log(`Found ${developers.length} developer(s):\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    developers.forEach((dev, index) => {
      const status = dev.is_active ? '✅ Active' : '❌ Inactive';
      const limit = dev.limits ? `${dev.limits.current_month_used}/${dev.limits.monthly_limit}` : 'N/A';
      const rate = dev.limits ? `${dev.limits.rate_limit_per_minute}/min` : 'N/A';

      console.log(`\n${index + 1}. ${dev.name} ${status}`);
      console.log(`   ID:         ${dev.id}`);
      console.log(`   Email:      ${dev.email || 'N/A'}`);
      console.log(`   API Key:    ${dev.api_key}`);
      console.log(`   Usage:      ${limit} requests this month`);
      console.log(`   Rate Limit: ${rate}`);
      console.log(`   Created:    ${new Date(dev.created_at).toLocaleString()}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show summary
    const activeCount = developers.filter(d => d.is_active).length;
    const totalUsage = developers.reduce((sum, d) => sum + (d.limits?.current_month_used || 0), 0);

    console.log('Summary:');
    console.log(`  Total Developers: ${developers.length}`);
    console.log(`  Active: ${activeCount}`);
    console.log(`  Inactive: ${developers.length - activeCount}`);
    console.log(`  Total API Calls This Month: ${totalUsage}\n`);

  } catch (error) {
    console.error('❌ Failed to list developers:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
