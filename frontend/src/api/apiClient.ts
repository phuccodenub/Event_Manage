import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { cache } from '../utils/cacheManager';

// Định nghĩa interface cho queue item
interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1', // Thay localhost bằng relative path làm mặc định
  withCredentials: true, // Giữ để hỗ trợ gửi cookies (nếu cần xác thực)
  headers: {
    'Content-Type': 'application/json', // Đảm bảo tất cả request đều có Content-Type
  },
});

// Marker để chỉ với một số request không cần cache
export const disableCachingForRequest = (config: AxiosRequestConfig): AxiosRequestConfig => {
  if (config && config.headers) {
    config.headers['X-Disable-Cache'] = 'true';
  }
  return config;
};

// Tạo flag để tránh lặp vô hạn khi refresh token
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hàm xử lý logout khi lỗi 401
const handleAuthError = () => {
  // Xóa token và thông tin user khỏi localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Nếu chưa ở trang login, chuyển hướng đến trang login
  if (!window.location.pathname.includes('/login')) {
    console.log('Redirecting to login page due to auth error');
    window.location.href = '/login';
  }
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Lưu vào cache nếu phù hợp và không phải request auth
    if (response.config.method === 'get' && 
        !response.config.headers['X-Disable-Cache'] && 
        !response.config.url?.includes('/auth/')) {
      try {
        // Sử dụng cache manager thay vì localStorage trực tiếp
        cache.cacheGetRequest(response.config.url || '', response.data);
      } catch (error) {
        // Bỏ qua lỗi khi lưu cache
        console.error('Failed to cache response:', error);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Bỏ qua xử lý với request login (tránh vòng lặp)
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    
    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      // Nếu đang refresh rồi thì thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest as AxiosRequestConfig);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        handleAuthError();
        
        // Mặc định cho phiên đăng nhập hết hạn
        return Promise.reject({ 
          message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 
          status: 401 
        });
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý các lỗi khác
    const errorData = error.response?.data || { message: error.message, status: error.response?.status };
    return Promise.reject(errorData);
  }
);

export default apiClient;