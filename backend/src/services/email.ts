import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { LegalUpdate } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter based on environment configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    logger.info('Email Service initialized');
  }

  /**
   * Send daily report email with legal updates
   * @param updates - Array of legal updates from the last 24 hours
   * @param recipients - Array of email addresses
   */
  async sendDailyReport(updates: LegalUpdate[], recipients: string[]): Promise<void> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('SMTP credentials not configured, skipping email');
        return;
      }

      if (recipients.length === 0) {
        logger.warn('No recipients configured for daily report');
        return;
      }

      logger.info('Sending daily report email', { 
        updateCount: updates.length, 
        recipientCount: recipients.length 
      });

      const htmlContent = this.generateReportHTML(updates);
      const textContent = this.generateReportText(updates);

      const mailOptions = {
        from: `"Strażnik Prawa Medycznego" <${process.env.SMTP_USER}>`,
        to: recipients.join(', '),
        subject: `Raport dzienny - Zmiany w prawie medycznym (${new Date().toLocaleDateString('pl-PL')})`,
        text: textContent,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Daily report email sent successfully', { messageId: info.messageId });
    } catch (error) {
      logger.error('Error sending daily report email', { error });
      throw error;
    }
  }

  /**
   * Generate HTML content for the report
   */
  private generateReportHTML(updates: LegalUpdate[]): string {
    const today = new Date().toLocaleDateString('pl-PL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raport dzienny - Strażnik Prawa Medycznego</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
    }
    .summary {
      background-color: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .update-card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
      background-color: #fafafa;
    }
    .update-title {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .update-meta {
      color: #7f8c8d;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 5px;
    }
    .badge-high {
      background-color: #e74c3c;
      color: white;
    }
    .badge-medium {
      background-color: #f39c12;
      color: white;
    }
    .badge-low {
      background-color: #95a5a6;
      color: white;
    }
    .badge-scraper {
      background-color: #3498db;
      color: white;
    }
    .badge-eli {
      background-color: #9b59b6;
      color: white;
    }
    .badge-rss {
      background-color: #1abc9c;
      color: white;
    }
    .summary-text {
      margin: 10px 0;
      line-height: 1.8;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📋 Raport dzienny - Zmiany w prawie medycznym</h1>
    
    <div class="summary">
      <strong>Data raportu:</strong> ${today}<br>
      <strong>Liczba zmian:</strong> ${updates.length}
    </div>

    <h2>Podsumowanie</h2>
    <div class="summary-text">
      ${this.generateSummaryStats(updates)}
    </div>
`;

    if (updates.length === 0) {
      html += `
    <div class="update-card">
      <p>Brak nowych zmian prawnych w ciągu ostatnich 24 godzin.</p>
    </div>
`;
    } else {
      // Group by impact level
      const highImpact = updates.filter(u => u.impact === 'high');
      const mediumImpact = updates.filter(u => u.impact === 'medium');
      const lowImpact = updates.filter(u => u.impact === 'low');

      if (highImpact.length > 0) {
        html += `<h2>🔴 Wysoki priorytet (${highImpact.length})</h2>`;
        highImpact.forEach(update => {
          html += this.generateUpdateCard(update);
        });
      }

      if (mediumImpact.length > 0) {
        html += `<h2>🟡 Średni priorytet (${mediumImpact.length})</h2>`;
        mediumImpact.forEach(update => {
          html += this.generateUpdateCard(update);
        });
      }

      if (lowImpact.length > 0) {
        html += `<h2>⚪ Niski priorytet (${lowImpact.length})</h2>`;
        lowImpact.forEach(update => {
          html += this.generateUpdateCard(update);
        });
      }
    }

    html += `
    <div class="footer">
      <p>Ten raport został wygenerowany automatycznie przez system Strażnik Prawa Medycznego.</p>
      <p>Aby zmienić ustawienia powiadomień lub wypisać się z listy, skontaktuj się z administratorem systemu.</p>
    </div>
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Generate plain text content for the report
   */
  private generateReportText(updates: LegalUpdate[]): string {
    const today = new Date().toLocaleDateString('pl-PL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let text = `RAPORT DZIENNY - ZMIANY W PRAWIE MEDYCZNYM\n`;
    text += `Data raportu: ${today}\n`;
    text += `Liczba zmian: ${updates.length}\n`;
    text += `\n${'='.repeat(60)}\n\n`;

    if (updates.length === 0) {
      text += `Brak nowych zmian prawnych w ciągu ostatnich 24 godzin.\n`;
    } else {
      updates.forEach((update, index) => {
        text += `${index + 1}. ${update.title}\n`;
        text += `   ID: ${update.id}\n`;
        text += `   Data: ${update.date}\n`;
        text += `   Źródło: ${update.ingestMethod.toUpperCase()}\n`;
        text += `   Priorytet: ${update.impact.toUpperCase()}\n`;
        text += `   Kategoria: ${update.category}\n`;
        text += `   Status: ${update.legalStatus}\n`;
        if (update.sourceUrl) {
          text += `   Link: ${update.sourceUrl}\n`;
        }
        text += `\n   Streszczenie:\n   ${update.summary}\n`;
        text += `\n   Uzasadnienie:\n   ${update.officialRationale}\n`;
        text += `\n${'-'.repeat(60)}\n\n`;
      });
    }

    text += `\nTen raport został wygenerowany automatycznie przez system Strażnik Prawa Medycznego.\n`;

    return text;
  }

  /**
   * Generate update card HTML
   */
  private generateUpdateCard(update: LegalUpdate): string {
    const impactClass = `badge-${update.impact}`;
    const methodClass = `badge-${update.ingestMethod}`;

    return `
    <div class="update-card">
      <div class="update-title">${update.title}</div>
      <div class="update-meta">
        <span class="badge ${impactClass}">${update.impact.toUpperCase()}</span>
        <span class="badge ${methodClass}">${update.ingestMethod.toUpperCase()}</span>
        <span>${update.date}</span> | 
        <span>${update.category}</span>
      </div>
      <p><strong>Streszczenie:</strong><br>${update.summary}</p>
      <p><strong>Uzasadnienie:</strong><br>${update.officialRationale}</p>
      <p><strong>Status prawny:</strong> ${update.legalStatus}</p>
      ${update.sourceUrl ? `<p><strong>Źródło:</strong> <a href="${update.sourceUrl}">${update.sourceUrl}</a></p>` : ''}
    </div>
`;
  }

  /**
   * Generate summary statistics
   */
  private generateSummaryStats(updates: LegalUpdate[]): string {
    const bySource = {
      scraper: updates.filter(u => u.ingestMethod === 'scraper').length,
      eli: updates.filter(u => u.ingestMethod === 'eli').length,
      rss: updates.filter(u => u.ingestMethod === 'rss').length
    };

    const byImpact = {
      high: updates.filter(u => u.impact === 'high').length,
      medium: updates.filter(u => u.impact === 'medium').length,
      low: updates.filter(u => u.impact === 'low').length
    };

    return `
      <strong>Źródła danych:</strong><br>
      • NFZ (scraper): ${bySource.scraper}<br>
      • ISAP ELI: ${bySource.eli}<br>
      • RSS (ZUS/CEZ): ${bySource.rss}<br><br>
      
      <strong>Priorytet:</strong><br>
      • Wysoki: ${byImpact.high}<br>
      • Średni: ${byImpact.medium}<br>
      • Niski: ${byImpact.low}
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection test failed', { error });
      return false;
    }
  }
}
