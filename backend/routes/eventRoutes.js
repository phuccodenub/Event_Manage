const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route: GET /api/v1/events
router.get('/', getAllEvents);

// @route: GET /api/v1/events/:id
router.get('/:id', getEventById);

// @route: POST /api/v1/events
router.post('/', protect, authorize('admin', 'teacher'), createEvent);

// @route: PUT /api/v1/events/:id
router.put('/:id', protect, authorize('admin', 'teacher'), updateEvent);

// @route: DELETE /api/v1/events/:id
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;
