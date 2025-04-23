import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";
import authService from '../services/authService';

const Router = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null); // Define role state
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const userInfo = authService.getProfile();
      if (userInfo) {
        setIsAuthenticated(true);
        setRole(userInfo.role || null);
      } else {
        setIsAuthenticated(false);
        setRole(null);
        if (!["/login", "/register"].includes(location.pathname)) {
          navigate("/login", { replace: true });
        }
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <PublicRoutes /> : <PublicRoutes />;
};

export default Router;