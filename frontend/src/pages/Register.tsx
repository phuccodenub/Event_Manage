import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle, XCircle, Building } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface RegisterForm {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  studentId?: string;
  department?: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  length: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSymbols: false,
    length: 0
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm<RegisterForm>();

  const password = watch('password');

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/departments`);
        if (response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        // Fallback departments if API fails
        setDepartments([
          { _id: '1', name: 'Công nghệ thông tin', code: 'CNTT' },
          { _id: '2', name: 'Kỹ thuật phần mềm', code: 'KTPM' },
          { _id: '3', name: 'Hệ thống thông tin', code: 'HTTT' },
          { _id: '4', name: 'An toàn thông tin', code: 'ATTT' },
          { _id: '5', name: 'Khoa học máy tính', code: 'KHMT' }
        ]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  // Local password strength checker
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        feedback: [],
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumbers: false,
        hasSymbols: false,
        length: 0
      });
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const length = password.length;

    let score = 0;
    const feedback: string[] = [];

    // Tính điểm dựa trên độ dài
    if (length >= 8) score += 1;
    else feedback.push('Mật khẩu nên có ít nhất 8 ký tự');

    if (length >= 12) score += 1;

    // Tính điểm dựa trên độ phức tạp
    if (hasUpperCase) score += 1;
    else feedback.push('Thêm chữ cái viết hoa');

    if (hasLowerCase) score += 1;
    else feedback.push('Thêm chữ cái viết thường');

    if (hasNumbers) score += 1;
    else feedback.push('Thêm số');

    if (hasSymbols) score += 1;
    else feedback.push('Thêm ký tự đặc biệt');

    setPasswordStrength({
      score: Math.min(score, 4),
      feedback,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSymbols,
      length
    });
  };

  React.useEffect(() => {
    if (password) {
      checkPasswordStrength(password);
    }
  }, [password]);

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        studentId: data.studentId,
        department: data.department,
        role: 'student' // Mặc định là sinh viên
      });

      if (response.data.success) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        navigate('/login');
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi đăng ký');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký';
      toast.error(errorMessage);
      
      // Handle specific field errors
      if (error.response?.data?.details) {
        Object.keys(error.response.data.details).forEach((field) => {
          setError(field as keyof RegisterForm, {
            type: 'server',
            message: error.response.data.details[field]
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score === 0) return 'bg-gray-300';
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score === 0) return 'Chưa nhập';
    if (score <= 1) return 'Yếu';
    if (score <= 2) return 'Trung bình';
    if (score <= 3) return 'Mạnh';
    return 'Rất mạnh';
  };

  return (
    <div className="flex h-screen bg-orange-600">
      {/* Left Panel - Info */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-orange-600 text-white p-8 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        
        <div className="relative z-10 w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Tham Gia HUTECH</h1>
          <p className="text-lg opacity-90 mb-8">
            Khám phá và tham gia các sự kiện học thuật, giao lưu và hoạt động ngoại khóa thú vị tại Đại học Công nghệ TP.HCM
          </p>
          
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Lợi ích khi tham gia</h2>
            <ul className="text-left space-y-2 text-sm">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                Tham gia các sự kiện học thuật chất lượng
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                Kết nối với sinh viên và giảng viên
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                Nhận chứng chỉ tham gia sự kiện
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                Cập nhật thông tin mới nhất từ trường
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <img 
              src="https://media.loveitopcdn.com/3807/logo-hutech-2.png" 
              alt="Hutech Logo" 
              className="h-16 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h2>
            <p className="text-gray-600">Tham gia HUTECH Event Management</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Họ và tên *
              </label>
              <div className="relative group">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  {...register('fullName', {
                    required: 'Vui lòng nhập họ và tên',
                    minLength: {
                      value: 2,
                      message: 'Họ tên phải có ít nhất 2 ký tự'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Tên đăng nhập *
              </label>
              <div className="relative group">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  {...register('username', {
                    required: 'Vui lòng nhập tên đăng nhập',
                    minLength: {
                      value: 3,
                      message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="nguyenvana"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Vui lòng nhập email hợp lệ'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="nguyenvana@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Student ID & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  MSSV (nếu có)
                </label>
                <input
                  {...register('studentId')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="2180123456"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative group">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    {...register('phoneNumber')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="0901234567"
                  />
                </div>
              </div>
            </div>

            {/* Department Dropdown */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Khoa (nếu có)
              </label>
              <div className="relative group">
                <Building className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10" />
                <select
                  {...register('department')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all appearance-none bg-white"
                  disabled={loadingDepartments}
                >
                  <option value="">Chọn khoa</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {loadingDepartments && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Mật khẩu *
              </label>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}

              {/* Password Strength */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Độ mạnh mật khẩu:</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.score === 0 ? 'text-gray-500' :
                      passwordStrength.score <= 1 ? 'text-red-600' :
                      passwordStrength.score <= 2 ? 'text-orange-600' :
                      passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {passwordStrength.feedback.slice(0, 3).map((feedback, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                          {feedback}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">
                Xác nhận mật khẩu *
              </label>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all ${
                    watch('confirmPassword') && password !== watch('confirmPassword')
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
              {watch('confirmPassword') && password !== watch('confirmPassword') && (
                <p className="mt-1 text-sm text-red-600">Mật khẩu xác nhận không khớp</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || password !== watch('confirmPassword')}
              className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                'Đăng ký tài khoản'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-orange-600 hover:text-orange-700">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 