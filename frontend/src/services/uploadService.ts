import apiClient from '../api/apiClient';

export interface UploadedFile {
  public_id: string;
  url: string;
}

const uploadService = {
  uploadEventImages: async (files: File[]): Promise<UploadedFile[]> => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await apiClient.post('/upload/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to upload images');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Image upload error:', error.response || error);
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
