import apiClient from '../api/apiClient';

interface CheckinData {
  eventId: string;
  studentId: string;
  method?: 'qr' | 'manual';
}

const checkinService = {
  checkinUser: async (data: CheckinData) => {
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

  getEventCheckins: async (eventId: string) => {
    const response = await apiClient.get(`/checkins/event/${eventId}`);
    return response.data;
  }
};

export default checkinService;
