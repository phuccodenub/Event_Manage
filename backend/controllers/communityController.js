const Community = require('../models/communityModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('../utils/cloudinary');

// Lấy danh sách tất cả community (Public)
const getAllCommunities = catchAsyncErrors(async (req, res, next) => {
  const communities = await Community.find()
    .populate('leader', 'fullName avatar')
    .populate({
      path: 'pendingRequests.user',
      select: 'fullName avatar'
    })
    .select('name description avatar banner members events isActive pendingRequests');

  res.status(200).json({
    success: true,
    communities
  });
});

// Lấy chi tiết một community
const getCommunityDetails = catchAsyncErrors(async (req, res, next) => {
  console.log('=== GET COMMUNITY DETAILS DEBUG ===');
  console.log('Community ID:', req.params.id);
  console.log('User ID:', req.user?._id || 'No user');
  console.log('Fetch timestamp:', new Date().toISOString());
  
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
    console.log('❌ Community not found');
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  console.log('✓ Community found:', community.name);
  console.log('Members count:', community.members?.length || 0);
  console.log('Pending requests count:', community.pendingRequests?.length || 0);
  
  if (community.pendingRequests?.length > 0) {
    console.log('Pending requests details:');
    community.pendingRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. User: ${req.user._id || req.user}, Status: ${req.status}`);
    });
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
  .populate({
    path: 'pendingRequests.user',
    select: 'fullName avatar'
  })
  .select('name description avatar banner members events isActive pendingRequests');

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
    createdBy: req.user._id,
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
  console.log('=== REQUEST TO JOIN DEBUG ===');
  console.log('Community ID:', req.params.id);
  console.log('User ID:', req.user._id);
  console.log('Timestamp:', new Date().toISOString());
  
  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!isValidObjectId) {
    console.log('❌ Invalid community ID format');
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  const community = await Community.findById(req.params.id);

  if (!community) {
    console.log('❌ Community not found');
    return next(new ErrorHandler('Không tìm thấy cộng đồng', 404));
  }

  console.log('✓ Community found:', community.name);
  console.log('Members count:', community.members?.length || 0);
  console.log('Pending requests count:', community.pendingRequests?.length || 0);

  // Kiểm tra xem đã là thành viên chưa
  const isMember = community.members.some(member => member.user.toString() === req.user._id.toString());
  console.log('Is already member?', isMember);
  
  if (isMember) {
    console.log('❌ User is already a member');
    return next(new ErrorHandler('Bạn đã là thành viên của cộng đồng này', 400));
  }

  // Kiểm tra xem đã gửi yêu cầu chưa
  const existingRequest = community.pendingRequests.find(
    request => request.user.toString() === req.user._id.toString() && 
    request.status === 'pending'
  );

  console.log('Existing pending request?', !!existingRequest);
  if (existingRequest) {
    console.log('❌ User already has pending request:', existingRequest._id);
    console.log('Request details:', {
      user: existingRequest.user,
      status: existingRequest.status,
      date: existingRequest.requestDate
    });
    return next(new ErrorHandler('Bạn đã gửi yêu cầu tham gia trước đó', 400));
  }

  console.log('✓ Proceeding to add join request...');

  // Sử dụng findByIdAndUpdate để tránh validation issues
  const updatedCommunity = await Community.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        pendingRequests: {
          user: req.user._id,
          requestDate: new Date(),
          status: 'pending'
        }
      }
    },
    { new: true, runValidators: false }
  );

  if (!updatedCommunity) {
    console.log('❌ Failed to update community');
    return next(new ErrorHandler('Không thể gửi yêu cầu tham gia', 500));
  }

  console.log('✅ Successfully added join request');
  console.log('New pending requests count:', updatedCommunity.pendingRequests?.length || 0);
  console.log('Response timestamp:', new Date().toISOString());

  res.status(200).json({
    success: true,
    message: 'Đã gửi yêu cầu tham gia thành công'
  });
});

// Hủy yêu cầu tham gia community
const cancelJoinRequest = catchAsyncErrors(async (req, res, next) => {
  // Kiểm tra ID có hợp lệ theo định dạng MongoDB không
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  
  if (!isValidObjectId) {
    return next(new ErrorHandler('ID cộng đồng không hợp lệ', 400));
  }

  // Sử dụng findOneAndUpdate để xóa pending request
  const updatedCommunity = await Community.findOneAndUpdate(
    { 
      _id: req.params.id,
      'pendingRequests.user': req.user._id,
      'pendingRequests.status': 'pending'
    },
    {
      $pull: {
        pendingRequests: {
          user: req.user._id,
          status: 'pending'
        }
      }
    },
    { new: true }
  );

  if (!updatedCommunity) {
    return next(new ErrorHandler('Không tìm thấy yêu cầu tham gia để hủy', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Đã hủy yêu cầu tham gia thành công'
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
  if (!request) {
    return next(new ErrorHandler('Không tìm thấy yêu cầu tham gia', 404));
  }

  // Cập nhật status của request
  const updateQuery = {
    $set: {
      'pendingRequests.$.status': status
    }
  };

  // Nếu approved, thêm user vào members
  if (status === 'approved') {
    updateQuery.$push = {
      members: {
        user: request.user,
        status: 'active',
        joinedAt: new Date()
      }
    };
  }

  const updatedCommunity = await Community.findOneAndUpdate(
    { 'pendingRequests._id': requestId },
    updateQuery,
    { new: true, runValidators: false }
  );

  if (!updatedCommunity) {
    return next(new ErrorHandler('Không thể xử lý yêu cầu', 500));
  }

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
  cancelJoinRequest,
  handleJoinRequest,
  updateCommunity,
  deleteCommunity
};