const Announcement = require('../models/announcementModel');
const ErrorResponse = require('../utils/errorResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

exports.getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('creator', 'fullName email avatar')
      .populate('department', 'name')
      .sort({ createdAt: -1, priority: -1 });

    res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching announcements', 500));
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcementData = { ...req.body };
    announcementData.creator = req.user.id;

    // Handle images array from form data - same as event
    const images = [];
    if (req.body['images[0][public_id]']) {
      let index = 0;
      while (req.body[`images[${index}][public_id]`]) {
        images.push({
          public_id: req.body[`images[${index}][public_id]`],
          url: req.body[`images[${index}][url]`]
        });
        index++;
      }
      announcementData.images = images;
    }

    console.log('Creating announcement with data:', announcementData);

    const announcement = await Announcement.create(announcementData);
    await announcement.populate('creator');
    await announcement.populate('department');

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Announcement creation error:', error);
    next(new ErrorResponse(error.message || 'Error creating announcement', 500));
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    let announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return next(new ErrorResponse('Announcement not found', 404));
    }

    // Check authorization
    if (announcement.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this announcement', 403));
    }

    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creator')
     .populate('department');

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return next(new ErrorResponse('Announcement not found', 404));
    }

    // Check authorization
    if (announcement.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this announcement', 403));
    }

    // Delete images from Cloudinary
    if (announcement.images?.length > 0) {
      const deletePromises = announcement.images.map(img => 
        deleteFromCloudinary(img.public_id)
      );
      await Promise.all(deletePromises);
    }

    await announcement.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
};
