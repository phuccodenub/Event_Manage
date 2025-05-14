const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  generateCertificate, 
  verifyCertificateEligibility 
} = require('../controllers/certificateController');

// Kiểm tra điều kiện nhận chứng nhận
router.get('/verify/:eventId/:userId', protect, verifyCertificateEligibility);

// Tạo chứng nhận
router.get('/:eventId/:userId', protect, generateCertificate);

module.exports = router; 