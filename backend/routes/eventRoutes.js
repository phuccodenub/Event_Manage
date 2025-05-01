const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventParticipants
} = require('../controllers/eventController');
const Event = require('../models/eventModel'); // Assuming Event model is imported

// Participants routes (đặt trước các routes dùng :id)
router.get('/:id/participants', protect, getEventParticipants);

router.route('/')
  .get(getAllEvents)
// Event routes
router.route('/')
  .get(async (req, res) => {
    try {
      await Event.updateEventStatus(); // Update status before returning events
      const events = await Event.find();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  })
  .post(protect, authorize('admin', 'teacher'), createEvent);
router.route('/:id')
  .get(getEventById)
  .put(protect, authorize('admin', 'teacher'), updateEvent)
  .delete(protect, authorize('admin'), deleteEvent);

// Join/Leave routes
router.post('/:id/join', protect, joinEvent);
router.post('/:id/leave', protect, leaveEvent);

// Add new route to manually trigger status update
router.post('/update-statuses', protect, async (req, res) => {
  try {
    await Event.updateEventStatus();
    res.json({ success: true, message: 'Event statuses updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event statuses' });
  }
});

module.exports = router;
