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

const { createCommunityEvent, getCommunityEvents } = require('../controllers/eventController');

// Middleware để check auth có điều kiện - không bắt buộc
const conditionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || 
                req.cookies?.token;

  if (token) {
    // Nếu có token, sử dụng protect middleware
    return protect(req, res, next);
  } else {
    // Nếu không có token, tiếp tục mà không có user
    req.user = null;
    return next();
  }
};

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

// Community events - sử dụng conditionalAuth để hỗ trợ cả user có và chưa có auth
router.get('/:communityId/events', conditionalAuth, getCommunityEvents);
router.post('/:communityId/events', protect, createCommunityEvent);

module.exports = router;