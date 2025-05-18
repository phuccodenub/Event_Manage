const Event = require('../models/eventModel');
const ErrorResponse = require('../utils/errorResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const NotificationService = require('../utils/notificationService');
const Registration = require('../models/registrationModel'); // Import Registration model
const mongoose = require('mongoose'); // Import mongoose for transactions
const User = require('../models/userModel'); // Import User model
const RegistrationForm = require('../models/registrationFormModel'); // Import RegistrationForm model

// @desc: Get all events
// @route: GET /api/v1/events
// @access: Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('organizer')  // Lấy tất cả thông tin của organizer
      .populate('department')  // Lấy tất cả thông tin của department
      .populate('participants')  // Thêm populate cho participants
      .populate('collaborators')  // Thêm populate cho collaborators
      .populate('speakers');  // Thêm populate cho speakers
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching events', 500));
  }
};

// @desc: Get single event by ID
// @route: GET /api/v1/events/:id
// @access: Public
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer')
      .populate('department')
      .populate('participants')  // Make sure to populate participants
      .lean();  // Convert to plain object

    if (!event) {
      return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
    }

    // Ensure participants array contains string IDs
    event.participants = event.participants.map(p => p._id.toString());

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Create event with image upload
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = { ...req.body };
    eventData.creator = req.user.id;

    // Parse location JSON if it's a string
    if (typeof eventData.location === 'string') {
      eventData.location = JSON.parse(eventData.location);
    }

    // Handle registration form if needed
    eventData.needsRegistrationForm = req.body.needsRegistrationForm === 'true';
    eventData.needsVolunteers = req.body.needsVolunteers === 'true';
    eventData.maxVolunteers = parseInt(req.body.maxVolunteers) || 0;

    // Handle images array from form data
    const images = [];
    // Check if we have image data in the request
    if (req.body['images[0][public_id]']) {
      let index = 0;
      while (req.body[`images[${index}][public_id]`]) {
        images.push({
          public_id: req.body[`images[${index}][public_id]`],
          url: req.body[`images[${index}][url]`]
        });
        index++;
      }
      eventData.images = images;
    }

    // Create event first
    const event = await Event.create(eventData);

    // If registration form is needed, create it
    if (eventData.needsRegistrationForm) {
      try {
        const formFields = req.body.formFields ? JSON.parse(req.body.formFields) : [];
        const registrationForm = await RegistrationForm.create({
          event: event._id,
          fields: formFields.length > 0 ? formFields : [
            // Default fields if none provided
            {
              fieldId: 'fullName',
              label: 'Họ và tên',
              type: 'text',
              required: true,
              placeholder: 'Nhập họ và tên'
            },
            {
              fieldId: 'studentId',
              label: 'MSSV',
              type: 'text',
              required: true,
              placeholder: 'Nhập mã số sinh viên'
            },
            {
              fieldId: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              placeholder: 'Nhập email'
            }
          ],
          createdBy: req.user.id
        });

        // Update event with form reference
        event.registrationForm = registrationForm._id;
        await event.save();
      } catch (formError) {
        console.error('Error creating registration form:', formError);
      }
    }

    await event.populate('creator');
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Event creation error:', error);
    next(new ErrorResponse(error.message, 500));
  }
};

