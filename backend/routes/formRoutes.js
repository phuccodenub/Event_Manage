const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getEventForm,
  updateEventForm,
  submitFormResponse,
  getFormResponses
} = require('../controllers/formController');

router.get('/:eventId', getEventForm);
router.put('/:eventId', protect, updateEventForm);
router.post('/:eventId/submit', protect, submitFormResponse);
router.get('/:eventId/responses', protect, getFormResponses);

module.exports = router;
