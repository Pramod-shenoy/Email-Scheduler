import nodemailer from 'nodemailer';
import { EmailSendData } from '../types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.ETHEREAL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  async sendEmail(data: EmailSendData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Email Scheduler" <${process.env.ETHEREAL_USER}>`,
        to: data.email,
        subject: data.subject,
        html: data.body,
      });

      console.log(`📧 Email sent to ${data.email}:`, nodemailer.getTestMessageUrl(info));

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(`❌ Failed to send email to ${data.email}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();