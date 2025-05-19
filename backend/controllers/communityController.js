const Community = require('../models/communityModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('../utils/cloudinary');

// Lấy danh sách tất cả community (Public)
const getAllCommunities = catchAsyncErrors(async (req, res, next) => {
  const communities = await Community.find()
    .populate('leader', 'fullName avatar')
    .select('name description avatar members');

  res.status(200).json({
    success: true,
    communities
  });
});

// Lấy chi tiết một community
const getCommunityDetails = catchAsyncErrors(async (req, res, next) => {
  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!isValidObjectId) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  const community = await Community.findById(req.params.id)
    .populate('leader', 'fullName avatar email')
    .populate('deputies', 'fullName avatar')
    .populate({
      path: 'members.user',
      select: 'fullName avatar'
    })
    .populate({
      path: 'pendingRequests.user',
      select: 'fullName avatar'
    });

  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  res.status(200).json({
    success: true,
    community
  });
});

// Tìm kiếm community
const searchCommunities = catchAsyncErrors(async (req, res, next) => {
  const { keyword } = req.query;

  const communities = await Community.find({
    $text: { $search: keyword }
  })
  .populate('leader', 'fullName avatar')
  .select('name description avatar members');

  res.status(200).json({
    success: true,
    communities
  });
});

// Tạo community mới
const createCommunity = catchAsyncErrors(async (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return next(new ErrorHandler('Không có quyền thực hiện thao tác này', 403));
  }

  // Chuẩn bị dữ liệu cho community mới
  const communityData = {
    ...req.body,
    leader: req.user._id,
    members: [{ user: req.user._id }] // Tự động thêm người tạo vào members
  };

  // Tạo community mới với dữ liệu đã chuẩn bị
  const community = await Community.create(communityData);
  
  // Populate các thông tin cần thiết
  const populatedCommunity = await Community.findById(community._id)
    .populate('leader', 'fullName avatar email')
    .populate('deputies', 'fullName avatar')
    .populate({
      path: 'members.user',
      select: 'fullName avatar'
    });

  res.status(201).json({
    success: true,
    community: populatedCommunity
  });
});

// Gửi yêu cầu tham gia community
const requestToJoin = catchAsyncErrors(async (req, res, next) => {
  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!isValidObjectId) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  // Kiểm tra xem đã là thành viên chưa
  if (community.members.some(member => member.user.toString() === req.user._id.toString())) {
    return next(new ErrorHandler('Bạn đã là thành viên của cộng đồng này', 400));
  }

  // Kiểm tra xem đã gửi yêu cầu chưa
  const existingRequest = community.pendingRequests.find(
    request => request.user.toString() === req.user._id.toString() && 
    request.status === 'pending'
  );

  if (existingRequest) {
    return next(new ErrorHandler('Bạn đã gửi yêu cầu tham gia trước đó', 400));
  }

  community.pendingRequests.push({
    user: req.user._id
  });

  await community.save();

  res.status(200).json({
    success: true,
    message: 'Đã gửi yêu cầu tham gia thành công'
  });
});

// Xử lý yêu cầu tham gia (Leader/Deputy only)
const handleJoinRequest = catchAsyncErrors(async (req, res, next) => {
  const { requestId } = req.params;
  const { status } = req.body;

  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(requestId);
  
  if (!isValidObjectId) {
    return next(new ErrorHandler('ID yêu cầu không hợp lệ', 400));
  }

  if (!['approved', 'rejected'].includes(status)) {
    return next(new ErrorHandler('Trạng thái không hợp lệ', 400));
  }

  const community = await Community.findOne({
    'pendingRequests._id': requestId
  });

  if (!community) {
    return next(new ErrorHandler('Không tìm thấy yêu cầu tham gia', 404));
  }

  // Kiểm tra quyền (leader hoặc deputy)
  if (
    community.leader.toString() !== req.user._id.toString() &&
    !community.deputies.includes(req.user._id)
  ) {
    return next(new ErrorHandler('Không có quyền phê duyệt yêu cầu', 403));
  }

  const request = community.pendingRequests.id(requestId);
  request.status = status;

  if (status === 'approved') {
    community.members.push({
      user: request.user
    });
  }

  await community.save();

  res.status(200).json({
    success: true,
    message: `Đã ${status === 'approved' ? 'chấp nhận' : 'từ chối'} yêu cầu tham gia`
  });
});

// Cập nhật thông tin community (Leader/Admin only)
const updateCommunity = catchAsyncErrors(async (req, res, next) => {
  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!isValidObjectId) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  // Kiểm tra quyền
  if (community.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorHandler('Không có quyền thực hiện thao tác này', 403));
  }

  // Xử lý thay đổi avatar và banner
  if (req.body.avatar) {
    // Nếu đã có avatar cũ và có public_id, xóa ảnh cũ trên Cloudinary
    if (community.avatar?.public_id) {
      try {
        await deleteFromCloudinary(community.avatar.public_id);
      } catch (error) {
        console.error('Lỗi khi xóa avatar cũ:', error);
      }
    }
  }

  if (req.body.banner) {
    // Nếu đã có banner cũ và có public_id, xóa ảnh cũ trên Cloudinary
    if (community.banner?.public_id) {
      try {
        await deleteFromCloudinary(community.banner.public_id);
      } catch (error) {
        console.error('Lỗi khi xóa banner cũ:', error);
      }
    }
  }

  const updatedCommunity = await Community.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  )
  .populate('leader', 'fullName avatar email')
  .populate('deputies', 'fullName avatar')
  .populate({
    path: 'members.user',
    select: 'fullName avatar'
  })
  .populate({
    path: 'pendingRequests.user',
    select: 'fullName avatar'
  });

  res.status(200).json({
    success: true,
    community: updatedCommunity
  });
});

// Xóa community (Leader/Admin only)
const deleteCommunity = catchAsyncErrors(async (req, res, next) => {
  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!isValidObjectId) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  // Kiểm tra quyền
  if (community.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorHandler('Không có quyền thực hiện thao tác này', 403));
  }

  await community.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Xóa cộng đồng thành công'
  });
});

module.exports = {
  getAllCommunities,
  searchCommunities,
  getCommunityDetails,
  createCommunity,
  requestToJoin,
  handleJoinRequest,
  updateCommunity,
  deleteCommunity
};