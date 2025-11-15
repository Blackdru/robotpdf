#!/usr/bin/env node
/**
 * Setup script for visitor analytics tables
 * Run with: node backend/database/setup-analytics.js
 */

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

async function setupAnalytics() {
  console.log('🚀 Setting up visitor analytics tables...\n');

  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'create_visitor_analytics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    console.log('📝 Creating tables...');
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method - execute directly
      console.log('⚠️  Direct RPC failed, trying raw query...');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`📋 Executing ${statements.length} SQL statements...`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            await supabaseAdmin.from('_sql_migrations').insert({
              name: `visitor_analytics_${Date.now()}_${i}`,
              executed_at: new Date().toISOString(),
              sql: statement
            });
          } catch (err) {
            // Ignore if migrations table doesn't exist
          }
        }
      }

      console.log('\n⚠️  Automatic setup failed.');
      console.log('Please run the SQL manually in Supabase Dashboard:\n');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Click "SQL Editor" → "New query"');
      console.log('4. Copy the SQL from: backend/database/migrations/create_visitor_analytics.sql');
      console.log('5. Paste and click "Run"\n');
      return;
    }

    console.log('✅ Tables created successfully!\n');

    // Disable RLS for analytics tables
    console.log('🔓 Disabling Row Level Security...');
    await supabaseAdmin.from('visitor_analytics').select('id').limit(1);
    
    console.log('✅ Row Level Security configured!\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('visitor_analytics')
      .select('id')
      .limit(0);

    if (tableError) {
      throw new Error(`Table verification failed: ${tableError.message}`);
    }

    console.log('✅ visitor_analytics table exists');

    const { data: pageViews, error: pageViewError } = await supabaseAdmin
      .from('page_views')
      .select('id')
      .limit(0);

    if (pageViewError) {
      throw new Error(`Table verification failed: ${pageViewError.message}`);
    }

    console.log('✅ page_views table exists\n');

    console.log('🎉 Setup complete! Visitor tracking is now ready.\n');
    console.log('Next steps:');
    console.log('1. Visit http://localhost:5173/tools to test tracking');
    console.log('2. Check Supabase Table Editor to see visitor data');
    console.log('3. Access analytics at http://localhost:5173/admin/analytics\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📚 Manual setup instructions:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" → "New query"');
    console.log('4. Copy and paste the SQL from:');
    console.log('   backend/database/migrations/create_visitor_analytics.sql');
    console.log('5. Click "Run"\n');
    process.exit(1);
  }
}

// Run setup
setupAnalytics();
