# 📧 HUTECH Events - Enhanced Email System

## 🚀 **Tổng quan**

Hệ thống email nâng cao cho HUTECH Events với **automation**, **analytics**, **queue system** và **modern templates**.

### ✨ **Tính năng chính**

- 🎨 **Modern Email Templates** với HUTECH branding
- 🤖 **Email Automation** với cron jobs
- 📊 **Analytics & Tracking** (open rate, click rate)
- 🔄 **Queue System** với retry mechanism
- 📈 **Admin Dashboard** để quản lý
- 📱 **Responsive Design** cho mobile
- 🌙 **Dark Mode Support**
- ♿ **Accessibility** (WCAG 2.1)

---

## 🏗️ **Architecture**

```
📂 Email System Structure
├── 🎨 Templates/
│   ├── base-modern.html          # Base template với HUTECH branding
│   ├── auth/                     # Authentication emails
│   │   ├── welcome-enhanced.html
│   │   ├── email-verification-enhanced.html
│   │   └── password-reset.html
│   ├── events/                   # Event-related emails
│   │   ├── registration-confirmation.html
│   │   ├── reminder-24h.html
│   │   └── reminder-1h.html
│   └── newsletters/              # Newsletter templates
│       ├── daily-digest.html
│       └── weekly-digest.html
├── 🤖 Automation/
│   ├── EmailAutomation.js        # Main automation engine
│   ├── Cron Jobs                 # Scheduled tasks
│   └── Event Triggers            # Real-time automation
├── 📊 Analytics/
│   ├── EmailLog Model            # Enhanced tracking
│   ├── Open/Click Tracking       # Real-time analytics
│   └── Dashboard Metrics         # Admin insights
└── 🎛️ Admin/
    ├── Email Dashboard           # Overview & analytics
    ├── Template Management       # Preview & validate
    ├── Queue Management          # Monitor & control
    └── Bulk Operations           # Mass email sending
```

---

## 🛠️ **Setup & Configuration**

### 1. **Environment Variables**

Thêm vào `.env`:

```bash
# Email Configuration (existing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SERVICE=gmail
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_NAME=HUTECH Event Management
FROM_EMAIL=your-email@gmail.com

# NEW: Enhanced Email System
EMAIL_QUEUE_ENABLED=true
EMAIL_RATE_LIMIT=100
EMAIL_ANALYTICS_ENABLED=true
EMAIL_TEMPLATE_CACHE=true
EMAIL_DEBUG=true
EMAIL_BATCH_SIZE=50
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=30000

# Automation Configuration
AUTOMATION_ENABLED=true
CRON_DAILY_DIGEST=0 8 * * *
CRON_WEEKLY_DIGEST=0 9 * * 1
CRON_EVENT_REMINDERS=0 * * * *
CRON_CLEANUP=0 2 * * *

# Feature Flags
FEATURE_EMAIL_TRACKING=true
FEATURE_CLICK_TRACKING=true
FEATURE_UNSUBSCRIBE=true
FEATURE_EMAIL_TEMPLATES=true
```

### 2. **Dependencies**

```bash
npm install node-cron mongoose-paginate-v2
```

### 3. **Database Setup**

EmailLog model sẽ tự động tạo indexes khi khởi động.

---

## 📧 **Template System**

### **Base Modern Template**

Template chính với HUTECH branding:

```html
<!-- backend/templates/email/base-modern.html -->
- Responsive design
- HUTECH orange color scheme (#f97316)
- Dark mode support
- Accessibility features
- Email tracking pixel
- Social links & footer
```

### **Template Categories**

#### 🔐 **Auth Templates**
- `auth/welcome-enhanced.html` - Welcome email với onboarding
- `auth/email-verification-enhanced.html` - Email verification với security features
- `auth/password-reset.html` - Password reset với security tips

#### 🎯 **Event Templates**
- `events/registration-confirmation.html` - Event registration confirmation
- `events/reminder-24h.html` - 24-hour reminder
- `events/reminder-1h.html` - 1-hour reminder
- `events/event-update.html` - Event changes notification

#### 📰 **Newsletter Templates**
- `newsletters/daily-digest.html` - Daily events digest
- `newsletters/weekly-digest.html` - Weekly summary
- `newsletters/monthly-report.html` - Monthly statistics

### **Template Variables**

Tất cả templates hỗ trợ các variables:

