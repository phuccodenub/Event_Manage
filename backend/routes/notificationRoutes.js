const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createMassNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect tất cả routes
router.use(protect);

// @route   GET /api/v1/notifications
router.get('/', getNotifications);

// @route   GET /api/v1/notifications/unread
router.get('/unread', getUnreadCount);

// @route   PUT /api/v1/notifications/read-all
router.put('/read-all', markAllAsRead);

// @route   PUT /api/v1/notifications/:id/read
router.put('/:id/read', markAsRead);

// @route   DELETE /api/v1/notifications/:id
router.delete('/:id', deleteNotification);

// @route   POST /api/v1/notifications/mass
router.post('/mass', protect, authorize('admin', 'teacher'), createMassNotification);

module.exports = router;
