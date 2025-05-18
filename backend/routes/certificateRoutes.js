const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  generateCertificate, 
  verifyCertificateEligibility,
  getUserEligibleCertificates
} = require('../controllers/certificateController');

// Get all eligible certificates for a user
router.get('/user/:userId/eligible', getUserEligibleCertificates);

// Kiểm tra điều kiện nhận chứng nhận - Không cần bảo vệ vì chỉ là kiểm tra
router.get('/verify/:eventId/:userId/:type', verifyCertificateEligibility);
// Fallback route for backward compatibility
router.get('/verify/:eventId/:userId', verifyCertificateEligibility);

// Tạo chứng nhận - Vẫn cần bảo vệ vì đây là thao tác tạo tài nguyên
router.get('/:eventId/:userId/:type', protect, generateCertificate);
// Fallback route for backward compatibility
router.get('/:eventId/:userId', protect, generateCertificate);

module.exports = router; 