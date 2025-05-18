import apiClient from '../api/apiClient';

interface CertificateVerificationResult {
  success: boolean;
  data: {
    eventName: string;
    eventDate: string;
    canGenerateCertificate: boolean;
    userRole?: 'participant' | 'collaborator';
    conditions?: {
      eventEnded: boolean;
      isRegistered: boolean;
      hasCheckedIn: boolean;
      isParticipant?: boolean;
      isCollaborator?: boolean;
    };
  };
  message?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

const certificateService = {
  /**
   * Kiểm tra xem người dùng có đủ điều kiện nhận chứng nhận không
   * @param eventId ID của sự kiện
   * @param userId ID của người dùng
   * @param certificateType Loại chứng nhận ('participant' hoặc 'collaborator')
   * @returns Kết quả xác minh
   */
  verifyCertificateEligibility: async (
    eventId: string, 
    userId: string, 
    certificateType: 'participant' | 'collaborator' = 'participant'
  ): Promise<CertificateVerificationResult> => {
    try {
      const response = await apiClient.get(`/certificates/verify/${eventId}/${userId}/${certificateType}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error verifying certificate eligibility:', apiError);

      // Trả về thông báo lỗi phù hợp
      if (apiError.response?.status === 404) {
        throw { 
          success: false, 
          message: apiError.response.data?.message || 'Không tìm thấy sự kiện hoặc người dùng'
        };
      } else if (apiError.response?.status === 403) {
        throw { 
          success: false, 
          message: apiError.response.data?.message || 'Không có quyền truy cập'
        };
      } else {
        throw { 
          success: false, 
          message: apiError.response?.data?.message || apiError.message || 'Lỗi kiểm tra điều kiện nhận chứng nhận'
        };
      }
    }
  },

  /**
   * Lấy URL tạo chứng nhận
   * @param eventId ID của sự kiện
   * @param userId ID của người dùng
   * @param certificateType Loại chứng nhận ('participant' hoặc 'collaborator')
   * @returns URL để tải chứng nhận
   */
  getCertificateUrl: (
    eventId: string, 
    userId: string, 
    certificateType: 'participant' | 'collaborator' = 'participant'
  ): string => {
    return `${apiClient.defaults.baseURL}/certificates/${eventId}/${userId}/${certificateType}`;
  }
};

export default certificateService; 