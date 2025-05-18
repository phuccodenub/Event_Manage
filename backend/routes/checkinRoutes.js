const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  checkinUser, 
  getEventCheckins,
  deleteCheckin,
  deleteCheckinsByStudent
} = require('../controllers/checkinController');

router.post('/', protect, checkinUser);
router.get('/event/:eventId', protect, getEventCheckins);
router.delete('/:checkinId', protect, deleteCheckin);
router.delete('/event/:eventId/student/:studentId', protect, deleteCheckinsByStudent);

module.exports = router;
