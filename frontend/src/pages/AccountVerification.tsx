import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, RefreshCw, ArrowRight, Home } from 'lucide-react';
import { toast } from 'react-toastify';

const AccountVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token xác thực không hợp lệ');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/v1/account/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email đã được xác thực thành công!');
        
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        if (result.error?.includes('hết hạn') || result.error?.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(result.error || 'Có lỗi xảy ra khi xác thực email');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setResendLoading(true);

    try {
      const response = await fetch('/api/v1/account/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email xác thực đã được gửi lại!');
        setStatus('loading');
        setMessage('Vui lòng kiểm tra email và click vào link xác thực');
      } else {
        toast.error(result.error || 'Có lỗi khi gửi email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setResendLoading(false);
    }
  };

  const renderSuccessContent = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Xác Thực Thành Công! 🎉
      </h1>
      
      <p className="text-gray-600 mb-6 text-lg">
        {message}
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <p className="text-green-800 text-sm">
          Bạn sẽ được chuyển hướng đến trang đăng nhập sau 3 giây...
        </p>
      </div>
      
      <div className="space-y-3">
        <Link
          to="/login"
          className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Đăng Nhập Ngay
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        
        <Link
          to="/"
          className="inline-flex items-center justify-center w-full text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          <Home className="mr-2 h-4 w-4" />
          Về Trang Chủ
        </Link>
      </div>
    </motion.div>
  );

  const renderErrorContent = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="bg-red-100 p-4 rounded-full">
          <XCircle className="h-16 w-16 text-red-600" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Xác Thực Thất Bại
      </h1>
      
      <p className="text-gray-600 mb-6 text-lg">
        {message}
      </p>
      
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p className="text-red-800 text-sm">
          Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={handleResendVerification}
          disabled={resendLoading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {resendLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang gửi...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Gửi Lại Email Xác Thực
            </>
          )}
        </button>
        
        <Link
          to="/register"
          className="inline-flex items-center justify-center w-full text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Đăng Ký Lại
        </Link>
      </div>
    </motion.div>
  );

  const renderExpiredContent = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="bg-orange-100 p-4 rounded-full">
          <Mail className="h-16 w-16 text-orange-600" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Link Đã Hết Hạn
      </h1>
      
      <p className="text-gray-600 mb-6 text-lg">
        Link xác thực email đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực mới.
      </p>
      
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <p className="text-orange-800 text-sm">
          Vì lý do bảo mật, link xác thực chỉ có hiệu lực trong thời gian giới hạn.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={handleResendVerification}
          disabled={resendLoading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {resendLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang gửi...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Gửi Lại Email Xác Thực
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  const renderLoadingContent = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Đang Xác Thực Email...
      </h1>
      
      <p className="text-gray-600 text-lg">
        Vui lòng đợi trong giây lát
      </p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100"
      >
        {status === 'loading' && renderLoadingContent()}
        {status === 'success' && renderSuccessContent()}
        {status === 'error' && renderErrorContent()}
        {status === 'expired' && renderExpiredContent()}
      </motion.div>
    </div>
  );
};

export default AccountVerification; 