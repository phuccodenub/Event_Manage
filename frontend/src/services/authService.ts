import apiClient from '../api/apiClient';

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
    const response = await apiClient.post('/auth/login', { username, password });
    const { user, token } = response.data;

    // Lưu token và thông tin người dùng vào localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user)); // Lưu toàn bộ thông tin user

    return user;
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  logout: async () => {
    // Xóa toàn bộ localStorage
    const response = await apiClient.get('/auth/logout');
    localStorage.clear(); // Xóa toàn bộ localStorage
    return response;
  },

  /**
   * Lấy thông tin người dùng hiện tại từ localStorage
   * @returns Thông tin người dùng hoặc null nếu không có
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user)); // Cập nhật lại thông tin user trong localStorage
      return user;
    } catch (error) {
      return null;
    }
  },

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   * @returns true nếu đã đăng nhập, ngược lại false
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },

  /**
   * Đăng nhập bằng Google OAuth
   * @param credential Credential từ Google
   * @returns Promise với kết quả đăng nhập
   */
  googleLogin: async (credential: string) => {
    const response = await apiClient.post('/auth/google', { credential });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
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