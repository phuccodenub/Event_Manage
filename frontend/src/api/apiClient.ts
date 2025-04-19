import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1', // Thay localhost bằng relative path làm mặc định
  withCredentials: true, // Giữ để hỗ trợ gửi cookies (nếu cần xác thực)
  headers: {
    'Content-Type': 'application/json', // Đảm bảo tất cả request đều có Content-Type
  },
});

// Xử lý response và error
apiClient.interceptors.response.use(
  (response) => response, // Trả về response nguyên vẹn
  (error) => {
    // Xử lý lỗi: Trả về dữ liệu lỗi chi tiết hoặc thông báo chung
    const errorData = error.response?.data || { message: error.message };
    return Promise.reject(errorData);
  }
);

export default apiClient;