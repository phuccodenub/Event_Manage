import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const ResetPassword: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Extract token from URL path
  const token = location.split('/').pop();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  // Check token validity on component mount
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        // You might want to add a token validation endpoint
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
        toast.error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
      }
    };

    checkToken();
  }, [token]);

  // Check password strength
  const checkPasswordStrength = async (password: string) => {
    if (!password || password.length < 3) {
      setPasswordStrength({ score: 0, message: '' });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/account/check-password-strength`, {
        password
      });
      setPasswordStrength(response.data.data);
    } catch (error) {
      console.error('Password strength check failed:', error);
    }
  };

  useEffect(() => {
    if (password) {
      const timeoutId = setTimeout(() => checkPasswordStrength(password), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [password]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error('Mật khẩu chưa đủ mạnh, vui lòng chọn mật khẩu phức tạp hơn');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/account/reset-password/${token}`, {
        password: data.password
      });

      setSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi đặt lại mật khẩu';
      toast.error(errorMessage);
      
      if (error.response?.status === 400 || error.response?.status === 404) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'text-red-500';
    if (score <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPasswordStrengthWidth = (score: number) => {
    return `${(score / 5) * 100}%`;
  };

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Link không hợp lệ</h2>
            <p className="mt-2 text-sm text-gray-600">
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">
              <p className="font-medium">Có thể do:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Link đã được sử dụng</li>
                <li>Link đã hết hạn (15 phút)</li>
                <li>Link không chính xác</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setLocation('/forgot-password')}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Yêu cầu link mới
            </button>

            <button
              onClick={() => setLocation('/login')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <FaCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Đặt lại mật khẩu thành công!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Bạn có thể đăng nhập với mật khẩu mới.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-700">
              <p className="font-medium">Mật khẩu đã được cập nhật</p>
              <p className="mt-1">Tự động chuyển về trang đăng nhập sau 3 giây...</p>
            </div>
          </div>

          <button
            onClick={() => setLocation('/login')}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Đang kiểm tra link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <FaLock className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Đặt mật khẩu mới</h2>
          <p className="mt-2 text-sm text-gray-600">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu mới *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu mới',
                    minLength: {
                      value: 8,
                      message: 'Mật khẩu phải có ít nhất 8 ký tự'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Độ mạnh mật khẩu</span>
                    <span className={getPasswordStrengthColor(passwordStrength.score)}>
                      {passwordStrength.message}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? 'bg-red-500' :
                        passwordStrength.score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: getPasswordStrengthWidth(passwordStrength.score) }}
                    />
                  </div>
                  {passwordStrength.score < 3 && (
                    <p className="mt-1 text-xs text-orange-600">
                      Khuyến nghị: Sử dụng mật khẩu mạnh hơn để bảo mật tài khoản
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu mới *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (value) => value === password || 'Mật khẩu xác nhận không khớp'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Yêu cầu mật khẩu:
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex items-center">
                <span className={`mr-2 ${password && password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  {password && password.length >= 8 ? '✓' : '○'}
                </span>
                Ít nhất 8 ký tự
              </div>
              <div className="flex items-center">
                <span className={`mr-2 ${password && /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {password && /[A-Z]/.test(password) ? '✓' : '○'}
                </span>
                Có chữ cái viết hoa
              </div>
              <div className="flex items-center">
                <span className={`mr-2 ${password && /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {password && /[a-z]/.test(password) ? '✓' : '○'}
                </span>
                Có chữ cái viết thường
              </div>
              <div className="flex items-center">
                <span className={`mr-2 ${password && /[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {password && /[0-9]/.test(password) ? '✓' : '○'}
                </span>
                Có số
              </div>
              <div className="flex items-center">
                <span className={`mr-2 ${password && /[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {password && /[^A-Za-z0-9]/.test(password) ? '✓' : '○'}
                </span>
                Có ký tự đặc biệt
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !password || passwordStrength.score < 3}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>

          {/* Help */}
          <div className="text-center">
            <span className="text-sm text-gray-500">
              Gặp vấn đề?{' '}
              <a href="mailto:support@hutech.edu.vn" className="text-indigo-600 hover:text-indigo-500">
                Liên hệ IT Support
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 