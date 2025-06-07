const ChatMessage = require('../models/chatMessageModel');
const Community = require('../models/communityModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const mongoose = require('mongoose');

// Get messages for a community
const getCommunityMessages = catchAsyncErrors(async (req, res, next) => {
  const { communityId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  // Check if community exists
  const community = await Community.findById(communityId);
  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  // Check if user is member of community
  const userId = req.user._id;
  const isMember = community.members.some(member => 
    member.user.toString() === userId.toString()
  );
  
  const isLeader = community.leader && community.leader.toString() === userId.toString();
  const isDeputy = community.deputies && community.deputies.includes(userId);

  if (!isMember && !isLeader && !isDeputy) {
    return next(new ErrorHandler('Bạn cần là thành viên của cộng đồng để xem tin nhắn', 403));
  }

  // Get messages with pagination
  const result = await ChatMessage.getCommunityMessages(
    communityId, 
    parseInt(page), 
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    ...result
  });
});

// Send a new message
const sendMessage = catchAsyncErrors(async (req, res, next) => {
  const { communityId } = req.params;
  const { content, type = 'text' } = req.body;

  // Validate input
  if (!content || !content.trim()) {
    return next(new ErrorHandler('Nội dung tin nhắn không được để trống', 400));
  }

  if (content.length > 2000) {
    return next(new ErrorHandler('Tin nhắn không được quá 2000 ký tự', 400));
  }

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  // Check if community exists
  const community = await Community.findById(communityId);
  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  // Check if user is member of community
  const userId = req.user._id;
  const isMember = community.members.some(member => 
    member.user.toString() === userId.toString()
  );
  
  const isLeader = community.leader && community.leader.toString() === userId.toString();
  const isDeputy = community.deputies && community.deputies.includes(userId);

  if (!isMember && !isLeader && !isDeputy) {
    return next(new ErrorHandler('Bạn cần là thành viên của cộng đồng để gửi tin nhắn', 403));
  }

  // Create message
  const message = await ChatMessage.create({
    communityId,
    sender: userId,
    content: content.trim(),
    type
  });

  // Populate sender info
  await message.populate('sender', 'fullName avatar');

  // Emit to socket for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to(`community_${communityId}`).emit('community:new-message', {
      _id: message._id,
      communityId: message.communityId,
      sender: {
        _id: message.sender._id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar
      },
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      edited: message.edited
    });
  }

  res.status(201).json({
    success: true,
    message: {
      _id: message._id,
      communityId: message.communityId,
      sender: {
        _id: message.sender._id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar
      },
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      edited: message.edited
    }
  });
});

// Edit a message
const editMessage = catchAsyncErrors(async (req, res, next) => {
  const { communityId, messageId } = req.params;
  const { content } = req.body;

  // Validate input
  if (!content || !content.trim()) {
    return next(new ErrorHandler('Nội dung tin nhắn không được để trống', 400));
  }

  if (content.length > 2000) {
    return next(new ErrorHandler('Tin nhắn không được quá 2000 ký tự', 400));
  }

  // Find message
  const message = await ChatMessage.findOne({
    _id: messageId,
    communityId,
    sender: req.user._id
  });

  if (!message) {
    return next(new ErrorHandler('Không tìm thấy tin nhắn hoặc bạn không có quyền chỉnh sửa', 404));
  }

  // Check if message is too old to edit (15 minutes)
  const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
  if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
    return next(new ErrorHandler('Không thể chỉnh sửa tin nhắn sau 15 phút', 400));
  }

  // Edit message
  await message.editContent(content.trim());

  // Emit to socket for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to(`community_${communityId}`).emit('community:message-updated', {
      _id: message._id,
      communityId: message.communityId,
      sender: {
        _id: message.sender._id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar
      },
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      edited: message.edited,
      editedAt: message.editedAt
    });
  }

  res.status(200).json({
    success: true,
    message: {
      _id: message._id,
      communityId: message.communityId,
      sender: {
        _id: message.sender._id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar
      },
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      edited: message.edited,
      editedAt: message.editedAt
    }
  });
});

// Delete a message
const deleteMessage = catchAsyncErrors(async (req, res, next) => {
  const { communityId, messageId } = req.params;

  // Find message
  const message = await ChatMessage.findOne({
    _id: messageId,
    communityId
  });

  if (!message) {
    return next(new ErrorHandler('Không tìm thấy tin nhắn', 404));
  }

  // Check permissions - user can delete own messages or admin/leader can delete any
  const userId = req.user._id;
  const isOwner = message.sender._id.toString() === userId.toString();
  
  // Check if user is leader or deputy
  const community = await Community.findById(communityId);
  const isLeader = community.leader && community.leader.toString() === userId.toString();
  const isDeputy = community.deputies && community.deputies.includes(userId);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isLeader && !isDeputy && !isAdmin) {
    return next(new ErrorHandler('Bạn không có quyền xóa tin nhắn này', 403));
  }

  // Soft delete message
  await message.softDelete();

  // Emit to socket for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to(`community_${communityId}`).emit('community:message-deleted', {
      _id: messageId,
      communityId
    });
  }

  res.status(200).json({
    success: true,
    message: 'Đã xóa tin nhắn'
  });
});

// Get online members in community chat
const getOnlineMembers = catchAsyncErrors(async (req, res, next) => {
  const { communityId } = req.params;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  // Check if community exists
  const community = await Community.findById(communityId);
  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  // Get online members from socket rooms (this would be implemented with socket.io)
  // For now, return empty array
  const onlineMembers = [];

  res.status(200).json({
    success: true,
    onlineMembers
  });
});

module.exports = {
  getCommunityMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getOnlineMembers
}; 