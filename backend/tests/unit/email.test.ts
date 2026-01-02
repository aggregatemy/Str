import { EmailService } from '../../src/services/email';
import { LegalUpdate } from '../../src/types';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true)
  })
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    // Set required env vars
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'test-password';
    
    service = new EmailService();
  });

  afterEach(() => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  describe('sendDailyReport', () => {
    it('should send email with updates', async () => {
      const updates: LegalUpdate[] = [
        {
          id: 'test-1',
          ingestMethod: 'scraper',
          title: 'Test Document',
          summary: 'Test summary',
          date: '2024-01-15',
          impact: 'high',
          category: 'Zarządzenie',
          legalStatus: 'obowiązujący',
          officialRationale: 'Test rationale',
          sourceUrl: 'https://example.com'
        }
      ];

      const recipients = ['test@example.com'];

      await expect(service.sendDailyReport(updates, recipients)).resolves.not.toThrow();
    });

    it('should handle empty updates', async () => {
      const updates: LegalUpdate[] = [];
      const recipients = ['test@example.com'];

      await expect(service.sendDailyReport(updates, recipients)).resolves.not.toThrow();
    });

    it('should skip sending when no SMTP credentials', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const newService = new EmailService();
      const updates: LegalUpdate[] = [];
      const recipients = ['test@example.com'];

      // Should not throw, just log warning
      await expect(newService.sendDailyReport(updates, recipients)).resolves.not.toThrow();
    });

    it('should skip sending when no recipients', async () => {
      const updates: LegalUpdate[] = [];
      const recipients: string[] = [];

      // Should not throw, just log warning
      await expect(service.sendDailyReport(updates, recipients)).resolves.not.toThrow();
    });
  });

  describe('testConnection', () => {
    it('should verify SMTP connection', async () => {
      const result = await service.testConnection();
      expect(result).toBe(true);
    });
  });
});
