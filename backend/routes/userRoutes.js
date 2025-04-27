const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateAvatar,
  deleteAvatar
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route: GET /api/v1/users
router.get('/', getUsers);

// @route: GET /api/v1/users/:id
router.get('/:id', getUserById);

// @route: POST /api/v1/users
router.post('/', createUser);

// @route: PUT /api/v1/users/:id
router.put('/:id', updateUser);

// @route: DELETE /api/v1/users/:id
router.delete('/:id', deleteUser);

// Avatar routes
router.put('/me/avatar', protect, updateAvatar);
router.delete('/me/avatar', deleteAvatar);

module.exports = router;
