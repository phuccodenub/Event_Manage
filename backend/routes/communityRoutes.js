const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getAllCommunities,
  searchCommunities,
  getCommunityDetails,
  createCommunity,
  requestToJoin,
  handleJoinRequest,
  updateCommunity,
  deleteCommunity,
  cancelJoinRequest
} = require('../controllers/communityController');

const { createCommunityEvent, getCommunityEvents } = require('../controllers/eventController');
const {
  getCommunityMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getOnlineMembers
} = require('../controllers/chatController');

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
router.delete('/:id/join', protect, cancelJoinRequest);

// Community events
router.get('/:communityId/events', optionalAuth, getCommunityEvents);
router.post('/:communityId/events', protect, createCommunityEvent);

// Community chat routes
router.get('/:communityId/messages', protect, getCommunityMessages);
router.post('/:communityId/messages', protect, sendMessage);
router.put('/:communityId/messages/:messageId', protect, editMessage);
router.delete('/:communityId/messages/:messageId', protect, deleteMessage);
router.get('/:communityId/online-members', protect, getOnlineMembers);

module.exports = router;