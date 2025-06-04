const express = require('express');
const { 
  register, 
  verifyEmail, 
  resendVerificationEmail,
  forgotPassword, 
  resetPassword, 
  changePassword,
  updateProfile,
  unlockAccount,
  forcePasswordChange,
  checkPasswordStrength
} = require('../controllers/accountController');
const { protect, authorize, admin } = require('../middleware/auth');
// const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting cho sensitive operations - DISABLED FOR DEBUG
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     success: false,
//     error: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút.'
//   },
//   skipSuccessfulRequests: true,
// });

// const passwordLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 3, // limit each IP to 3 password reset requests per hour
//   message: {
//     success: false,
//     error: 'Quá nhiều lần yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ.'
//   },
// });

// Public routes (không cần auth)
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Utility route
router.post('/check-password-strength', checkPasswordStrength);

// Protected routes (cần đăng nhập)
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

// Admin only routes
router.put('/unlock/:userId', protect, admin, unlockAccount);
router.put('/force-password-change/:userId', protect, admin, forcePasswordChange);

module.exports = router; 