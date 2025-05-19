import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";
import authService from '../services/authService';

const Router = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getProfile();
        if (user) {
          setIsAuthenticated(true);
          setUserRole(user.role);
          
          if (location === '/login') {
            setLocation(user.role === 'admin' ? '/' : '/');
          }
          else if (location.startsWith('/admin') && user.role !== 'admin') {
            setLocation('/');
          }
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
          if (!["/login", "/register"].includes(location)) {
            setLocation("/login");
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUserRole(null);
        setLocation("/login");
      }
    };

    checkAuth();
  }, [location, setLocation]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    if (userRole === 'admin') {
      return location.startsWith('/admin') ? <PrivateRoutes /> : <PublicRoutes />;
    }
    return <PublicRoutes />;
  }

  return <PublicRoutes />;
};

export default Router;