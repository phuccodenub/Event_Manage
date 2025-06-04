const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const PasswordSecurity = require('./passwordSecurity');

class EmailHelper {
  constructor() {
    this.transporter = this.createTransport();
    this.debugMode = process.env.EMAIL_DEBUG === 'true';
    this.templatesPath = path.join(__dirname, '../templates/email');
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  }

  createTransport() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD
      }
    };

    // Fallback to development mode if no email config
    if (!process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
      if (this.debugMode) {
        console.log('No email credentials found, using development mode');
      }
      return null;
    }

    return nodemailer.createTransport(emailConfig);
  }

  async loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      let html = await fs.readFile(templatePath, 'utf8');
      
      // Replace variables
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, variables[key] || '');
      });
      
      // Replace base template variables
      html = html.replace(/{{currentYear}}/g, new Date().getFullYear());
      html = html.replace(/{{frontendUrl}}/g, this.frontendUrl);
      html = html.replace(/{{backendUrl}}/g, this.backendUrl);
      
      return html;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      
      // Return fallback HTML template
      return this.getFallbackTemplate(templateName, variables);
    }
  }

  getFallbackTemplate(templateName, variables = {}) {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HUTECH Event Management</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 HUTECH Event Management</h1>
            <p>Hệ thống quản lý sự kiện Đại học Công nghệ TP.HCM</p>
          </div>
          <div class="content">
            {{content}}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} HUTECH Event Management. All rights reserved.</p>
            <p>📧 Bạn nhận được email này từ hệ thống HUTECH Event Management</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let content = '';
    switch (templateName) {
      case 'email-verification':
        content = `
          <h2>Xác thực tài khoản</h2>
          <p>Xin chào <strong>${variables.fullName || 'bạn'}</strong>,</p>
          <p>Vui lòng click vào liên kết bên dưới để xác thực tài khoản của bạn:</p>
          <a href="${variables.verifyUrl}" class="button">Xác thực tài khoản</a>
          <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
        `;
        break;
      case 'password-reset':
        content = `
          <h2>Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${variables.fullName || 'bạn'}</strong>,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào liên kết bên dưới:</p>
          <a href="${variables.resetUrl}" class="button">Đặt lại mật khẩu</a>
          <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
        `;
        break;
      case 'temp-password':
        content = `
          <h2>Mật khẩu tạm thời</h2>
          <p>Xin chào <strong>${variables.fullName || 'bạn'}</strong>,</p>
          <p>Mật khẩu tạm thời của bạn là: <strong>${variables.tempPassword}</strong></p>
          <p>Vui lòng đăng nhập và đổi mật khẩu ngay lập tức.</p>
          <a href="${variables.loginUrl}" class="button">Đăng nhập</a>
        `;
        break;
      default:
        content = `
          <h2>Thông báo từ HUTECH Event Management</h2>
          <p>Cảm ơn bạn đã sử dụng hệ thống của chúng tôi!</p>
        `;
    }

    return baseTemplate.replace('{{content}}', content);
  }

  async sendEmail(options) {
    try {
      // If no transporter (development mode), just log
      if (!this.transporter) {
        if (this.debugMode) {
          console.log('EMAIL (Development Mode):', {
            to: options.to,
            subject: options.subject,
            template: options.template
          });
        }
        
        // Simulate successful send
        const result = { messageId: 'dev-' + Date.now() };
        await this.logEmail({
          to: options.to,
          subject: options.subject,
          template: options.template,
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date()
        });
        
        return result;
      }

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'HUTECH Event Management'}" <${process.env.FROM_EMAIL || process.env.SMTP_MAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (this.debugMode) {
        console.log('Email sent successfully:', {
          to: options.to,
          subject: options.subject,
          messageId: result.messageId
        });
      }

      // Log successful email
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date()
      });

      return result;
    } catch (error) {
      if (this.debugMode) {
        console.error('Email sending failed:', error);
      }

      // Log failed email
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      });

      throw error;
    }
  }

  // ========== SPECIFIC EMAIL METHODS ==========

  /**
   * Send email verification
   */
  async sendEmailVerification(user, token) {
    const verifyUrl = `${this.frontendUrl}/verify-email/${token}`;
    const html = await this.loadTemplate('email-verification', {
      fullName: user.fullName,
      verifyUrl: verifyUrl,
      email: user.email
    });

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Xác thực tài khoản HUTECH Event Management',
      html,
      template: 'email-verification'
    });
  }

  /**
   * Send password reset (2 options: temp password or reset link)
   */
  async sendPasswordReset(user, token, resetType) {
    let html, subject;
    
    if (resetType === 'temp-password') {
      const tempPassword = PasswordSecurity.generateTempPassword();
      
      // Update user with temp password
      const hashedTempPassword = await PasswordSecurity.hashPassword(tempPassword);
      const User = require('../models/userModel');
      await User.findByIdAndUpdate(user._id, { 
        password: hashedTempPassword,
        mustChangePassword: true,
        loginAttempts: 0,
        lockUntil: undefined
      });
      
      html = await this.loadTemplate('temp-password', {
        fullName: user.fullName,
        tempPassword: tempPassword,
        loginUrl: `${this.frontendUrl}/login`
      });
      subject = '🔑 Mật khẩu tạm thời - HUTECH Event Management';
    } else {
      const resetUrl = `${this.frontendUrl}/reset-password/${token}`;
      html = await this.loadTemplate('password-reset', {
        fullName: user.fullName,
        resetUrl: resetUrl
      });
      subject = '🔐 Đặt lại mật khẩu - HUTECH Event Management';
    }

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      template: resetType === 'temp-password' ? 'temp-password' : 'password-reset'
    });
  }

  /**
   * Send event confirmation
   */
  async sendEventConfirmation(user, event) {
    const html = await this.loadTemplate('event-confirmation', {
      fullName: user.fullName,
      eventName: event.title,
      eventDate: this.formatDate(event.startDate),
      eventTime: this.formatTime(event.startDate),
      eventLocation: this.getEventLocation(event),
      eventUrl: `${this.frontendUrl}/events/${event._id}`,
      qrCode: event.qrCode || ''
    });

    return this.sendEmail({
      to: user.email,
      subject: `🎉 Xác nhận tham gia: ${event.title}`,
      html,
      template: 'event-confirmation'
    });
  }

  /**
   * Send event reminder
   */
  async sendEventReminder(user, event, reminderType = '24h') {
    const timeText = reminderType === '24h' ? '24 giờ' : '1 giờ';
    const html = await this.loadTemplate('event-reminder', {
      fullName: user.fullName,
      eventName: event.title,
      eventDate: this.formatDate(event.startDate),
      eventTime: this.formatTime(event.startDate),
      eventLocation: this.getEventLocation(event),
      timeText: timeText,
      eventUrl: `${this.frontendUrl}/events/${event._id}`
    });

    return this.sendEmail({
      to: user.email,
      subject: `⏰ Nhắc nhở: ${event.title} - ${timeText} nữa`,
      html,
      template: 'event-reminder'
    });
  }

  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(user) {
    const html = await this.loadTemplate('welcome', {
      fullName: user.fullName,
      loginUrl: `${this.frontendUrl}/login`,
      eventsUrl: `${this.frontendUrl}/events`,
      profileUrl: `${this.frontendUrl}/profile`
    });

    return this.sendEmail({
      to: user.email,
      subject: '🎓 Chào mừng bạn đến với HUTECH Event Management!',
      html,
      template: 'welcome'
    });
  }

  /**
   * Send auto notification to multiple users
   */
  async sendAutoNotification(users, type, data) {
    const promises = users.map(user => {
      switch(type) {
        case 'new-event':
          return this.sendNewEventNotification(user, data);
        case 'event-update':
          return this.sendEventUpdateNotification(user, data);
        case 'event-cancelled':
          return this.sendEventCancelledNotification(user, data);
        case 'weekly-digest':
          return this.sendWeeklyDigest(user, data);
        default:
          return Promise.resolve();
      }
    });

    return Promise.allSettled(promises);
  }

  /**
   * Send new event notification
   */
  async sendNewEventNotification(user, event) {
    const html = await this.loadTemplate('new-event', {
      fullName: user.fullName,
      eventName: event.title,
      eventDescription: event.description,
      eventDate: this.formatDate(event.startDate),
      eventLocation: this.getEventLocation(event),
      eventUrl: `${this.frontendUrl}/events/${event._id}`,
      organizerName: event.organizer?.fullName || 'HUTECH'
    });

    return this.sendEmail({
      to: user.email,
      subject: `🆕 Sự kiện mới: ${event.title}`,
      html,
      template: 'new-event'
    });
  }

  /**
   * Send event update notification
   */
  async sendEventUpdateNotification(user, event) {
    const html = await this.loadTemplate('event-update', {
      fullName: user.fullName,
      eventName: event.title,
      eventDate: this.formatDate(event.startDate),
      eventLocation: this.getEventLocation(event),
      eventUrl: `${this.frontendUrl}/events/${event._id}`
    });

    return this.sendEmail({
      to: user.email,
      subject: `📝 Cập nhật sự kiện: ${event.title}`,
      html,
      template: 'event-update'
    });
  }

  /**
   * Send event cancelled notification
   */
  async sendEventCancelledNotification(user, event) {
    const html = await this.loadTemplate('event-cancelled', {
      fullName: user.fullName,
      eventName: event.title,
      eventDate: this.formatDate(event.startDate),
      reason: event.cancelReason || 'Không có lý do cụ thể'
    });

    return this.sendEmail({
      to: user.email,
      subject: `❌ Sự kiện đã bị hủy: ${event.title}`,
      html,
      template: 'event-cancelled'
    });
  }

  /**
   * Send weekly digest
   */
  async sendWeeklyDigest(user, data) {
    const html = await this.loadTemplate('weekly-digest', {
      fullName: user.fullName,
      upcomingEvents: data.upcomingEvents || [],
      newEvents: data.newEvents || [],
      totalEvents: data.totalEvents || 0,
      eventsUrl: `${this.frontendUrl}/events`
    });

    return this.sendEmail({
      to: user.email,
      subject: `📊 Tổng kết tuần - HUTECH Event Management`,
      html,
      template: 'weekly-digest'
    });
  }

  // ========== HELPER METHODS ==========

  async logEmail(emailData) {
    try {
      const EmailLog = require('../models/emailLogModel');
      await EmailLog.create(emailData);
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  formatDate(date) {
    if (!date) return 'Chưa xác định';
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatTime(date) {
    if (!date) return 'Chưa xác định';
    return new Intl.DateTimeFormat('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(date));
  }

  getEventLocation(event) {
    if (!event.location) return 'Chưa xác định';
    
    let location = '';
    if (event.location.physical?.address) {
      location = event.location.physical.address;
      if (event.location.physical.room) {
        location += ` - ${event.location.physical.room}`;
      }
    } else if (event.location.online?.platform) {
      location = `Online - ${event.location.online.platform}`;
    } else {
      location = 'Chưa xác định';
    }
    
    return location;
  }

  /**
   * Test email configuration
   */
  async testEmailConfig() {
    try {
      if (!this.transporter) {
        return { success: true, message: 'Development mode - no real email sent' };
      }

      await this.transporter.verify();
      return { success: true, message: 'Email configuration is working' };
    } catch (error) {
      return { success: false, message: `Email configuration error: ${error.message}` };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail) {
    const html = await this.loadTemplate('test', {
      testTime: new Date().toLocaleString('vi-VN')
    });

    return this.sendEmail({
      to: toEmail,
      subject: '✅ Test Email - HUTECH Event Management',
      html,
      template: 'test'
    });
  }
}

module.exports = new EmailHelper(); 