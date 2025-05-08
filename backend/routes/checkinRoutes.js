const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkinUser, getEventCheckins } = require('../controllers/checkinController');

router.post('/', protect, authorize('admin', 'moderator'), checkinUser);
router.get('/event/:eventId', protect, authorize('admin', 'moderator'), getEventCheckins);

module.exports = router;
