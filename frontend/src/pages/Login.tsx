import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { Mail, Lock, Calendar, Clock, MapPin } from 'lucide-react';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError("Vui lòng nhập tên tài khoản và mật khẩu");
      return;
    }
    try {
      setError("");
      const user = await authService.login(credentials.username, credentials.password);
      console.log("Login successful, user data:", user);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700">
      {/* Left Panel */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-gradient-to-br from-blue-800 to-blue-900 text-white p-8">
        <h1 className="text-4xl font-bold mb-6">Event Hutech</h1>
        <p className="text-lg text-center mb-8">
          Tham gia các sự kiện học thuật, giao lưu và hoạt động ngoại khóa tại Đại học Công nghệ TP.HCM
        </p>
        <div className="bg-blue-900 bg-opacity-60 p-6 rounded-lg w-full max-w-sm">
          <h2 className="text-xl font-semibold mb-4">Sự kiện sắp diễn ra</h2>
          <div className="bg-white text-blue-900 p-4 rounded-lg mb-4 flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              <div className="text-center">
                <p className="text-sm font-bold text-blue-700">15</p>
                <p className="text-xs text-blue-700">Th4</p>
              </div>
            </div>
            <div>
              <p className="font-bold">Hội thảo AI trong giáo dục</p>
              <p className="text-sm flex items-center">
                <Clock className="mr-1" size={14} /> 8:00 - <MapPin className="ml-1 mr-1" size={14} /> Hội trường A
              </p>
            </div>
          </div>
          <div className="bg-white text-blue-900 p-4 rounded-lg flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              <div className="text-center">
                <p className="text-sm font-bold text-blue-700">20</p>
                <p className="text-xs text-blue-700">Th4</p>
              </div>
            </div>
            <div>
              <p className="font-bold">Workshop Kỹ năng mềm</p>
              <p className="text-sm flex items-center">
                <Clock className="mr-1" size={14} /> 14:00 - <MapPin className="ml-1 mr-1" size={14} /> Phòng 702
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-8 shadow-lg">
        <div className="text-center mb-6">
          <img src="/vite.svg" alt="Hutech Logo" className="h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Đăng nhập</h2>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email hoặc MSSV</label>
            <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <Mail className="text-gray-500 mr-2" size={20} />
              <input
                type="text"
                className="w-full focus:outline-none"
                placeholder="Nhập email hoặc MSSV"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <Lock className="text-gray-500 mr-2" size={20} />
              <input
                type="password"
                className="w-full focus:outline-none"
                placeholder="Nhập mật khẩu"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <a href="/forgot-password" className="text-blue-500 text-sm">Quên mật khẩu?</a>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Đăng nhập
          </button>
        </form>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-500">Hoặc</span>
          <hr className="flex-grow border-gray-300" />
        </div>
        <div className="flex space-x-4">
          <button className="bg-gray-200 p-2 rounded-full hover:bg-gray-300">
            <span className="sr-only">Google</span>
            G
          </button>
          <button className="bg-gray-200 p-2 rounded-full hover:bg-gray-300">
            <span className="sr-only">Facebook</span>
            f
          </button>
          <button className="bg-gray-200 p-2 rounded-full hover:bg-gray-300">
            <span className="sr-only">LinkedIn</span>
            in
          </button>
        </div>
        <p className="mt-4 text-sm">
          Chưa có tài khoản? <a href="/register" className="text-blue-500">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
