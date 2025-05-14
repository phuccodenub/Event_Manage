const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateAvatar,
  deleteAvatar,
  resetUserPassword,
  getUserEvents
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route: GET /api/v1/users
router.get('/', getUsers);

// @route: GET /api/v1/users/:id
router.get('/:id', protect, getUserById);

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
router.delete('/me/avatar', deleteAvatar);

// @route: POST /api/v1/users/:id/reset-password
router.post('/:id/reset-password', protect, authorize('admin'), resetUserPassword);

module.exports = router;
