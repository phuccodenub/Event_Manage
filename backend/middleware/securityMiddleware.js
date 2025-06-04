const rateLimit = require('express-rate-limit');
const User = require('../models/userModel');
const EmailLog = require('../models/emailLogModel');

// ========== RATE LIMITING CONFIGURATIONS ==========

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for local development
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.'
  },
  skipSuccessfulRequests: true,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// Password reset rate limiting
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Quá nhiều lần yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ.'
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// Email rate limiting
const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2, // limit each IP to 2 email requests per 5 minutes
  message: {
    success: false,
    error: 'Quá nhiều lần gửi email, vui lòng thử lại sau 5 phút.'
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// ========== DEVICE TRACKING MIDDLEWARE ==========

const trackLoginAttempt = async (req, res, next) => {
  try {
    const { username } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // Store login attempt data for later use
    req.loginAttemptData = {
      ip,
      userAgent,
      timestamp: new Date(),
      username: username?.toLowerCase()
    };

    next();
  } catch (error) {
    console.error('Error tracking login attempt:', error);
    next(); // Continue even if tracking fails
  }
};

// ========== SUSPICIOUS ACTIVITY DETECTION ==========

const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return next();

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Find user
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    }).select('loginHistory lastLogin email');

    if (!user) return next();

    // Check for rapid login attempts from different IPs
    const recentAttempts = user.loginHistory?.filter(
      attempt => Date.now() - attempt.timestamp < 10 * 60 * 1000 // 10 minutes
    ) || [];

    const differentIPs = new Set(recentAttempts.map(attempt => attempt.ip));
    
    if (differentIPs.size > 3) {
      // Suspicious: Multiple IPs in short time
      req.suspiciousActivity = {
        type: 'multiple_ips',
        details: `${differentIPs.size} different IPs in 10 minutes`
      };
    }

    // Check for login from new location
    const hasLoggedFromThisIP = user.loginHistory?.some(
      attempt => attempt.ip === ip
    );

    if (!hasLoggedFromThisIP && user.loginHistory?.length > 0) {
      req.newLocation = {
        ip,
        userAgent,
        isNew: true
      };
    }

    next();
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    next(); // Continue even if detection fails
  }
};

// ========== LOGIN SUCCESS MIDDLEWARE ==========

const handleSuccessfulLogin = async (req, res, next) => {
  try {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Only process successful login responses
      if (data.success && data.user && req.loginAttemptData) {
        // Update login history asynchronously
        setImmediate(async () => {
          try {
            const user = await User.findById(data.user.id);
            if (user) {
              // Add to login history
              if (!user.loginHistory) {
                user.loginHistory = [];
              }
              
              user.loginHistory.unshift({
                ip: req.loginAttemptData.ip,
                userAgent: req.loginAttemptData.userAgent,
                timestamp: req.loginAttemptData.timestamp
              });

              // Keep only last 20 login records
              if (user.loginHistory.length > 20) {
                user.loginHistory = user.loginHistory.slice(0, 20);
              }

              user.lastLogin = req.loginAttemptData.timestamp;
              await user.save({ validateBeforeSave: false });

              // Send security alert if suspicious activity detected
              if (req.suspiciousActivity || req.newLocation) {
                // Log suspicious activity (implement email notification later)
                console.log(`🚨 Security Alert for ${user.email}:`, {
                  suspicious: req.suspiciousActivity,
                  newLocation: req.newLocation
                });
              }
            }
          } catch (error) {
            console.error('Error updating login history:', error);
          }
        });
      }
      
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Error in login success handler:', error);
    next();
  }
};

// ========== CSRF PROTECTION ==========

const csrfProtection = (req, res, next) => {
  // Basic CSRF protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'https://hutech-event.vercel.app'
    ];

    // Allow requests without origin/referer in development
    if (process.env.NODE_ENV === 'development' && !origin && !referer) {
      return next();
    }

    // Check origin or referer
    const requestOrigin = origin || (referer ? new URL(referer).origin : null);
    
    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid origin'
      });
    }
  }

  next();
};

// ========== IP FILTERING ==========

const ipFilter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Blacklisted IPs (implement database storage later)
  const blacklistedIPs = process.env.BLACKLISTED_IPS 
    ? process.env.BLACKLISTED_IPS.split(',') 
    : [];

  if (blacklistedIPs.includes(ip)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  next();
};

// ========== SECURITY HEADERS ==========

const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

module.exports = {
  // Rate limiters
  apiLimiter,
  authLimiter,
  passwordLimiter,
  emailLimiter,
  
  // Security middleware
  trackLoginAttempt,
  detectSuspiciousActivity,
  handleSuccessfulLogin,
  csrfProtection,
  ipFilter,
  securityHeaders
}; 