```javascript
{
  // User info
  fullName: "Nguyễn Văn A",
  email: "user@example.com",
  
  // Event info
  eventTitle: "Workshop AI",
  eventDate: "Thứ Hai, 25 tháng 12, 2023",
  eventTime: "09:00",
  eventLocation: "Phòng A101, HUTECH",
  
  // System variables
  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,
  currentYear: new Date().getFullYear(),
  trackingId: "track_xxx",
  sentAt: "2023-12-25 09:00:00"
}
```

---

## 🤖 **Email Automation**

### **Event-Triggered Emails**

#### User Registration Flow
```javascript
// Trigger: User registers
1. ✅ Welcome email (immediate)
2. ⏰ Verification reminder (24h later if not verified)
3. 📚 Getting started tips (Day 1)
4. 🌟 Feature highlights (Day 3)
5. 👥 Community invitation (Day 7)
```

#### Event Registration Flow
```javascript
// Trigger: User registers for event
1. ✅ Registration confirmation (immediate)
2. 📅 24-hour reminder
3. ⏰ 1-hour reminder
4. 🎯 Post-event follow-up
```

### **Scheduled Emails**

#### Daily Jobs
- **8:00 AM** - Daily digest for subscribed users
- **2:00 AM** - Cleanup expired verifications

#### Weekly Jobs
- **Monday 9:00 AM** - Weekly digest
- **Sunday 10:00 AM** - Inactive user re-engagement

#### Hourly Jobs
- **Every hour** - Event reminders check

### **Automation Rules**

```javascript
// backend/utils/emailAutomation.js
const automationRules = {
  'user.register': {
    template: 'auth/welcome-enhanced',
    priority: 'high',
    delay: 0
  },
  'event.register': {
    template: 'events/registration-confirmation',
    priority: 'high',
    delay: 0
  },
  'event.reminder.24h': {
    template: 'events/reminder-24h',
    priority: 'normal',
    delay: 'calculated'
  }
};
```

---

## 📊 **Analytics & Tracking**

### **Email Metrics**

- **Delivery Rate** - % emails successfully delivered
- **Open Rate** - % emails opened by recipients
- **Click Rate** - % links clicked in emails
- **Bounce Rate** - % emails bounced
- **Unsubscribe Rate** - % users unsubscribed

### **Tracking Implementation**

#### Open Tracking
```html
<!-- Automatically added to all emails -->
<img src="{{backendUrl}}/api/v1/admin/emails/track/{{trackingId}}" 
     width="1" height="1" style="display:none;" />
```

#### Click Tracking
```html
<!-- Links automatically wrapped -->
<a href="{{backendUrl}}/api/v1/admin/emails/click/{{trackingId}}/link1?redirect={{originalUrl}}">
  Click Here
</a>
```

### **Analytics Dashboard**

Access via: `/admin/emails/dashboard`

**Metrics Available:**
- Real-time email statistics
- Template performance
- User engagement trends
- Failure analysis
- Queue status
- Automation performance

---

## 🎛️ **Admin Management**

### **API Endpoints**

#### Dashboard & Analytics
```javascript
GET /api/v1/admin/emails/dashboard?period=30
GET /api/v1/admin/emails/analytics?template=welcome&period=7
GET /api/v1/admin/emails/statistics
```

#### Email Logs
```javascript
GET /api/v1/admin/emails/logs?page=1&limit=50&status=sent
GET /api/v1/admin/emails/logs/:id
```

#### Template Management
```javascript
GET /api/v1/admin/emails/templates
GET /api/v1/admin/emails/templates/:name/validate
POST /api/v1/admin/emails/templates/:name/preview
```

#### Bulk Operations
```javascript
POST /api/v1/admin/emails/bulk
POST /api/v1/admin/emails/test
```

#### Queue Management
```javascript
GET /api/v1/admin/emails/queue
POST /api/v1/admin/emails/queue/process
DELETE /api/v1/admin/emails/queue
```

#### Automation
```javascript
GET /api/v1/admin/emails/automation
POST /api/v1/admin/emails/automation/trigger
```

### **Bulk Email Example**

```javascript
POST /api/v1/admin/emails/bulk
{
  "templateName": "newsletters/weekly-digest",
  "subject": "🗞️ Bản tin tuần HUTECH Events",
  "recipients": [
    { "email": "user1@example.com", "fullName": "User 1" },
    { "email": "user2@example.com", "fullName": "User 2" }
  ],
  "templateData": {
    "weekRange": "18/12 - 24/12/2023",
    "upcomingEvents": [...]
  },
  "priority": "normal",
  "batchSize": 50
}
```

