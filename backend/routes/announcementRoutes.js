const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  updateAnnouncementStatus
} = require('../controllers/announcementController');

router.route('/')
  .get(getAllAnnouncements)
  .post(protect, authorize('admin'), createAnnouncement);

router.route('/:id')
  .put(protect, authorize('admin'), updateAnnouncement)
  .delete(protect, authorize('admin'), deleteAnnouncement);

router.get('/:id', getAnnouncementById);

// Add new route for status update
router.patch('/:id/status', protect, authorize('admin'), updateAnnouncementStatus);

module.exports = router;
