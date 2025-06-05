import apiClient from '../api/apiClient';

export interface UploadedFile {
  public_id: string;
  url: string;
}

// Removed health check as it was causing issues - backend doesn't have /health endpoint

const uploadService = {
  uploadEventImages: async (files: File[], retryCount = 0): Promise<UploadedFile[]> => {
    try {
      // Validate files
      if (!files || files.length === 0) {
        throw new Error('Không có file nào để tải lên');
      }

      // Skip health check - just try upload directly

      // Check file sizes and types
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} quá lớn (>10MB)`);
        }
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} không phải là hình ảnh`);
        }
      }

      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.type, file.size);
        formData.append('images', file);
      });

      console.log('Uploading to /upload/events with', files.length, 'files');
      
      const response = await apiClient.post('/upload/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Upload response:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to upload images');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Image upload error (attempt', retryCount + 1, '):', error.response?.data || error.message);
      
      // Retry once on network errors or server errors
      if (retryCount === 0 && (
        error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.response?.status >= 500 ||
        error.response?.status === 404
      )) {
        console.log('Retrying upload after error:', error.response?.status || error.code);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return uploadService.uploadEventImages(files, retryCount + 1);
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Error uploading images'
      );
    }
  },

  uploadCommunityImage: async (file: File, type: 'avatar' | 'banner'): Promise<UploadedFile> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await apiClient.post('/upload/community', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || `Không thể tải lên ${type}`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Community image upload error:', error.response || error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        `Lỗi khi tải lên ${type} cộng đồng`
      );
    }
  },

  deleteFile: async (publicId: string): Promise<void> => {
    await apiClient.delete(`/upload/${publicId}`);
  },

  deleteMultipleFiles: async (publicIds: string[]): Promise<void> => {
    await apiClient.delete('/upload/multiple', { data: { publicIds } });
  }
};

export default uploadService;
