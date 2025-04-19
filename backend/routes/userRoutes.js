const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

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

module.exports = router;
