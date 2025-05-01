const express = require('express');
const { register, login, logout, getMe, googleLogin, facebookLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);

module.exports = router;
