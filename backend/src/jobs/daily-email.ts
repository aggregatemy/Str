import cron from 'node-cron';
import { StorageService } from '../services/storage';
import { EmailService } from '../services/email';
import { logger } from '../utils/logger';

/**
 * Start the daily email report job
 * Runs every morning at 8:00 AM to send email report with yesterday's changes
 */
export function startDailyEmailJob(): void {
  const cronSchedule = process.env.EMAIL_CRON_SCHEDULE || '0 8 * * *'; // Default: 8:00 AM daily
  const enableEmail = process.env.ENABLE_EMAIL_REPORTS !== 'false';
  
  if (!enableEmail) {
    logger.info('Daily email reports are disabled');
    return;
  }

  const recipients = getEmailRecipients();
  if (recipients.length === 0) {
    logger.warn('No email recipients configured, daily reports disabled');
    return;
  }

  logger.info(`Scheduling daily email report job with cron: ${cronSchedule}`, { recipients });

  cron.schedule(cronSchedule, async () => {
    logger.info('Starting daily email report job');
    
    try {
      await sendDailyReport();
      logger.info('Daily email report job completed successfully');
    } catch (error) {
      logger.error('Daily email report job failed', { error });
    }
  });

  logger.info('Daily email report job scheduled successfully');
}

/**
 * Send daily email report with updates from the last 24 hours
 */
export async function sendDailyReport(): Promise<void> {
  try {
    const storage = new StorageService();
    const emailService = new EmailService();

    // Get updates from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateFrom = yesterday.toISOString().split('T')[0];

    logger.info('Fetching updates for daily report', { dateFrom });

    const updates = await storage.getLegalUpdates({
      range: '7d' // Get last 7 days, we'll filter in memory
    });

    // Filter to only last 24 hours
    const today = new Date();
    const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const recentUpdates = updates.filter(update => {
      const updateDate = new Date(update.date);
      return updateDate >= twentyFourHoursAgo;
    });

    logger.info(`Found ${recentUpdates.length} updates from last 24 hours`);

    // Get recipients
    const recipients = getEmailRecipients();

    // Send email
    await emailService.sendDailyReport(recentUpdates, recipients);

    logger.info('Daily report sent successfully', { 
      updateCount: recentUpdates.length,
      recipientCount: recipients.length 
    });
  } catch (error) {
    logger.error('Error sending daily report', { error });
    throw error;
  }
}

/**
 * Get email recipients from environment variable
 */
function getEmailRecipients(): string[] {
  const recipientsEnv = process.env.EMAIL_RECIPIENTS;
  
  if (!recipientsEnv) {
    return [];
  }

  // Split by comma or semicolon, trim whitespace, filter empty
  return recipientsEnv
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(email => email.length > 0 && email.includes('@'));
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(): Promise<void> {
  try {
    logger.info('Sending test email');
    
    const emailService = new EmailService();
    const recipients = getEmailRecipients();

    if (recipients.length === 0) {
      throw new Error('No email recipients configured');
    }

    // Test connection first
    const connected = await emailService.testConnection();
    if (!connected) {
      throw new Error('SMTP connection failed');
    }

    // Send test report with empty updates
    await emailService.sendDailyReport([], recipients);
    
    logger.info('Test email sent successfully');
  } catch (error) {
    logger.error('Error sending test email', { error });
    throw error;
  }
}
