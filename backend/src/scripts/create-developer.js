#!/usr/bin/env node

/**
 * CLI script to create a developer account with API keys
 * 
 * Usage:
 *   node create-developer.js --name "Acme Corp" --email "dev@acme.com" --limit 5000 --rate 100
 */

require('dotenv').config();
const developerService = require('../services/developerService');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    name: null,
    email: null,
    monthlyLimit: 1000,
    rateLimitPerMinute: 100,
    metadata: {}
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--name':
      case '-n':
        parsed.name = value;
        break;
      case '--email':
      case '-e':
        parsed.email = value;
        break;
      case '--limit':
      case '-l':
        parsed.monthlyLimit = parseInt(value);
        break;
      case '--rate':
      case '-r':
        parsed.rateLimitPerMinute = parseInt(value);
        break;
      case '--plan':
      case '-p':
        parsed.metadata.plan = value;
        break;
      case '--company':
      case '-c':
        parsed.metadata.company = value;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${key}`);
        showHelp();
        process.exit(1);
    }
  }

  return parsed;
}

function showHelp() {
  console.log(`
RobotPDF Developer Creation Tool

Usage:
  node create-developer.js [options]

Options:
  -n, --name <name>          Developer/Company name (required)
  -e, --email <email>        Contact email
  -l, --limit <number>       Monthly request limit (default: 1000)
  -r, --rate <number>        Requests per minute (default: 100)
  -p, --plan <plan>          Plan type (free/basic/pro/enterprise)
  -c, --company <company>    Company name (for metadata)
  -h, --help                 Show this help message

Examples:
  # Create basic developer
  node create-developer.js --name "Acme Corp" --email "dev@acme.com"

  # Create pro developer with higher limits
  node create-developer.js -n "Tech Startup" -e "api@tech.com" -l 10000 -r 200 -p pro

  # Create enterprise developer
  node create-developer.js -n "BigCorp" -e "eng@bigcorp.com" -l 999999 -r 500 -p enterprise
  `);
}

async function main() {
  const args = parseArgs();

  // Validate required fields
  if (!args.name) {
    console.error('❌ Error: Developer name is required');
    showHelp();
    process.exit(1);
  }

  console.log('🚀 Creating developer account...\n');
  console.log('Details:');
  console.log(`  Name: ${args.name}`);
  console.log(`  Email: ${args.email || 'N/A'}`);
  console.log(`  Monthly Limit: ${args.monthlyLimit} requests`);
  console.log(`  Rate Limit: ${args.rateLimitPerMinute} requests/minute`);
  if (args.metadata.plan) {
    console.log(`  Plan: ${args.metadata.plan}`);
  }
  console.log('');

  try {
    const developer = await developerService.createDeveloper(args);

    console.log('✅ Developer created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('API CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Developer ID: ${developer.id}`);
    console.log(`API Key:      ${developer.api_key}`);
    console.log(`API Secret:   ${developer.api_secret}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Save these credentials now!');
    console.log('   The API Secret will NOT be shown again.\n');
    console.log('📧 Send these credentials to the developer via a secure channel.');
    console.log('   DO NOT send via email or any unencrypted method.\n');
    console.log('📚 API Documentation: See API_DOCUMENTATION.md\n');

  } catch (error) {
    console.error('❌ Failed to create developer:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