// @desc: Update event with authorization check
exports.updateEvent = async (req, res, next) => {
  try {
    const eventData = { ...req.body };
    const oldEvent = await Event.findById(req.params.id);

    // Handle arrays properly
    const arrayFields = ['participants', 'collaborators', 'speakers', 'tags', 'likes', 'comments', 'shares'];
    arrayFields.forEach(field => {
      if (field in eventData) {
        try {
          // Parse if string, otherwise use as is
          eventData[field] = typeof eventData[field] === 'string' 
            ? JSON.parse(eventData[field])
            : eventData[field];
            
          // Ensure empty arrays are handled properly
          if (!Array.isArray(eventData[field])) {
            eventData[field] = [];
          }
          
          // Đặc biệt xử lý cho mảng collaborators để đảm bảo mỗi phần tử đều có trường user
          if (field === 'collaborators' && Array.isArray(eventData[field])) {
            eventData[field] = eventData[field].filter(item => {
              // Đảm bảo mỗi phần tử là đối tượng hợp lệ
              if (!item || typeof item !== 'object') return false;
              
              // Đảm bảo có trường user hợp lệ
              return item.user && (typeof item.user === 'string' || (typeof item.user === 'object' && item.user._id));
            });
            
            // Nếu không có dữ liệu mới, sử dụng dữ liệu cũ để tránh mất thông tin
            if (eventData[field].length === 0 && oldEvent && oldEvent[field]) {
              eventData[field] = oldEvent[field];
            }
          }
        } catch (e) {
          console.error(`Error processing ${field} array:`, e);
          // Nếu có lỗi khi xử lý dữ liệu, giữ lại dữ liệu cũ
          if (oldEvent && oldEvent[field]) {
            eventData[field] = oldEvent[field];
          } else {
            eventData[field] = [];
          }
        }
      }
    });

    // Handle location object
    if (eventData.location && typeof eventData.location === 'string') {
      eventData.location = JSON.parse(eventData.location);
    }

    // Handle images - Delete removed images from Cloudinary
    if ('existingImages' in eventData) {
      const newExistingImages = JSON.parse(eventData.existingImages || '[]');
      const oldImages = oldEvent.images || [];
      
      // Find images that were removed
      const removedImages = oldImages.filter(oldImg => 
        !newExistingImages.some(newImg => newImg.public_id === oldImg.public_id)
      );

      // Delete removed images from Cloudinary
      for (const image of removedImages) {
        try {
          await deleteFromCloudinary(image.public_id);
          console.log('Deleted image:', image.public_id);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }

      // Update images array - even if empty
      eventData.images = newExistingImages;
    }

    // Add new uploaded images if any
    if (req.body['images[0][public_id]']) {
      const newImages = [];
      let index = 0;
      while (req.body[`images[${index}][public_id]`]) {
        newImages.push({
          public_id: req.body[`images[${index}][public_id]`],
          url: req.body[`images[${index}][url]`]
        });
        index++;
      }
      
      // Combine with existing images
      eventData.images = eventData.images || [];
      eventData.images = [...eventData.images, ...newImages];
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      eventData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return next(new ErrorHandler('Event not found', 404));
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Delete event with authorization check
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Check if user is event creator or admin
    if (event.creator?.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Không có quyền xóa sự kiện này', 403));
    }

    // Start a transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove references from all users who registered for this event
      if (event.participants && event.participants.length > 0) {
        await User.updateMany(
          { _id: { $in: event.participants } },
          { $pull: { registeredEvents: event._id } },
          { session }
        );
      }

      // Remove references from all collaborators
      if (event.collaborators && event.collaborators.length > 0) {
        await User.updateMany(
          { _id: { $in: event.collaborators } },
          { $pull: { collaboratorEvents: event._id } },
          { session }
        );
      }

      // Delete the event
      await Event.findByIdAndDelete(event._id, { session });
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Delete event error:', error);
    next(new ErrorResponse('Lỗi khi xóa sự kiện', 500));
  }
};

// @desc: Join event
exports.joinEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    // Kiểm tra xem sự kiện đã kết thúc chưa
    if (new Date(event.endDate) < new Date()) {
      return next(new ErrorResponse('Event has already ended', 400));
    }

    // Kiểm tra xem user đã tham gia chưa
    if (event.participants.includes(req.user._id)) {
      return next(new ErrorResponse('Already joined this event', 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Thêm form responses vào registration record
      const registrationData = {
        event: event._id,
        user: req.user._id,
        status: 'approved',
        formData: new Map() // Tạo Map mới để lưu form data
      };

      // Nếu có form responses thì lưu vào formData
      if (req.body.formResponses) {
        Object.entries(req.body.formResponses).forEach(([key, value]) => {
          // Xử lý đặc biệt cho checkbox - lưu array vào Map
          if (Array.isArray(value)) {
            registrationData.formData.set(key, value);
          } else {
            registrationData.formData.set(key, value);
          }
        });
      }

      // Tạo registration record với form data
      await Registration.create([registrationData], { session });

      // Thêm user vào participants
      event.participants.addToSet(req.user._id);
      await event.save({ session });

      // Cập nhật registeredEvents của user
      await User.updateRegisteredEvents(req.user._id, event._id, 'join');

      // 4. Gửi thông báo
      await NotificationService.createEventJoinNotification(event, req.user);

      await session.commitTransaction();
      
      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// @desc: Leave event
exports.leaveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Xóa user khỏi participants của event
      await Event.findByIdAndUpdate(
        event._id,
        { $pull: { participants: req.user._id } },
        { session }
      );

      // 2. Xóa event khỏi registeredEvents của user
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { registeredEvents: event._id } },
        { session }
      );

      // 3. Xóa hoàn toàn registration record
      await Registration.findOneAndDelete(
        { 
          event: event._id, 
          user: req.user._id 
        },
        { session }
      );

      // Debug log
      console.log('Leaving event:', {
        eventId: event._id,
        userId: req.user._id,
        action: 'complete removal'
      });

      await session.commitTransaction();
      
      // Gửi thông báo sau khi đã commit transaction thành công
      try {
        const participant = await User.findById(req.user._id);
        if (participant) {
          await NotificationService.createEventLeaveNotification(event, participant);
          console.log('Leave event notification sent');
        } else {
          console.error('User not found for leave notification:', req.user._id);
        }
      } catch (notificationError) {
        console.error('Error sending leave notification:', notificationError);
        // Không throw lỗi ở đây để không ảnh hưởng đến response
      }
      
      res.status(200).json({
        success: true,
        message: 'Successfully left event and removed all related records'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in leaveEvent:', error);
    next(error);
  }
};

// @desc: Get event participants
exports.getEventParticipants = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    // Debug log để kiểm tra các giá trị
    console.log('Debug getEventParticipants:', {
      userId: req.user.id,
      creatorId: event.creator.toString(),
      organizerId: event.organizer.toString(),
      userRole: req.user.role
    });

    // Check if user is admin, creator, or organizer
    const isAdmin = req.user.role === 'admin';
    const isCreator = event.creator.toString() === req.user.id;
    const isOrganizer = event.organizer.toString() === req.user.id;
    
    // Check if user is a participant in this event
    const isParticipant = event.participants && 
                          event.participants.some(p => p.toString() === req.user._id.toString());

    // Full access for admins, creators, and organizers
    const hasFullAccess = isAdmin || isCreator || isOrganizer;

    // Debug log kết quả kiểm tra quyền
    console.log('Authorization check:', { 
      isAdmin, isCreator, isOrganizer, isParticipant, 
      hasFullAccess 
    });

    // If not even a participant, deny access completely
    if (!hasFullAccess && !isParticipant) {
      return next(new ErrorResponse('Not authorized to view participants', 403));
    }

    // Build the query based on user permissions
    let query = { 
      event: event._id,
      status: { $ne: 'cancelled' } // Chỉ lấy những người chưa hủy đăng ký
    };
    
    // If user is not admin/creator/organizer but is a participant, only show their own record
    if (!hasFullAccess && isParticipant) {
      query.user = req.user._id;
    }

    // Lấy thông tin chi tiết người tham gia và registration status
    const participants = await Registration.find(query)
      .populate('user', 'fullName email avatar')
      .select('user status registeredAt')
      .sort({ registeredAt: -1 }); // Sắp xếp theo thời gian đăng ký, mới nhất lên đầu

    const formattedParticipants = participants.map(reg => ({
      _id: reg.user._id,
      fullName: reg.user.fullName,
      email: reg.user.email,
      avatar: reg.user.avatar,
      registrationStatus: reg.status,
      registeredAt: reg.registeredAt
    }));

    res.status(200).json({
      success: true,
      data: formattedParticipants
    });
  } catch (error) {
    console.error('Error in getEventParticipants:', error);
    next(error);
  }
};

// @desc: Join event as a collaborator
exports.joinEventAsCollaborator = async (req, res, next) => {  
  try {    
    const event = await Event.findById(req.params.id);    
    if (!event) {      
      return next(new ErrorResponse('Event not found', 404));    
    }    
    
    // Kiểm tra xem sự kiện đã kết thúc chưa    
    if (new Date(event.endDate) < new Date()) {      
      return next(new ErrorResponse('Event has already ended', 400));    
    }    
    
    // Kiểm tra xem user đã đăng ký làm collaborator chưa
    const existingCollaborator = event.collaborators.find(
      collab => collab.user && collab.user.toString() === req.user._id.toString()
    );
    
    if (existingCollaborator) {
      return next(new ErrorResponse(`Bạn đã đăng ký làm cộng tác viên cho sự kiện này (trạng thái: ${existingCollaborator.status})`, 400));
    }
    
    const session = await mongoose.startSession();    
    session.startTransaction();
    
    try {      
      // Kiểm tra xem người dùng có quyền đặc biệt không
      const isAdmin = ['admin', 'superadmin', 'department_head', 'department_admin'].includes(req.user.role);
      const isCreator = event.creator.toString() === req.user.id;
      const isOrganizer = event.organizer.toString() === req.user.id;
      
      // Người tạo, tổ chức, và admin đều có quyền phê duyệt
      const hasFullAccess = isAdmin || isCreator || isOrganizer;
      
      // Thêm user vào danh sách collaborators với trạng thái tương ứng
      const newCollaborator = {
        user: req.user._id,
        status: hasFullAccess ? 'approved' : 'pending', // Tự động phê duyệt
        requestedAt: new Date()
      };
      
      // Nếu là admin, thêm thông tin phê duyệt luôn
      if (hasFullAccess) {
        newCollaborator.approvedAt = new Date();
        newCollaborator.approvedBy = req.user._id; // Tự phê duyệt
      }
      
      await Event.findByIdAndUpdate(
        event._id,
        { $push: { collaborators: newCollaborator } },
        { session }
      );
      
      // Cập nhật collaboratorEvents của user      
      await User.findByIdAndUpdate(        
        req.user._id,        
        { $addToSet: { collaboratorEvents: event._id } },        
        { session }      
      );

      // Gửi thông báo cho người tạo sự kiện
      await NotificationService.createCollaboratorJoinNotification(
        event, 
        req.user, 
        hasFullAccess // Truyền flag auto-approved
      );
      
      await session.commitTransaction();            
      
      res.status(200).json({        
        success: true,        
        message: hasFullAccess 
          ? 'Bạn đã được tự động phê duyệt làm cộng tác viên thành công.' 
          : 'Đã gửi yêu cầu làm cộng tác viên thành công. Vui lòng chờ phê duyệt.'     
      });    
    } catch (error) {      
      await session.abortTransaction();      
      throw error;    
    } finally {      
      session.endSession();    
    }  
  } catch (error) {    
    console.error('Error in joinEventAsCollaborator:', error);    
    next(error);  
  }
};

// @desc: Leave event as a collaborator
exports.leaveEventAsCollaborator = async (req, res, next) => {  
  try {    
    const event = await Event.findById(req.params.id);    
    if (!event) {      
      return next(new ErrorResponse('Event not found', 404));    
    }

    // Kiểm tra vai trò người dùng và cấu trúc collaborators
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    
    // Cải thiện cách kiểm tra isCollaborator để xử lý các trường hợp khác nhau của cấu trúc dữ liệu
    const isCollaborator = event.collaborators.some(collab => {
      if (!collab) return false;
      
      // Trường hợp 1: collab.user là một string (ObjectId)
      if (collab.user && typeof collab.user === 'string') {
        return collab.user === req.user._id.toString();
      }
      
      // Trường hợp 2: collab.user là một đối tượng
      if (collab.user && typeof collab.user === 'object' && collab.user._id) {
        return collab.user._id.toString() === req.user._id.toString();
      }
      
      // Trường hợp 3: collab là một string (ObjectId người dùng)
      if (typeof collab === 'string') {
        return collab === req.user._id.toString();
      }
      
      // Trường hợp 4: collab là một đối tượng người dùng
      if (typeof collab === 'object' && collab._id) {
        return collab._id.toString() === req.user._id.toString();
      }
      
      return false;
    });
    
    console.log('Leave collaborator check:', { isAdmin, isCollaborator, userId: req.user._id });
    
    // Admin luôn có thể hủy, những người khác phải là collaborator
    if (!isAdmin && !isCollaborator) {      
      return next(new ErrorResponse('Bạn không phải là cộng tác viên của sự kiện này', 400));    
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();    
    
    try {      
      // Xóa user khỏi collaborators bằng updateOne với $pull      
      await Event.updateOne(
        { _id: event._id },
        { $pull: { collaborators: { user: req.user._id } } },
        { session }
      );
      
      // Thêm trường hợp đặc biệt nếu người dùng là admin
      if (isAdmin && !isCollaborator) {
        // Log thông tin để debug
        console.log('Admin leaving event as collaborator but not found in standard format');
        
        // Thử các cách khác để xóa user khỏi collaborators
        await Event.updateOne(
          { _id: event._id },
          { 
            $pull: { 
              collaborators: req.user._id,
              'collaborators': { 'user._id': req.user._id }
            } 
          },
          { session }
        );
      }
      
      // Cập nhật collaboratorEvents của user      
      await User.findByIdAndUpdate(        
        req.user._id,        
        { $pull: { collaboratorEvents: event._id } },        
        { session }      
      );      
      
      // Gửi thông báo      
      await NotificationService.createCollaboratorLeaveNotification(event, req.user);
      
      await session.commitTransaction();            
      
      res.status(200).json({        
        success: true,        
        message: 'Đã hủy đăng ký làm cộng tác viên thành công'      
      });    
    } catch (error) {
      await session.abortTransaction();      
      throw error;    
    } finally {
      session.endSession();    
    }  
  } catch (error) {    
    console.error('Error in leaveEventAsCollaborator:', error);    
    next(error);  
  }
};

// @desc: Approve a collaborator request
// @route: PUT /api/v1/events/:id/approve-collaborator/:userId
// @access: Private (Admin, Creator, Organizer)
exports.approveCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    // Tìm sự kiện
    const event = await Event.findById(id);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }
    
    // Kiểm tra quyền phê duyệt
    const isAdmin = req.user.role === 'admin';
    const isCreator = event.creator.toString() === req.user.id;
    const isOrganizer = event.organizer.toString() === req.user.id;
    
    if (!isAdmin && !isCreator && !isOrganizer) {
      return next(new ErrorResponse('Bạn không có quyền phê duyệt yêu cầu này', 403));
    }
    
    // Tìm collaborator trong mảng
    const collaboratorIndex = event.collaborators.findIndex(
      collab => collab.user && collab.user.toString() === userId
    );
    
    if (collaboratorIndex === -1) {
      return next(new ErrorResponse('Không tìm thấy yêu cầu làm cộng tác viên', 404));
    }
    
    // Kiểm tra trạng thái hiện tại
    if (event.collaborators[collaboratorIndex].status === 'approved') {
      return next(new ErrorResponse('Yêu cầu này đã được phê duyệt trước đó', 400));
    }
    
    // Cập nhật trạng thái sử dụng updateOne thay vì cập nhật trực tiếp object
    await Event.updateOne(
      { 
        _id: id, 
        'collaborators.user': userId 
      },
      { 
        $set: { 
          'collaborators.$.status': 'approved',
          'collaborators.$.approvedAt': new Date(),
          'collaborators.$.approvedBy': req.user._id
        } 
      }
    );
    
    // Tìm thông tin người dùng được phê duyệt
    const approvedUser = await User.findById(userId);
    
    // Gửi thông báo cho người được phê duyệt
    await NotificationService.createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'collaborator_request_approved',
      title: 'Yêu cầu làm CTV đã được chấp nhận',
      message: `Yêu cầu làm cộng tác viên của bạn cho sự kiện "${event.title}" đã được chấp nhận`,
      relatedModel: 'Event',
      relatedId: event._id,
      link: `/events/${event._id}`
    });
    
    res.status(200).json({
      success: true,
      message: `Đã phê duyệt yêu cầu làm cộng tác viên của ${approvedUser ? approvedUser.fullName : userId}`,
      data: {
        event: {
          _id: event._id,
          title: event.title
        },
        collaborator: {
          _id: userId,
          name: approvedUser ? approvedUser.fullName : 'Unknown'
        }
      }
    });
  } catch (error) {
    console.error('Error in approveCollaborator:', error);
    next(error);
  }
};

