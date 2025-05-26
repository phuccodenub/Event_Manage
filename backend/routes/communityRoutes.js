const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getAllCommunities,
  searchCommunities,
  getCommunityDetails,
  createCommunity,
  requestToJoin,
  handleJoinRequest,
  updateCommunity,
  deleteCommunity
} = require('../controllers/communityController');

const { createCommunityEvent } = require('../controllers/eventController');

const router = express.Router();

// Public routes
router.get('/', getAllCommunities);
router.get('/search', searchCommunities);

// Specific routes trước các routes có params
router.post('/new', protect, createCommunity);
router.put('/requests/:requestId', protect, handleJoinRequest);

// Routes với params
router.get('/:id', getCommunityDetails);
router.put('/:id', protect, updateCommunity);
router.delete('/:id', protect, deleteCommunity);
router.post('/:id/join', protect, requestToJoin);

// Community events
router.post('/:communityId/events', protect, createCommunityEvent);

module.exports = router;