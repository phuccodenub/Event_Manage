const express = require('express');
const {
  getUsers,
  getMe,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateAvatar,
  deleteAvatar,
  resetUserPassword,
  getUserEvents,
  changePassword,
  updatePrivacySettings
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route: GET /api/v1/users
router.get('/', getUsers);

// User profile routes
router.route('/me')
  .get(protect, getMe)
  .put(protect, updateUser);

// @route: GET /api/v1/users/:id
router.get('/:id', getUserById);

// @route: GET /api/v1/users/:id/events
router.get('/:id/events', protect, getUserEvents);

// @route: POST /api/v1/users
router.post('/', createUser);

// @route: PUT /api/v1/users/:id
router.put('/:id', updateUser);

// @route: DELETE /api/v1/users/:id
router.delete('/:id', deleteUser);

// Avatar routes
router.put('/me/avatar', protect, updateAvatar);
router.delete('/me/avatar', protect, deleteAvatar);

// Password change route
router.put('/me/password', protect, changePassword);

// Privacy settings route
router.put('/me/privacy', protect, updatePrivacySettings);

// @route: POST /api/v1/users/:id/reset-password
router.post('/:id/reset-password', protect, authorize('admin'), resetUserPassword);

module.exports = router;