// @desc: Reject a collaborator request
// @route: PUT /api/v1/events/:id/reject-collaborator/:userId
// @access: Private (Admin, Creator, Organizer)
exports.rejectCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    // Tìm sự kiện
    const event = await Event.findById(id);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }
    
    // Kiểm tra quyền từ chối
    const isAdmin = req.user.role === 'admin';
    const isCreator = event.creator.toString() === req.user.id;
    const isOrganizer = event.organizer.toString() === req.user.id;
    
    if (!isAdmin && !isCreator && !isOrganizer) {
      return next(new ErrorResponse('Bạn không có quyền từ chối yêu cầu này', 403));
    }
    
    // Tìm collaborator trong mảng
    const collaboratorIndex = event.collaborators.findIndex(
      collab => collab.user && collab.user.toString() === userId
    );
    
    if (collaboratorIndex === -1) {
      return next(new ErrorResponse('Không tìm thấy yêu cầu làm cộng tác viên', 404));
    }
    
    // Kiểm tra trạng thái hiện tại
    if (event.collaborators[collaboratorIndex].status === 'rejected') {
      return next(new ErrorResponse('Yêu cầu này đã bị từ chối trước đó', 400));
    }
    
    // Cập nhật trạng thái sử dụng updateOne
    const updateObject = { 'collaborators.$.status': 'rejected' };
    
    // Lưu lý do từ chối nếu có
    if (req.body.reason) {
      updateObject['collaborators.$.rejectionReason'] = req.body.reason;
    }
    
    await Event.updateOne(
      { 
        _id: id, 
        'collaborators.user': userId 
      },
      { $set: updateObject }
    );
    
    // Xóa sự kiện khỏi danh sách collaboratorEvents của người dùng
    await User.findByIdAndUpdate(
      userId,
      { $pull: { collaboratorEvents: event._id } }
    );
    
    // Tìm thông tin người dùng bị từ chối
    const rejectedUser = await User.findById(userId);
    
    // Gửi thông báo cho người bị từ chối
    await NotificationService.createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'collaborator_request_rejected',
      title: 'Yêu cầu làm CTV đã bị từ chối',
      message: `Yêu cầu làm cộng tác viên của bạn cho sự kiện "${event.title}" đã bị từ chối${req.body.reason ? ' với lý do: ' + req.body.reason : ''}`,
      relatedModel: 'Event',
      relatedId: event._id
    });
    
    res.status(200).json({
      success: true,
      message: `Đã từ chối yêu cầu làm cộng tác viên của ${rejectedUser ? rejectedUser.fullName : userId}`,
      data: {
        event: {
          _id: event._id,
          title: event.title
        },
        collaborator: {
          _id: userId,
          name: rejectedUser ? rejectedUser.fullName : 'Unknown'
        }
      }
    });
  } catch (error) {
    console.error('Error in rejectCollaborator:', error);
    next(error);
  }
};

