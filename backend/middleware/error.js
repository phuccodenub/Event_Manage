const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log lỗi để phát triển
  console.log(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Không tìm thấy tài nguyên với ID ${err.value}`;
    const value = err.keyValue(field);
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Giá trị đã tồn tại';
    const field = Object.keys(err.keyValue)[0];
    
    if (field === 'email') {
      message = 'Email "${value}" đã được sử dụng';
    } else if (field === 'username') {
      message = 'Tên đăng nhập "${value}" đã được sử dụng';
    } else if (field === 'code') {
      message = 'Mã sản phẩm "${value}" đã tồn tại';
    } else if (field === 'slug') {
      message = 'Slug "${value}" đã tồn tại';
    }
    
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Token không hợp lệ', 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token đã hết hạn', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Lỗi server'
  });
};

module.exports = errorHandler; 