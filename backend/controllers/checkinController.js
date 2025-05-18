const Checkin = require('../models/checkinModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const Department = require('../models/departmentModel');
const ErrorResponse = require('../utils/errorResponse');

const canAccessCheckin = async (user, event) => {
  // System admin has full access
  if (user.role === 'admin') return true;

  // Get department details if exists
  if (event.department) {
    const department = await Department.findById(event.department);
    if (!department) return false;

    return (
      // Department head
      user._id.toString() === department.head?.toString() ||
      // Department admin
      department.administrators.includes(user._id.toString()) ||
      // Department moderator
      department.moderators.includes(user._id.toString())
    );
  }

  return false;
};

exports.checkinUser = async (req, res, next) => {
  try {
    const { eventId, studentId } = req.body;
    const checkinMethod = req.body.method || 'manual';
    const checkinType = req.body.type || 'participant'; // Default to participant check-in

    // Validate check-in type
    if (!['participant', 'collaborator'].includes(checkinType)) {
      return next(new ErrorResponse('Invalid check-in type. Must be either "participant" or "collaborator"', 400));
    }

    const event = await Event.findById(eventId).populate('department');
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'EVENT_NOT_FOUND' 
      });
    }

    // Check access permission
    const hasAccess = await canAccessCheckin(req.user, event);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'PERMISSION_DENIED' 
      });
    }

    // Tìm user nếu có
    const userToCheckin = await User.findOne({ userId: studentId });
    
    // Mảng lưu trữ các check-in đã thực hiện
    const completedCheckins = [];
    
    // Kiểm tra xem người dùng có tồn tại và có cả hai vai trò không
    const isParticipant = userToCheckin && event.participants.some(p => p.toString() === userToCheckin._id.toString());
    const isCollaborator = userToCheckin && event.collaborators.some(
      c => c.user && c.user.toString() === userToCheckin._id.toString() && c.status === 'approved'
    );
    
    // Loại check-in hiện tại
    const typesToCheckin = [checkinType];
    
    // Nếu người dùng có cả hai vai trò và vẫn chưa check-in ở vai trò còn lại,
    // thêm cả vai trò còn lại vào danh sách check-in
    if (userToCheckin && isParticipant && isCollaborator) {
      const otherType = checkinType === 'participant' ? 'collaborator' : 'participant';
      const existingOtherCheckin = await Checkin.findOne({
        event: eventId,
        studentId: studentId,
        type: otherType
      });
      
      if (!existingOtherCheckin) {
        typesToCheckin.push(otherType);
      }
    }
    
    // Thực hiện check-in cho từng loại
    for (const type of typesToCheckin) {
      // Kiểm tra xem đã checkin chưa với loại này
      const existingCheckin = await Checkin.findOne({
        event: eventId,
        studentId: studentId,
        type: type
      });

      if (existingCheckin) {
        if (type === checkinType) {
          return next(new ErrorResponse(`Student ID already checked in as ${type}`, 400));
        }
        continue; // Bỏ qua loại đã check-in
      }
      
      // Tạo check-in record
      const checkin = await Checkin.create({
        event: eventId,
        studentId,
        checkinMethod,
        checkedBy: req.user._id,
        user: userToCheckin ? userToCheckin._id : null,
        wasRegistered: false,
        type: type
      });
      
      // Nếu tìm thấy user, cập nhật thêm thông tin
      if (userToCheckin) {
        if (type === 'participant') {
          // Kiểm tra và cập nhật registration cho participant
          const registration = await Registration.findOne({
            event: eventId,
            user: userToCheckin._id
          });

          if (!registration) {
            await Registration.create({
              event: eventId,
              user: userToCheckin._id,
              status: 'attended'
            });

            // Thêm vào danh sách participants
            await Event.findByIdAndUpdate(eventId, {
              $addToSet: { participants: userToCheckin._id }
            });
          } else {
            await Registration.findByIdAndUpdate(registration._id, {
              status: 'attended'
            });
          }
        } else if (type === 'collaborator') {
          // Đảm bảo người dùng có trong danh sách collaborators với trạng thái approved
          // Tìm xem người dùng đã có trong danh sách chưa
          const existingCollaborator = event.collaborators.find(
            c => c.user && c.user.toString() === userToCheckin._id.toString()
          );
          
          if (existingCollaborator) {
            // Nếu đã có, cập nhật trạng thái thành approved nếu chưa
            if (existingCollaborator.status !== 'approved') {
              await Event.updateOne(
                { 
                  _id: eventId, 
                  'collaborators.user': userToCheckin._id 
                },
                { 
                  $set: { 
                    'collaborators.$.status': 'approved',
                    'collaborators.$.approvedAt': new Date(),
                    'collaborators.$.approvedBy': req.user._id
                  } 
                }
              );
            }
          } else {
            // Nếu chưa có, thêm mới với trạng thái approved
            await Event.findByIdAndUpdate(eventId, {
              $push: { 
                collaborators: {
                  user: userToCheckin._id,
                  status: 'approved',
                  requestedAt: new Date(),
                  approvedAt: new Date(),
                  approvedBy: req.user._id
                } 
              }
            });
          }

          // Đảm bảo event được thêm vào collaboratorEvents của user
          await User.findByIdAndUpdate(userToCheckin._id, {
            $addToSet: { collaboratorEvents: eventId }
          });
        }
      }
      
      // Populate thông tin user và người check-in
      await checkin.populate('user', 'fullName userId email avatar');
      await checkin.populate('checkedBy', 'fullName');
      
      completedCheckins.push(checkin);
    }
    
    if (completedCheckins.length === 0) {
      return next(new ErrorResponse('Không có check-in nào được thực hiện', 400));
    }

    res.status(200).json({
      success: true,
      data: completedCheckins[0], // Trả về check-in đầu tiên để tương thích với mã hiện tại
      message: completedCheckins.length > 1 ? 
        'Đã tự động check-in cho cả vai trò người tham gia và cộng tác viên' : undefined
    });

  } catch (error) {
    next(error);
  }
};