// @desc: Get event collaborators with status information
// @route: GET /api/v1/events/:id/collaborators
// @access: Private
exports.getEventCollaborators = async (req, res, next) => {  
  try {    
    const event = await Event.findById(req.params.id)
      .populate('collaborators.user', '_id fullName email avatar role')
      .populate('collaborators.approvedBy', '_id fullName');
      
    if (!event) {      
      return next(new ErrorResponse('Event not found', 404));    
    }    
    
    // Debug log để kiểm tra các giá trị    
    console.log('Debug getEventCollaborators:', {      
      userId: req.user.id,      
      creatorId: event.creator?.toString(),      
      organizerId: event.organizer?.toString(),      
      userRole: req.user.role    
    });    
    
    // Kiểm tra quyền xem collaborators    
    const isAdmin = req.user.role === 'admin';    
    const isCreator = event.creator && event.creator.toString() === req.user.id;    
    const isOrganizer = event.organizer && event.organizer.toString() === req.user.id;
    
    // Kiểm tra xem user có phải là collaborator không
    const userCollaborator = event.collaborators.find(
      collab => collab.user && collab.user._id.toString() === req.user._id.toString()
    );
    const isCollaborator = !!userCollaborator;
    
    // Full access for admins, creators, and organizers
    const hasFullAccess = isAdmin || isCreator || isOrganizer;
    
    // Debug log kết quả kiểm tra quyền
    console.log('Collaborators authorization check:', {      
      isAdmin, isCreator, isOrganizer, isCollaborator,     
      hasFullAccess
    });    
    
    // If not even a collaborator, deny access completely
    if (!hasFullAccess && !isCollaborator) {
      return next(new ErrorResponse('Not authorized to view collaborators', 403));
    }
    
    let collaborators = [];
    
    // Nếu có full access, hiển thị toàn bộ danh sách với thông tin đầy đủ
    if (hasFullAccess) {
      collaborators = event.collaborators;
    } else {
      // Nếu là collaborator, chỉ hiển thị thông tin của chính mình
      collaborators = [userCollaborator];
    }
    
    // Sắp xếp collaborators theo trạng thái và thời gian
    collaborators.sort((a, b) => {
      // Đưa các yêu cầu chưa xử lý lên đầu
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      // Sau đó sắp xếp theo thời gian yêu cầu (mới nhất lên đầu)
      return new Date(b.requestedAt) - new Date(a.requestedAt);
    });
    
    res.status(200).json({      
      success: true,      
      data: collaborators
    });  
  } catch (error) {    
    console.error('Error in getEventCollaborators:', error);    
    next(error);  
  }
};

