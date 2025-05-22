const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// @route POST /api/v1/upload/events
// @desc Upload multiple images for events
router.post('/events', protect, async (req, res) => {
  try {
    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one image'
      });
    }

    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    const uploadedImages = await Promise.all(
      files.map(file => uploadToCloudinary(file, 'events'))
    );

    res.status(200).json({
      success: true,
      data: uploadedImages
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Error uploading images'
    });
  }
});

// @route POST /api/v1/upload/community
// @desc Upload avatar or banner for a community
router.post('/community', protect, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng tải lên một hình ảnh'
      });
    }

    // Xác định loại ảnh (avatar hoặc banner)
    const imageType = req.body.type || 'avatar';
    const folder = imageType === 'avatar' ? 'community-avatars' : 'community-banners';
    
    // Cấu hình riêng cho từng loại ảnh
    let options = {};
    if (imageType === 'avatar') {
      options = {
        transformation: [
          { width: 250, height: 250, crop: 'fill' }
        ]
      };
    } else if (imageType === 'banner') {
      options = {
        transformation: [
          { width: 1200, height: 400, crop: 'fill' }
        ]
      };
    }

    // Upload lên Cloudinary
    const uploadedImage = await uploadToCloudinary(req.files.image, folder, options);

    res.status(200).json({
      success: true,
      data: uploadedImage
    });
  } catch (error) {
    console.error('Community image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tải lên hình ảnh'
    });
  }
});

// @route DELETE /api/v1/upload/:publicId
// @desc Delete an image from Cloudinary
router.delete('/:publicId', protect, async (req, res) => {
  try {
    await deleteFromCloudinary(req.params.publicId);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting image'
    });
  }
});

// @route GET /api/v1/upload/proxy/:folder/:publicId
// @desc Proxy an image from Cloudinary through our backend
router.get('/proxy/:folder/:publicId', async (req, res) => {
  try {
    const { folder, publicId } = req.params;
    if (!publicId || !folder) {
      return res.status(400).json({
        success: false,
        error: 'Public ID and folder are required'
      });
    }

    // Tạo full publicId đúng định dạng
    const fullPublicId = `${folder}/${publicId}`;
    console.log('Proxying image with publicId:', fullPublicId);

    // Tạo URL Cloudinary từ public_id
    const cloudinaryUrl = cloudinary.url(fullPublicId, {
      secure: true,
      transformation: req.query.type === 'banner' 
        ? [{ width: 1200, height: 400, crop: 'fill' }] 
        : [{ width: 250, height: 250, crop: 'fill' }]
    });

    console.log('Generated Cloudinary URL:', cloudinaryUrl);

    // Redirect đến URL Cloudinary
    res.redirect(cloudinaryUrl);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving image'
    });
  }
});

module.exports = router;
