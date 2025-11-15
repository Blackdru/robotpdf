/**
 * Cleanup Script for Anonymous Files
 * 
 * This script removes expired anonymous files from both database and storage.
 * Run this as a cron job every hour or as needed.
 * 
 * Usage:
 *   node src/scripts/cleanup-anonymous-files.js
 * 
 * Cron schedule examples:
 *   - Every hour: 0 * * * *
 *   - Every 6 hours: 0 (star)(slash)6 * * *
 *   - Daily at 2 AM: 0 2 * * *
 */

const { supabaseAdmin } = require('../config/supabase');

async function cleanupExpiredAnonymousFiles() {
  console.log('=== Starting Anonymous Files Cleanup ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Find all expired anonymous files
    const { data: expiredFiles, error: queryError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('is_anonymous', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (queryError) {
      console.error('Error querying expired files:', queryError);
      return;
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      console.log('No expired anonymous files found.');
      return;
    }

    console.log(`Found ${expiredFiles.length} expired anonymous file(s) to clean up.`);

    let successCount = 0;
    let failCount = 0;

    // Delete each expired file
    for (const file of expiredFiles) {
      try {
        console.log(`Processing file: ${file.id} (${file.filename})`);
        
        // Delete from storage
        const { error: storageError } = await supabaseAdmin.storage
          .from('files')
          .remove([file.path]);

        if (storageError) {
          console.error(`Storage deletion error for ${file.id}:`, storageError.message);
          // Continue with database deletion even if storage fails
        } else {
          console.log(`✓ Deleted from storage: ${file.path}`);
        }

        // Delete from database
        const { error: dbError } = await supabaseAdmin
          .from('files')
          .delete()
          .eq('id', file.id);

        if (dbError) {
          console.error(`Database deletion error for ${file.id}:`, dbError.message);
          failCount++;
        } else {
          console.log(`✓ Deleted from database: ${file.id}`);
          successCount++;
        }

      } catch (fileError) {
        console.error(`Error processing file ${file.id}:`, fileError);
        failCount++;
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Total files processed: ${expiredFiles.length}`);
    console.log(`Successfully deleted: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('=== Cleanup Complete ===\n');

  } catch (error) {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Also cleanup files older than 7 days regardless of expiry (safety net)
async function cleanupOldAnonymousFiles() {
  console.log('=== Starting Old Anonymous Files Cleanup (7+ days) ===');
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: oldFiles, error: queryError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('is_anonymous', true)
      .lt('created_at', sevenDaysAgo.toISOString());

    if (queryError) {
      console.error('Error querying old files:', queryError);
      return;
    }

    if (!oldFiles || oldFiles.length === 0) {
      console.log('No old anonymous files found (7+ days).');
      return;
    }

    console.log(`Found ${oldFiles.length} old anonymous file(s) to clean up.`);

    let successCount = 0;

    for (const file of oldFiles) {
      try {
        // Delete from storage
        await supabaseAdmin.storage
          .from('files')
          .remove([file.path]);

        // Delete from database
        const { error: dbError } = await supabaseAdmin
          .from('files')
          .delete()
          .eq('id', file.id);

        if (!dbError) {
          successCount++;
          console.log(`✓ Cleaned up old file: ${file.id}`);
        }
      } catch (error) {
        console.error(`Error cleaning up old file ${file.id}:`, error);
      }
    }

    console.log(`Old files cleanup: ${successCount}/${oldFiles.length} deleted\n`);

  } catch (error) {
    console.error('Error during old files cleanup:', error);
  }
}

// Run both cleanup functions
async function runCleanup() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Anonymous Files Cleanup Service          ║');
  console.log('╚════════════════════════════════════════════╝\n');

  await cleanupExpiredAnonymousFiles();
  await cleanupOldAnonymousFiles();

  console.log('All cleanup tasks completed.');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  runCleanup().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  cleanupExpiredAnonymousFiles,
  cleanupOldAnonymousFiles,
  runCleanup
};
