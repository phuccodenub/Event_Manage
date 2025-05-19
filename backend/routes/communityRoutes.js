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

module.exports = router;