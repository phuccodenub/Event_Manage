import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { FaCheckCircle, FaExclamationTriangle, FaEnvelope, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const EmailVerification: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [resendLoading, setResendLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Extract token from URL path
  const token = location.split('/').pop();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/account/verify-email/${token}`);
        
        if (response.data.success) {
          setVerificationStatus('success');
          setUserEmail(response.data.data?.email || '');
          toast.success('Xác thực email thành công!');
        } else {
          setVerificationStatus('error');
        }
      } catch (error: any) {
        console.error('Email verification failed:', error);
        
        if (error.response?.status === 400 && error.response?.data?.error?.includes('expired')) {
          setVerificationStatus('expired');
          setUserEmail(error.response?.data?.email || '');
        } else {
          setVerificationStatus('error');
        }
        
        const errorMessage = error.response?.data?.error || 'Xác thực email thất bại';
        toast.error(errorMessage);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error('Không tìm thấy thông tin email');
      return;
    }

    setResendLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/account/resend-verification`, {
        email: userEmail
      });
      
      toast.success('Email xác thực mới đã được gửi!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi gửi lại email';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaSpinner className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Đang xác thực email...</h2>
            <p className="mt-2 text-sm text-gray-600">
              Vui lòng chờ trong giây lát
            </p>
          </div>
        );

      case 'success':
        return (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Xác thực thành công!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Email của bạn đã được xác thực thành công.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaCheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Tài khoản đã được kích hoạt
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của hệ thống.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setLocation('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Đăng nhập ngay
              </button>
              
              <button
                onClick={() => setLocation('/')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Về trang chủ
              </button>
            </div>
          </>
        );

      case 'expired':
        return (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Link đã hết hạn</h2>
              <p className="mt-2 text-sm text-gray-600">
                Link xác thực email đã hết hạn hoặc đã được sử dụng.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Cần gửi lại email xác thực
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Link xác thực chỉ có hiệu lực trong 24 giờ. Vui lòng yêu cầu gửi lại email mới.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || !userEmail}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
              </button>
              
              <button
                onClick={() => setLocation('/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </>
        );

      case 'error':
      default:
        return (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Xác thực thất bại</h2>
              <p className="mt-2 text-sm text-gray-600">
                Không thể xác thực email của bạn.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">
                <p className="font-medium">Có thể do các nguyên nhân sau:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Link không hợp lệ hoặc đã bị thay đổi</li>
                  <li>Email đã được xác thực trước đó</li>
                  <li>Link đã hết hạn (24 giờ)</li>
                  <li>Tài khoản không tồn tại</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setLocation('/register')}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Đăng ký tài khoản mới
              </button>
              
              <button
                onClick={() => setLocation('/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Thử đăng nhập
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {renderContent()}
        
        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FaEnvelope className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Cần hỗ trợ?</span>
            </div>
            <p className="text-sm text-gray-500">
              Liên hệ{' '}
              <a 
                href="mailto:support@hutech.edu.vn" 
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                support@hutech.edu.vn
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 