// @desc: Update event registration form
exports.updateEventForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    let form;
    if (event.registrationForm) {
      // Update existing form
      form = await RegistrationForm.findByIdAndUpdate(
        event.registrationForm,
        { fields },
        { new: true }
      );
    } else {
      // Create new form
      form = await RegistrationForm.create({
        event: event._id,
        fields,
        createdBy: req.user.id
      });
      event.registrationForm = form._id;
      await event.save();
    }

    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Get event registration form
exports.getEventRegistrationForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registrationForm') // Add this populate
      .select('registrationForm needsRegistrationForm');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Return the populated registration form if it exists
    if (event.needsRegistrationForm && event.registrationForm) {
      return res.status(200).json({
        success: true,
        data: {
          fields: event.registrationForm.fields || []
        }
      });
    }

    // Return empty fields if no form exists
    return res.status(200).json({
      success: true,
      data: { fields: [] }
    });

  } catch (error) {
    console.error('Error getting registration form:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getFormSubmissions = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Kiểm tra quyền (chỉ organizer và admin mới xem được)
    if (event.organizer.toString() !== req.user._id.toString() 
        && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions'
      });
    }

    const submissions = await Registration.find({ event: event._id })
      .populate('user')
      .select('formData createdAt status') // Make sure formData is included
      .sort({ createdAt: -1 });

    // Format data to include form responses
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      user: sub.user,
      status: sub.status,
      createdAt: sub.createdAt,
      formResponses: sub.formData || {} // Include the form responses
    }));

    res.status(200).json({
      success: true,
      data: formattedSubmissions
    });
  } catch (error) {
    console.error('Error getting form submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting submissions'
    });
  }
};

