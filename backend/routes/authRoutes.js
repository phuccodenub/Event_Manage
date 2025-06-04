const express = require('express');
const {
  register,
  login,
  googleLogin,
  facebookLogin,
  logout,
  getMe,
  checkEmail,
  checkUsername
} = require('../controllers/authController');

const { protect, authorize, admin } = require('../middleware/auth');
// const {
//   authLimiter,
//   trackLoginAttempt,
//   detectSuspiciousActivity,
//   handleSuccessfulLogin
// } = require('../middleware/securityMiddleware');

const router = express.Router();

// ========== PUBLIC ROUTES ==========

// Registration (basic - for backward compatibility)
router.post('/register', register);

// Login 
router.post('/login', login);

// OAuth routes
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

// Utility routes
router.post('/check-email', checkEmail);
router.post('/check-username', checkUsername);

// ========== PROTECTED ROUTES ==========

// Get current user
router.get('/me', protect, getMe);

// Logout
router.post('/logout', protect, logout);

module.exports = router;
