import apiClient from '../api/apiClient';

interface CheckinData {
  eventId: string;
  studentId: string;
  method?: 'qr' | 'manual';
  type: 'participant' | 'collaborator';
}

interface CheckinResponse {
  success: boolean;
  data: any;
  message?: string;
}

interface Checkin {
  _id: string;
  studentId: string;
  checkinTime: string;
  checkinMethod: 'qr' | 'manual';
  type: 'participant' | 'collaborator';
  user?: {
    _id: string;
    fullName: string;
  };
}

const checkinService = {
  checkinUser: async (data: CheckinData): Promise<CheckinResponse> => {
    try {
      const response = await apiClient.post('/checkins', data);
      return response.data;
    } catch (error: any) {
      // Return the exact error response from server
      if (error.response?.data) {
        throw error.response.data;
      }
      // Fallback error if no response from server
      throw {
        success: false,
        error: 'Sinh viên đã điểm danh hoặc không tồn tại trong sự kiện này',
      };
    }
  },

  getEventCheckins: async (eventId: string, type?: 'participant' | 'collaborator') => {
    let url = `/checkins/event/${eventId}`;
    if (type) {
      url += `?type=${type}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  deleteCheckin: async (checkinId: string): Promise<CheckinResponse> => {
    try {
      const response = await apiClient.delete(`/checkins/${checkinId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        error: 'Không thể xóa điểm danh',
      };
    }
  },

  deleteCheckinsByStudent: async (eventId: string, studentId: string): Promise<CheckinResponse> => {
    try {
      const response = await apiClient.delete(`/checkins/event/${eventId}/student/${studentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        error: 'Không thể xóa điểm danh của sinh viên này',
      };
    }
  }
};

export default checkinService;