// @desc: Remove a collaborator (by admin, creator, or organizer)
// @route: POST /api/v1/events/:id/remove-collaborator/:userId
// @access: Private (Admin, Creator, Organizer)
exports.removeCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }
    
    // Check permission to remove collaborator
    const isAdmin = req.user.role === 'admin';
    const isCreator = event.creator.toString() === req.user.id;
    const isOrganizer = event.organizer.toString() === req.user.id;
    
    if (!isAdmin && !isCreator && !isOrganizer) {
      return next(new ErrorResponse('Bạn không có quyền xóa cộng tác viên', 403));
    }
    
    // Find collaborator in the array
    const collaboratorIndex = event.collaborators.findIndex(
      collab => collab.user && collab.user.toString() === userId
    );
    
    if (collaboratorIndex === -1) {
      return next(new ErrorResponse('Không tìm thấy cộng tác viên này', 404));
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Remove user from collaborators
      await Event.findByIdAndUpdate(
        event._id,
        { $pull: { collaborators: { user: userId } } },
        { session }
      );
      
      // Update collaboratorEvents of user
      await User.findByIdAndUpdate(
        userId,
        { $pull: { collaboratorEvents: event._id } },
        { session }
      );
      
      // Find user details for notification
      const removedUser = await User.findById(userId);
      
      await session.commitTransaction();
      
      // Send notification
      if (removedUser) {
        await NotificationService.createNotification({
          recipient: userId,
          sender: req.user._id,
          type: 'event_collaborator_removed',
          title: `Bạn đã bị xóa khỏi danh sách CTV`,
          message: `Bạn đã bị xóa khỏi danh sách cộng tác viên của sự kiện "${event.title}"`,
          relatedModel: 'Event',
          relatedId: event._id,
        });
      }
      
      res.status(200).json({
        success: true,
        message: `Đã xóa ${removedUser ? removedUser.fullName : 'người dùng'} khỏi danh sách cộng tác viên thành công`
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error in removeCollaborator:', error);
    next(error);
  }
};