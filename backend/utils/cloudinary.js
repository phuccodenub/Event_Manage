const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (file, folder = 'user-avatars', options = {}) => {
  try {
    const uploadOptions = {
      folder,
      ...options
    };

    // Only apply transformation for user avatars
    if (folder === 'user-avatars') {
      uploadOptions.transformation = [
        { width: 250, height: 250, crop: 'fill' }
      ];
    } else {
      // For all other uploads, keep original dimensions without any transformations
      uploadOptions.transformation = [
        { quality: 'auto' }  // Only optimize quality while preserving original dimensions
      ];
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, uploadOptions);
    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Error uploading to Cloudinary');
  }
};

const uploadMultipleToCloudinary = async (files, folder = 'events') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Error uploading multiple files to Cloudinary');
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Error deleting from Cloudinary');
  }
};

const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!publicIds?.length) return;
  try {
    const deletePromises = publicIds.map(id => cloudinary.uploader.destroy(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Multiple delete error:', error);
    throw new Error('Error deleting multiple files from Cloudinary');
  }
};

module.exports = { 
  uploadToCloudinary, 
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
  deleteMultipleFromCloudinary 
};
