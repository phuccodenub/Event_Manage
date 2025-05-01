const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Không có quyền truy cập', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
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
