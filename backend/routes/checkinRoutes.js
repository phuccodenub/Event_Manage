const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkinUser, getEventCheckins } = require('../controllers/checkinController');

router.post('/', protect, checkinUser);
router.get('/event/:eventId', protect, getEventCheckins);

module.exports = router;