exports.getEventCheckins = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('department');

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'EVENT_NOT_FOUND' 
      });
    }

    // Check access permission
    const hasAccess = await canAccessCheckin(req.user, event);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'PERMISSION_DENIED' 
      });
    }

    // Build query
    const query = { event: req.params.eventId };
    
    // Add type filter if provided
    if (req.query.type && ['participant', 'collaborator'].includes(req.query.type)) {
      query.type = req.query.type;
    }

    const checkins = await Checkin.find(query)
      .populate('user')
      .populate('checkedBy')
      .sort('-checkinTime');

    res.status(200).json({
      success: true,
      data: checkins
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteCheckin = async (req, res, next) => {
  try {
    const { checkinId } = req.params;
    
    // Tìm check-in để kiểm tra quyền hạn
    const checkin = await Checkin.findById(checkinId).populate({
      path: 'event',
      populate: {
        path: 'department'
      }
    });
    
    if (!checkin) {
      return res.status(404).json({
        success: false,
        error: 'CHECKIN_NOT_FOUND'
      });
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await canAccessCheckin(req.user, checkin.event);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'PERMISSION_DENIED'
      });
    }
    
    // Lưu thông tin trước khi xóa để trả về
    const deletedCheckinInfo = {
      id: checkin._id,
      studentId: checkin.studentId,
      type: checkin.type,
      eventId: checkin.event._id
    };
    
    // Xóa check-in
    await Checkin.findByIdAndDelete(checkinId);
    
    // Trả về thông tin đã xóa
    res.status(200).json({
      success: true,
      data: deletedCheckinInfo,
      message: `Đã xóa điểm danh ${checkin.type === 'participant' ? 'người tham gia' : 'cộng tác viên'} có MSSV ${checkin.studentId}`
    });
    
  } catch (error) {
    console.error('Error deleting checkin:', error);
    next(error);
  }
};

// Hàm để xóa nhiều check-in cùng lúc (theo event và studentId)
exports.deleteCheckinsByStudent = async (req, res, next) => {
  try {
    const { eventId, studentId } = req.params;
    
    // Tìm event để kiểm tra quyền hạn
    const event = await Event.findById(eventId).populate('department');
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await canAccessCheckin(req.user, event);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'PERMISSION_DENIED'
      });
    }
    
    // Tìm tất cả check-in của sinh viên trong sự kiện
    const checkins = await Checkin.find({
      event: eventId,
      studentId: studentId
    });
    
    if (checkins.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'CHECKINS_NOT_FOUND',
        message: `Không tìm thấy điểm danh của MSSV ${studentId} trong sự kiện này`
      });
    }
    
    // Lưu thông tin trước khi xóa
    const deletedInfo = checkins.map(checkin => ({
      id: checkin._id,
      type: checkin.type,
      studentId: checkin.studentId
    }));
    
    // Xóa tất cả check-in tìm thấy
    await Checkin.deleteMany({
      event: eventId,
      studentId: studentId
    });
    
    // Trả về thông tin đã xóa
    res.status(200).json({
      success: true,
      data: deletedInfo,
      count: deletedInfo.length,
      message: `Đã xóa ${deletedInfo.length} điểm danh của MSSV ${studentId}`
    });
    
  } catch (error) {
    console.error('Error deleting checkins:', error);
    next(error);
  }
};
