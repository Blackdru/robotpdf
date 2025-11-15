/**
 * Cleanup Scheduler Service
 * 
 * Automatically runs cleanup tasks at scheduled intervals using node-cron
 */

const cron = require('node-cron');
const { cleanupExpiredAnonymousFiles, cleanupOldAnonymousFiles } = require('../scripts/cleanup-anonymous-files');

class CleanupScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled cleanup tasks
   */
  start() {
    console.log('🕐 Starting cleanup scheduler...');

    // Run cleanup every hour
    const hourlyCleanup = cron.schedule('0 * * * *', async () => {
      console.log('\n⏰ Running hourly cleanup task...');
      try {
        await cleanupExpiredAnonymousFiles();
      } catch (error) {
        console.error('Error in hourly cleanup:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.jobs.push({ name: 'hourly-cleanup', job: hourlyCleanup });
    console.log('✓ Hourly cleanup scheduled (runs every hour)');

    // Run old files cleanup daily at 2 AM UTC
    const dailyCleanup = cron.schedule('0 2 * * *', async () => {
      console.log('\n⏰ Running daily old files cleanup...');
      try {
        await cleanupOldAnonymousFiles();
      } catch (error) {
        console.error('Error in daily cleanup:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.jobs.push({ name: 'daily-cleanup', job: dailyCleanup });
    console.log('✓ Daily cleanup scheduled (runs at 2 AM UTC)');

    // Run immediate cleanup on startup
    console.log('\n🚀 Running initial cleanup on startup...');
    this.runImmediateCleanup();

    console.log('\n✅ Cleanup scheduler started successfully\n');
  }

  /**
   * Run cleanup immediately (useful for startup)
   */
  async runImmediateCleanup() {
    try {
      await cleanupExpiredAnonymousFiles();
    } catch (error) {
      console.error('Error in immediate cleanup:', error);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    console.log('Stopping cleanup scheduler...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`✓ Stopped ${name}`);
    });
    this.jobs = [];
    console.log('Cleanup scheduler stopped');
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus() {
    return this.jobs.map(({ name, job }) => ({
      name,
      running: job.running || false
    }));
  }
}

// Create singleton instance
const cleanupScheduler = new CleanupScheduler();

module.exports = cleanupScheduler;
