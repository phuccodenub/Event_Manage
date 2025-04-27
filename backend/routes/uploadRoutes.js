const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
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

module.exports = router;
