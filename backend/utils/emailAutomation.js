const EmailHelper = require('./emailHelper');
const User = require('../models/userModel');
const Event = require('../models/eventModel');
const EventRegistration = require('../models/eventRegistrationModel');
const cron = require('node-cron');

class EmailAutomation {
  constructor() {
    this.emailHelper = new EmailHelper();
    this.isInitialized = false;
    this.cronJobs = new Map();
    this.automationRules = new Map();
    this.debugMode = process.env.EMAIL_DEBUG === 'true';
    
    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Setup automation rules
      this.setupAutomationRules();
      
      // Start cron jobs
      this.startCronJobs();
      
      this.isInitialized = true;
      console.log('🤖 Email Automation System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Email Automation:', error);
    }
  }

  // ========== AUTOMATION RULES SETUP ==========
  setupAutomationRules() {
    // User registration workflow
    this.automationRules.set('user.register', {
      delay: 0, // Immediate
      template: 'auth/welcome-enhanced',
      priority: 'high',
      description: 'Send welcome email after user registration'
    });

    // Email verification follow-up
    this.automationRules.set('user.verification.pending', {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      template: 'auth/verification-reminder',
      priority: 'normal',
      description: 'Remind users to verify email after 24h'
    });

    // Event registration confirmation
    this.automationRules.set('event.register', {
      delay: 0, // Immediate
      template: 'events/registration-confirmation',
      priority: 'high',
      description: 'Confirm event registration'
    });

    // Event reminder - 24 hours before
    this.automationRules.set('event.reminder.24h', {
      delay: 0, // Calculated per event
      template: 'events/reminder-24h',
      priority: 'normal',
      description: '24-hour event reminder'
    });

    // Event reminder - 1 hour before
    this.automationRules.set('event.reminder.1h', {
      delay: 0, // Calculated per event
      template: 'events/reminder-1h',
      priority: 'high',
      description: '1-hour event reminder'
    });

    // Event update notification
    this.automationRules.set('event.update', {
      delay: 0, // Immediate
      template: 'events/event-update',
      priority: 'high',
      description: 'Notify participants of event changes'
    });

    // Weekly digest
    this.automationRules.set('digest.weekly', {
      delay: 0, // Scheduled via cron
      template: 'newsletters/weekly-digest',
      priority: 'low',
      description: 'Weekly event digest for users'
    });

    // Inactive user re-engagement
    this.automationRules.set('user.inactive', {
      delay: 30 * 24 * 60 * 60 * 1000, // 30 days
      template: 'engagement/comeback',
      priority: 'low',
      description: 'Re-engage inactive users'
    });
  }

  // ========== CRON JOBS ==========
  startCronJobs() {
    // Daily digest at 8 AM
    this.cronJobs.set('daily-digest', cron.schedule('0 8 * * *', () => {
      this.sendDailyDigest();
    }, { scheduled: false }));

    // Weekly digest every Monday at 9 AM
    this.cronJobs.set('weekly-digest', cron.schedule('0 9 * * 1', () => {
      this.sendWeeklyDigest();
    }, { scheduled: false }));

    // Event reminders check every hour
    this.cronJobs.set('event-reminders', cron.schedule('0 * * * *', () => {
      this.sendEventReminders();
    }, { scheduled: false }));

    // Clean up expired verifications daily at 2 AM
    this.cronJobs.set('cleanup-verifications', cron.schedule('0 2 * * *', () => {
      this.cleanupExpiredVerifications();
    }, { scheduled: false }));

    // Inactive user check weekly on Sundays at 10 AM
    this.cronJobs.set('inactive-users', cron.schedule('0 10 * * 0', () => {
      this.checkInactiveUsers();
    }, { scheduled: false }));

    // Start all cron jobs
    this.cronJobs.forEach((job, name) => {
      job.start();
      if (this.debugMode) {
        console.log(`⏰ Started cron job: ${name}`);
      }
    });

    console.log(`⏰ Started ${this.cronJobs.size} cron jobs for email automation`);
  }

  // ========== EVENT-TRIGGERED EMAILS ==========
  
  // User registration automation
  async onUserRegister(user) {
    try {
      // Send welcome email immediately
      await this.emailHelper.sendEmail({
        to: user.email,
        subject: '🎉 Chào mừng bạn đến với HUTECH Events!',
        html: await this.emailHelper.loadTemplate('auth/welcome-enhanced', {
          fullName: user.fullName,
          email: user.email,
          title: 'Chào mừng bạn'
        }),
        template: 'auth/welcome-enhanced',
        priority: 'high'
      });

      // Schedule verification reminder if not verified
      if (!user.isEmailVerified) {
        setTimeout(() => {
          this.sendVerificationReminder(user);
        }, 24 * 60 * 60 * 1000); // 24 hours
      }

      // Schedule onboarding sequence
      this.scheduleOnboardingSequence(user);

      if (this.debugMode) {
        console.log(`✅ User registration automation triggered for: ${user.email}`);
      }
    } catch (error) {
      console.error('❌ User registration automation failed:', error);
    }
  }

  // Event registration automation
  async onEventRegister(user, event, registrationData = {}) {
    try {
      // Send registration confirmation
      await this.emailHelper.sendEmail({
        to: user.email,
        subject: `✅ Đăng ký thành công: ${event.title}`,
        html: await this.emailHelper.loadTemplate('events/registration-confirmation', {
          fullName: user.fullName,
          eventTitle: event.title,
          eventDate: this.formatEventDate(event),
          eventLocation: this.getEventLocation(event),
          registrationCode: registrationData.registrationCode || 'N/A',
          qrCodeUrl: registrationData.qrCodeUrl || '',
          calendarUrl: this.generateCalendarUrl(event),
          title: 'Xác nhận đăng ký sự kiện'
        }),
        template: 'events/registration-confirmation',
        priority: 'high'
      });

      // Schedule event reminders
      this.scheduleEventReminders(user, event);

      if (this.debugMode) {
        console.log(`✅ Event registration automation triggered: ${user.email} -> ${event.title}`);
      }
    } catch (error) {
      console.error('❌ Event registration automation failed:', error);
    }
  }

  // Event update automation
  async onEventUpdate(event, updateData = {}) {
    try {
      // Get all registered participants
      const registrations = await EventRegistration.find({ 
        eventId: event._id,
        status: { $in: ['confirmed', 'waitlist'] }
      }).populate('userId');

      if (registrations.length === 0) return;

      const participants = registrations.map(reg => reg.userId).filter(Boolean);

      // Send update notifications
      const emailPromises = participants.map(user => 
        this.emailHelper.sendEmail({
          to: user.email,
          subject: `📢 Cập nhật sự kiện: ${event.title}`,
          html: this.emailHelper.loadTemplate('events/event-update', {
            fullName: user.fullName,
            eventTitle: event.title,
            updateSummary: updateData.summary || 'Sự kiện đã có thay đổi',
            changeDetails: updateData.details || 'Vui lòng kiểm tra thông tin mới nhất.',
            eventDate: this.formatEventDate(event),
            eventLocation: this.getEventLocation(event),
            title: 'Cập nhật sự kiện'
          }),
          template: 'events/event-update',
          priority: 'high'
        })
      );

      await Promise.all(emailPromises);

      if (this.debugMode) {
        console.log(`✅ Event update automation sent to ${participants.length} participants`);
      }
    } catch (error) {
      console.error('❌ Event update automation failed:', error);
    }
  }

  // ========== SCHEDULED EMAILS ==========

  // Send daily digest
  async sendDailyDigest() {
    try {
      // Get users who want daily digest
      const users = await User.find({ 
        emailPreferences: { dailyDigest: true },
        isEmailVerified: true 
      });

      // Get today's events
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayEvents = await Event.find({
        'eventDays.date': {
          $gte: today.setHours(0, 0, 0, 0),
          $lt: tomorrow.setHours(0, 0, 0, 0)
        },
        isPublished: true
      }).limit(5);

      if (todayEvents.length === 0 || users.length === 0) return;

      // Send digest to users
      const recipients = users.map(user => ({
        email: user.email,
        fullName: user.fullName,
        userId: user._id
      }));

      await this.emailHelper.sendBulkEmails(recipients, 'newsletters/daily-digest', {
        subject: '📅 Sự kiện hôm nay tại HUTECH',
        date: today.toLocaleDateString('vi-VN'),
        todayEvents: todayEvents.map(event => ({
          title: event.title,
          time: this.formatEventTime(event),
          location: this.getEventLocation(event),
          url: `${process.env.FRONTEND_URL}/events/${event._id}`
        }))
      });

      console.log(`📧 Daily digest sent to ${users.length} users`);
    } catch (error) {
      console.error('❌ Daily digest failed:', error);
    }
  }

  // Send weekly digest
  async sendWeeklyDigest() {
    try {
      // Get users who want weekly digest
      const users = await User.find({ 
        emailPreferences: { weeklyDigest: true },
        isEmailVerified: true 
      });

      if (users.length === 0) return;

      // Get next 7 days events
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingEvents = await Event.find({
        'eventDays.date': {
          $gte: today,
          $lt: nextWeek
        },
        isPublished: true
      }).sort({ 'eventDays.date': 1 }).limit(10);

      // Get trending events (most registrations)
      const trendingEvents = await Event.aggregate([
        { $match: { isPublished: true } },
        { $lookup: {
          from: 'eventregistrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'registrations'
        }},
        { $addFields: { registrationCount: { $size: '$registrations' } } },
        { $sort: { registrationCount: -1 } },
        { $limit: 5 }
      ]);

      const recipients = users.map(user => ({
        email: user.email,
        fullName: user.fullName,
        userId: user._id
      }));

      await this.emailHelper.sendBulkEmails(recipients, 'newsletters/weekly-digest', {
        subject: '📰 Bản tin tuần - HUTECH Events',
        weekRange: `${today.toLocaleDateString('vi-VN')} - ${nextWeek.toLocaleDateString('vi-VN')}`,
        upcomingEvents: upcomingEvents.slice(0, 5),
        trendingEvents: trendingEvents.slice(0, 3),
        totalUsers: users.length
      });

      console.log(`📧 Weekly digest sent to ${users.length} users`);
    } catch (error) {
      console.error('❌ Weekly digest failed:', error);
    }
  }

  // Send event reminders
  async sendEventReminders() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

      // Find events starting in 24 hours
      const events24h = await Event.find({
        'eventDays.date': {
          $gte: in24Hours,
          $lt: new Date(in24Hours.getTime() + 60 * 60 * 1000) // 1 hour window
        },
        isPublished: true
      });

      // Find events starting in 1 hour
      const events1h = await Event.find({
        'eventDays.date': {
          $gte: in1Hour,
          $lt: new Date(in1Hour.getTime() + 30 * 60 * 1000) // 30 minutes window
        },
        isPublished: true
      });

      // Send 24-hour reminders
      for (const event of events24h) {
        await this.sendEventReminderToParticipants(event, '24h');
      }

      // Send 1-hour reminders
      for (const event of events1h) {
        await this.sendEventReminderToParticipants(event, '1h');
      }

      if (this.debugMode) {
        console.log(`⏰ Sent reminders for ${events24h.length + events1h.length} events`);
      }
    } catch (error) {
      console.error('❌ Event reminders failed:', error);
    }
  }

  // ========== HELPER METHODS ==========

  async sendEventReminderToParticipants(event, reminderType) {
    try {
      const registrations = await EventRegistration.find({
        eventId: event._id,
        status: 'confirmed'
      }).populate('userId');

      const participants = registrations.map(reg => reg.userId).filter(Boolean);

      if (participants.length === 0) return;

      const templateName = reminderType === '1h' ? 'events/reminder-1h' : 'events/reminder-24h';
      const subject = reminderType === '1h' 
        ? `⏰ Sắp bắt đầu: ${event.title}` 
        : `📅 Nhắc nhở: ${event.title} - Ngày mai`;

      const recipients = participants.map(user => ({
        email: user.email,
        fullName: user.fullName,
        userId: user._id
      }));

      await this.emailHelper.sendBulkEmails(recipients, templateName, {
        subject,
        eventTitle: event.title,
        eventDate: this.formatEventDate(event),
        eventTime: this.formatEventTime(event),
        eventLocation: this.getEventLocation(event),
        reminderType,
        checkInUrl: `${process.env.FRONTEND_URL}/events/${event._id}/checkin`
      }, { priority: reminderType === '1h' ? 'high' : 'normal' });

    } catch (error) {
      console.error(`❌ Failed to send ${reminderType} reminder for event ${event._id}:`, error);
    }
  }

  async scheduleEventReminders(user, event) {
    // Calculate reminder times
    const eventDate = new Date(event.eventDays[0]?.date || event.startDate);
    const now = new Date();

    // 24-hour reminder
    const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      setTimeout(() => {
        this.sendEventReminderToUser(user, event, '24h');
      }, reminder24h.getTime() - now.getTime());
    }

    // 1-hour reminder
    const reminder1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
    if (reminder1h > now) {
      setTimeout(() => {
        this.sendEventReminderToUser(user, event, '1h');
      }, reminder1h.getTime() - now.getTime());
    }
  }

  async sendEventReminderToUser(user, event, reminderType) {
    try {
      const templateName = reminderType === '1h' ? 'events/reminder-1h' : 'events/reminder-24h';
      const subject = reminderType === '1h' 
        ? `⏰ Sắp bắt đầu: ${event.title}` 
        : `📅 Nhắc nhở: ${event.title}`;

      await this.emailHelper.sendEmail({
        to: user.email,
        subject,
        html: await this.emailHelper.loadTemplate(templateName, {
          fullName: user.fullName,
          eventTitle: event.title,
          eventDate: this.formatEventDate(event),
          eventTime: this.formatEventTime(event),
          eventLocation: this.getEventLocation(event),
          reminderType,
          title: subject
        }),
        template: templateName,
        priority: reminderType === '1h' ? 'high' : 'normal'
      });
    } catch (error) {
      console.error(`❌ Failed to send individual ${reminderType} reminder:`, error);
    }
  }

  async scheduleOnboardingSequence(user) {
    // Day 1: Getting started tips
    setTimeout(() => {
      this.sendOnboardingEmail(user, 'getting-started');
    }, 24 * 60 * 60 * 1000);

    // Day 3: Feature highlights
    setTimeout(() => {
      this.sendOnboardingEmail(user, 'features');
    }, 3 * 24 * 60 * 60 * 1000);

    // Day 7: Community invitation
    setTimeout(() => {
      this.sendOnboardingEmail(user, 'community');
    }, 7 * 24 * 60 * 60 * 1000);
  }

  async sendOnboardingEmail(user, type) {
    // Implementation for onboarding emails
    // This would use specific onboarding templates
  }

  // Cleanup and maintenance
  async cleanupExpiredVerifications() {
    // Clean up expired email verification tokens
    console.log('🧹 Cleaning up expired email verifications');
  }

  async checkInactiveUsers() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveUsers = await User.find({
        lastLoginAt: { $lt: thirtyDaysAgo },
        isEmailVerified: true,
        emailPreferences: { reEngagement: true }
      });

      if (inactiveUsers.length === 0) return;

      const recipients = inactiveUsers.map(user => ({
        email: user.email,
        fullName: user.fullName,
        userId: user._id,
        lastLogin: user.lastLoginAt
      }));

      await this.emailHelper.sendBulkEmails(recipients, 'engagement/comeback', {
        subject: '👋 Chúng tôi nhớ bạn! Quay lại HUTECH Events',
        missedEventsCount: Math.floor(Math.random() * 10) + 5 // Placeholder
      }, { priority: 'low' });

      console.log(`📧 Re-engagement emails sent to ${inactiveUsers.length} inactive users`);
    } catch (error) {
      console.error('❌ Inactive user check failed:', error);
    }
  }

  // Utility methods
  formatEventDate(event) {
    const date = new Date(event.eventDays?.[0]?.date || event.startDate);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatEventTime(event) {
    const date = new Date(event.eventDays?.[0]?.date || event.startDate);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventLocation(event) {
    if (event.location?.physical?.address) {
      return event.location.physical.room 
        ? `${event.location.physical.address} - ${event.location.physical.room}`
        : event.location.physical.address;
    }
    if (event.location?.online?.platform) {
      return `Online: ${event.location.online.platform}`;
    }
    return 'Địa điểm sẽ được thông báo sau';
  }

  generateCalendarUrl(event) {
    // Generate Google Calendar URL
    const startDate = new Date(event.eventDays?.[0]?.date || event.startDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatCalendarDate(startDate)}/${this.formatCalendarDate(endDate)}`,
      details: event.description || '',
      location: this.getEventLocation(event)
    });

    return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`;
  }

  formatCalendarDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  // Control methods
  stopCronJobs() {
    this.cronJobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Stopped cron job: ${name}`);
    });
  }

  getAutomationStatus() {
    return {
      isInitialized: this.isInitialized,
      cronJobsCount: this.cronJobs.size,
      automationRulesCount: this.automationRules.size,
      emailQueueSize: this.emailHelper.emailQueue?.length || 0,
      analytics: this.emailHelper.getEmailAnalytics()
    };
  }
}

module.exports = EmailAutomation;