import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import authService from '../services/authService';
import eventService from '../services/eventService';
import { Mail, Lock, Calendar, Clock, MapPin } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import FacebookLogin from '@greatsumini/react-facebook-login';
import { getEventStartDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { events, setEvents } = useEvents();

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      const allEvents = await eventService.getAllEvents();
      setEvents(allEvents);
    };

    fetchUpcomingEvents();
  }, [setEvents]);

  const upcomingEvents = events
    .filter(event => {
      if (event.eventDays && event.eventDays.length > 0) {
        const startDate = getEventStartDate(event.eventDays);
        return startDate && startDate > new Date();
      }
      if (event.startDate) {
        return new Date(event.startDate) > new Date();
      }
      return false;
    })
    .sort((a, b) => {
      const startDateA = a.eventDays ? getEventStartDate(a.eventDays) : new Date(a.startDate!);
      const startDateB = b.eventDays ? getEventStartDate(b.eventDays) : new Date(b.startDate!);
      if (!startDateA || !startDateB) return 0;
      return startDateA.getTime() - startDateB.getTime();
    })
    .slice(0, 3)
    .map(event => {
      const startDate = event.eventDays ? getEventStartDate(event.eventDays) : new Date(event.startDate!);
      const date = startDate || new Date();
      
      return {
        ...event,
        formattedDate: {
          day: date.getDate().toString().padStart(2, '0'),
          month: (date.getMonth() + 1).toString().padStart(2, '0'),
          year: date.getFullYear()
        },
        time: date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

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
      console.error('Login error:', err);
      // Xử lý các trường hợp lỗi khác nhau
      if (err.status === 401) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
      } else if (err.status === 429) {
        setError("Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau");
      } else {
        setError(err.message || "Đăng nhập thất bại, vui lòng thử lại sau");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received');
      }
      
      const decoded: any = jwtDecode(credentialResponse.credential);
      console.log('Decoded Google token:', decoded);

      // Convert Google profile picture URL to use our proxy if it exists
      if (decoded.picture) {
        decoded.picture = decoded.picture.replace(
          'https://lh3.googleusercontent.com',
          '/google-profile'
        );
      }

      const response = await authService.googleLogin(credentialResponse.credential);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
    }
  };

  const handleFacebookSuccess = async (response: any) => {
    try {
      console.log('Facebook login success:', response);
      await authService.facebookLogin(response.accessToken);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Facebook login error:', err);
      setError(err.response?.data?.message || 'Đăng nhập Facebook thất bại');
    }
  };

  return (
    <div className="flex h-screen bg-orange-600">
      {/* Left Panel */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-orange-600 text-white p-8 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Event Hutech</h1>
            <p className="text-lg opacity-90">
              Tham gia các sự kiện học thuật, giao lưu và hoạt động ngoại khóa tại Đại học Công nghệ TP.HCM
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Sự kiện sắp diễn ra
            </h2>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="bg-white p-4 rounded-lg flex items-center shadow-sm hover:shadow transition-all">
                  <div className="flex items-center justify-center w-14 h-14 bg-orange-100 rounded-lg mr-4">
                    <div className="text-center">
                      <p className="text-orange-600">{event.formattedDate.day}/{event.formattedDate.month}</p>
                      <p className="text-lg font-bold text-orange-600">{event.formattedDate.year}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold text-orange-900 truncate">{event.title}</p>
                    <p className="text-sm flex items-center text-orange-700">
                      <Clock className="mr-1" size={14} /> 
                      {event.time}
                      {event.location?.physical?.address && (
                        <>
                          <span className="mx-1">-</span>
                          <MapPin className="mr-1" size={14} />
                          <span className="truncate">
                            {event.location.physical.room 
                              ? `${event.location.physical.address} - ${event.location.physical.room}`
                              : event.location.physical.address
                            }
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-center text-orange-100 py-4">
                  Không có sự kiện nào sắp diễn ra
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img 
              src="https://media.loveitopcdn.com/3807/logo-hutech-2.png" 
              alt="Hutech Logo" 
              className="h-20 mx-auto mb-6 transform hover:scale-105 transition-transform" 
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại!</h2>
            <p className="text-gray-600">Đăng nhập để tham gia sự kiện tại HUTECH</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 animate-shake">
              <svg className="h-5 w-5" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  Email hoặc MSSV
                </label>
                <div className="relative group">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="Nhập email hoặc MSSV"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="Nhập mật khẩu"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <a href="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-500/20 transition-all font-medium"
            >
              Đăng nhập
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Hoặc đăng nhập với</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => {
                const googleBtn = document.querySelector('[role="button"]');
                if (googleBtn instanceof HTMLElement) {
                  googleBtn.click();
                }
              }}
            >
              <img src="/icons/google.svg" alt="Google" className="h-6 w-6" />
              <div style={{ width: 0, height: 0, overflow: 'hidden' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error('Đăng nhập Google thất bại');
                  }}
                  type="standard"
                  theme="filled_black"
                  size="medium"
                  useOneTap={false}
                />
              </div>
            </button>
            <FacebookLogin
              appId={import.meta.env.VITE_FACEBOOK_APP_ID}
              onSuccess={handleFacebookSuccess}
              onFail={(error) => {
                console.error('Facebook Login Failed:', error);
                setError('Đăng nhập Facebook thất bại');
              }}
              scope="public_profile,email"
              className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <img src="/icons/facebook.svg" alt="Facebook" className="h-6 w-6" />
            </FacebookLogin>
            {/* <button className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <img src="/icons/microsoft.svg" alt="Microsoft" className="h-6 w-6" />
            </button> */}
          </div>

          <p className="text-center text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <a href="#" className="font-medium text-orange-600 hover:text-orange-700">
              Thì thôi đừng đăng nhập nữa
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
