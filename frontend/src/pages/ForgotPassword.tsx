import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Key, Link as LinkIcon, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ForgotPasswordForm {
  email: string;
  resetType: 'temp_password' | 'reset_link';
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetType, setResetType] = useState<'temp_password' | 'reset_link'>('reset_link');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ForgotPasswordForm>({
    defaultValues: {
      resetType: 'reset_link'
    }
  });

  const watchedEmail = watch('email');

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/account/forgot-password`, {
        email: data.email,
        resetType: data.resetType
      });

      setSuccess(true);
      
      if (data.resetType === 'temp_password') {
        toast.success('Mật khẩu tạm thời đã được gửi đến email của bạn!');
      } else {
        toast.success('Link đặt lại mật khẩu đã được gửi đến email của bạn!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi gửi yêu cầu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!watchedEmail) {
      toast.error('Vui lòng nhập email trước');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/account/forgot-password`, {
        email: watchedEmail,
        resetType: resetType
      });
      
      toast.success('Email đã được gửi lại!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi gửi lại email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen bg-orange-600">
        {/* Left Panel */}
        <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-orange-600 text-white p-8 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }} />
          </div>
          
          <div className="relative z-10 w-full max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">HUTECH</h1>
            <p className="text-lg opacity-90">
              Event Management System
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white flex flex-col justify-center items-center p-8 md:p-12 lg:p-16">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email đã được gửi!</h2>
              <p className="text-gray-600">
                {resetType === 'temp_password' 
                  ? 'Chúng tôi đã gửi mật khẩu tạm thời đến email của bạn.'
                  : 'Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.'
                }
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Kiểm tra hộp thư của bạn
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      {resetType === 'temp_password' 
                        ? 'Sử dụng mật khẩu tạm thời trong email để đăng nhập, sau đó đổi mật khẩu mới.'
                        : 'Click vào link trong email để đặt mật khẩu mới. Link sẽ hết hạn sau 15 phút.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Đang gửi...' : 'Gửi lại email'}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-orange-600">
      {/* Left Panel */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-orange-600 text-white p-8 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        
        <div className="relative z-10 w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Khôi Phục</h1>
          <p className="text-lg opacity-90 mb-8">
            Lấy lại quyền truy cập vào tài khoản HUTECH của bạn một cách an toàn
          </p>
          
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">2 cách khôi phục</h2>
            <ul className="text-left space-y-2 text-sm">
              <li className="flex items-center">
                <Key className="w-4 h-4 mr-2 text-yellow-300" />
                Mật khẩu tạm thời
              </li>
              <li className="flex items-center">
                <LinkIcon className="w-4 h-4 mr-2 text-blue-300" />
                Link đặt lại mật khẩu
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại đăng nhập
            </Link>
            
            <img 
              src="https://media.loveitopcdn.com/3807/logo-hutech-2.png" 
              alt="Hutech Logo" 
              className="h-16 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h2>
            <p className="text-gray-600">
              Nhập email để lấy lại quyền truy cập tài khoản
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Email HUTECH
              </label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[^\s@]+@hutech\.edu\.vn$/,
                      message: 'Vui lòng sử dụng email @hutech.edu.vn'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="name@hutech.edu.vn"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Reset Type Selection */}
            <div>
              <label className="block font-medium text-gray-700 mb-3">
                Chọn phương thức khôi phục
              </label>
              <div className="space-y-3">
                {/* Reset Link Option */}
                <label className="relative flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      {...register('resetType')}
                      type="radio"
                      value="reset_link"
                      className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      onChange={(e) => setResetType(e.target.value as 'reset_link')}
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <LinkIcon className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-800">Link đặt lại mật khẩu</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Nhận link để tự đặt mật khẩu mới (khuyến nghị)
                    </p>
                  </div>
                </label>

                {/* Temp Password Option */}
                <label className="relative flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      {...register('resetType')}
                      type="radio"
                      value="temp_password"
                      className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      onChange={(e) => setResetType(e.target.value as 'temp_password')}
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Key className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="font-medium text-gray-800">Mật khẩu tạm thời</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Nhận mật khẩu tạm thời để đăng nhập ngay
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </>
              ) : (
                'Gửi yêu cầu khôi phục'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              Cần hỗ trợ?{' '}
              <Link to="/help" className="font-medium text-orange-600 hover:text-orange-700">
                Liên hệ IT Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 