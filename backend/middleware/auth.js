const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  let token;

  // console.log('🔐 Auth middleware - checking authorization...');
  // console.log('Headers:', req.headers.authorization);
  // console.log('Cookies:', req.cookies);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log('📝 Token from Bearer header:', token ? 'Present' : 'Missing');
  } else if (req.cookies.token) {
    token = req.cookies.token;
    // console.log('🍪 Token from cookie:', token ? 'Present' : 'Missing');
  }

  if (!token) {
    // console.log('❌ No token found');
    return next(new ErrorResponse('Không có quyền truy cập', 401));
  }

  try {
    // console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('✅ Token decoded:', decoded);
    
    req.user = await User.findById(decoded.id);
    // console.log('👤 User found:', req.user ? req.user.email : 'Not found');
    
    if (!req.user) {
      // console.log('❌ User not found in database');
      return next(new ErrorResponse('Không có quyền truy cập', 401));
    }
    
    next();
  } catch (err) {
    // console.log('❌ Token verification failed:', err.message);
    return next(new ErrorResponse('Không có quyền truy cập', 401));
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Debug log để kiểm tra role
    console.log('User role:', req.user.role);
    console.log('Allowed roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Không có quyền thực hiện hành động này`,
          403
        )
      );
    }
    next();
  };
};
