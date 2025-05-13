import apiClient, { disableCachingForRequest } from '../api/apiClient';

// Định nghĩa interface cho lỗi API
interface ApiError {
  status?: number;
  message?: string;
}

/**
 * Dịch vụ xử lý xác thực và phân quyền
 */
const authService = {
  /**
   * Đăng nhập vào hệ thống
   * @param username Tên đăng nhập
   * @param password Mật khẩu
   * @returns Promise với kết quả đăng nhập
   */
  login: async (username: string, password: string) => {
    try {
    const response = await apiClient.post('/auth/login', { username, password });
    const { user, token } = response.data;

    // Lưu token và thông tin người dùng vào localStorage
    localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

    return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  logout: async () => {
    try {
    const response = await apiClient.get('/auth/logout');
    localStorage.clear(); // Xóa toàn bộ localStorage
    return response;
    } catch (error) {
      // Vẫn xóa localStorage ngay cả khi API call thất bại
      localStorage.clear();
      console.error('Logout error:', error);
      // Không throw lỗi để đảm bảo luôn logout được
      return null;
    }
  },

  /**
   * Lấy thông tin người dùng hiện tại từ API
   * @returns Thông tin người dùng hoặc null nếu không có
   */
  getProfile: async () => {
    try {
      // Tránh cache cho request này
      const config = disableCachingForRequest({});
      
      const response = await apiClient.get('/auth/me', config);
      const user = response.data.data;
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return user;
    } catch (error: unknown) {
      // Nếu có lỗi xác thực (401), xóa dữ liệu user và token
      if ((error as ApiError).status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      
      console.error('Get profile error:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   * @returns true nếu đã đăng nhập, ngược lại false
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Đăng nhập bằng Google OAuth
   * @param credential Credential từ Google
   * @returns Promise với kết quả đăng nhập
   */
  googleLogin: async (credential: string) => {
    try {
    const response = await apiClient.post('/auth/google', { credential });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  /**
   * Đăng nhập bằng Facebook OAuth
   * @param accessToken Access token từ Facebook
   * @returns Promise với kết quả đăng nhập
   */
  facebookLogin: async (accessToken: string) => {
    try {
      const response = await apiClient.post('/auth/facebook', { accessToken });
      
      if (response.data.success) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      
      throw new Error('Facebook login failed');
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  },
};

export default authService;