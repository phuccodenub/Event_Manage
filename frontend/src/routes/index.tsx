import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import PublicRoutes from "./publicRoutes";
import PrivateRoutes from "./privateRoutes";
import authService from '../services/authService';
import { isPublicRoute, isSemiPublicRoute, requiresAuth } from '../utils/routeUtils';

const Router = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking auth state for:', location);
      
      const hasToken = authService.isAuthenticated();
      const storedUser = localStorage.getItem('user');
      
      console.log('🔑 Auth check:', { hasToken, hasStoredUser: !!storedUser });
      
      if (hasToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('👤 User from localStorage:', user);
          
          setIsAuthenticated(true);
          setUserRole(user.role);
          
          // Redirect từ login nếu đã đăng nhập
          if (location === '/login') {
            console.log('🔄 Redirecting from login to home...');
            setLocation('/');
            return;
          }
          
          // Verify với server cho protected routes
          if (requiresAuth(location)) {
            try {
              const serverUser = await authService.getProfile();
              if (!serverUser) {
                console.log('❌ Server verification failed');
                setIsAuthenticated(false);
                setUserRole(null);
                setLocation('/login');
                return;
              }
              console.log('✅ Server verification successful');
            } catch (error) {
              console.log('❌ Server verification error:', error);
              setIsAuthenticated(false);
              setUserRole(null);
              setLocation('/login');
              return;
            }
          }
          
        } catch (error) {
          console.error('❌ Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUserRole(null);
          
          if (requiresAuth(location)) {
            setLocation('/login');
          }
        }
      } else {
        console.log('❌ No token or stored user found');
        setIsAuthenticated(false);
        setUserRole(null);
        
        // Redirect về login cho protected routes
        if (requiresAuth(location)) {
          console.log('🔄 Redirecting to login...');
          setLocation('/login');
        }
      }
    };

    checkAuth();
  }, [location, setLocation]);

  // Hiển thị loading cho protected routes
  if (isAuthenticated === null && requiresAuth(location)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Routing logic
  if (location.startsWith('/admin') && isAuthenticated && userRole === 'admin') {
    console.log('🔧 Rendering PrivateRoutes for admin');
    return <PrivateRoutes />;
  }

  console.log('🏠 Rendering PublicRoutes');
  return <PublicRoutes />;
};

export default Router;