---

## 🔧 **Advanced Features**

### **Queue System**

#### Priority Levels
- **High** - Auth emails, security alerts (immediate)
- **Normal** - Event confirmations, reminders
- **Low** - Newsletters, marketing emails

#### Retry Mechanism
- **Max attempts**: 3
- **Backoff**: Exponential (30s, 60s, 120s)
- **Auto-cleanup**: Failed emails after max attempts

### **Template Validation**

```javascript
// Validate template before sending
const validation = await emailHelper.validateTemplate('auth/welcome-enhanced');

// Returns:
{
  templateName: 'auth/welcome-enhanced',
  isValid: true,
  checks: {
    hasContent: true,
    hasTitle: true,
    hasUnsubscribe: true,
    hasTracking: true,
    isValidHtml: true
  },
  size: 15420
}
```

### **Performance Optimization**

- **Template Caching** - Precompiled templates in memory
- **Batch Processing** - Configurable batch sizes
- **Rate Limiting** - Prevent spam/abuse
- **Connection Pooling** - SMTP connection reuse

---

## 🧪 **Testing**

### **Test Email**

```javascript
POST /api/v1/admin/emails/test
{
  "to": "test@example.com",
  "templateName": "auth/welcome-enhanced",
  "subject": "Test Email",
  "templateData": {
    "fullName": "Test User"
  }
}
```

### **Template Preview**

```javascript
POST /api/v1/admin/emails/templates/auth/welcome-enhanced/preview
{
  "variables": {
    "fullName": "John Doe",
    "eventTitle": "Sample Event"
  }
}
```

---

## 🚨 **Monitoring & Alerts**

### **Health Checks**

- Queue size monitoring
- Failed email alerts
- SMTP connection status
- Template validation errors
- Automation job failures

### **Logging**

```javascript
// Comprehensive email logging
{
  to: "user@example.com",
  subject: "Welcome to HUTECH Events",
  template: "auth/welcome-enhanced",
  status: "sent",
  deliveryTime: 1250,
  openCount: 1,
  clickCount: 3,
  analytics: {
    openedAt: "2023-12-25T10:15:00Z",
    firstClickAt: "2023-12-25T10:20:00Z"
  }
}
```

### **Error Handling**

- **Graceful Fallbacks** - Use simple templates if modern fails
- **Retry Logic** - Automatic retry for transient failures
- **Circuit Breaker** - Stop sending if too many failures
- **Dead Letter Queue** - Store permanently failed emails

---

## 🎯 **Best Practices**

### **Email Design**
- ✅ Mobile-first responsive design
- ✅ Accessibility (alt text, semantic HTML)
- ✅ Dark mode support
- ✅ Consistent HUTECH branding
- ✅ Clear call-to-action buttons

### **Performance**
- ✅ Optimize images and content
- ✅ Use template caching
- ✅ Batch email processing
- ✅ Monitor queue sizes

### **Deliverability**
- ✅ Proper SPF/DKIM/DMARC setup
- ✅ Unsubscribe links in all emails
- ✅ Avoid spam trigger words
- ✅ Regular bounce list cleanup

### **Privacy & Security**
- ✅ Encrypt sensitive data
- ✅ Secure tracking tokens
- ✅ GDPR compliance features
- ✅ Email preference management

---

## 🔮 **Future Enhancements**

### **Phase 1** (Completed ✅)
- Modern template system
- Enhanced EmailHelper
- Email automation
- Admin dashboard

### **Phase 2** (Roadmap 🗓️)
- A/B testing for templates
- Advanced segmentation
- Email builder UI
- Integration with external services

### **Phase 3** (Future 🚀)
- Machine learning for send time optimization
- Advanced personalization
- Multi-language templates
- Real-time collaboration

---

## 📞 **Support**

Để hỗ trợ và troubleshooting:

1. **Check logs**: Console output với emoji logging
2. **Dashboard**: `/admin/emails/dashboard` 
3. **Queue status**: Monitor email queue
4. **Analytics**: Review delivery/open rates
5. **Template validation**: Test templates before sending

**Common Issues:**
- SMTP connection issues → Check .env config
- Templates not loading → Verify file paths
- Low open rates → Check spam folders
- Queue backing up → Increase processing rate

---

**🎓 HUTECH Events Enhanced Email System v2.0**  
*Built with ❤️ for better communication* 