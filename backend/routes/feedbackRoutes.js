const express = require('express');
const {
  createFeedback,
  getEventFeedback,
  checkFeedbackEligibility,
  sendFeedbackNotifications,
  getPendingFeedbackEvents
} = require('../controllers/feedbackController');

const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Route to check if user can submit feedback
router.get('/check', protect, checkFeedbackEligibility);

// Route to send feedback notifications
router.post('/notify', protect, sendFeedbackNotifications);

// Routes for creating and getting feedback
router.post('/', protect, createFeedback);
router.get('/', getEventFeedback);

module.exports = router; 