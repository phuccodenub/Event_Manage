import React, { createContext, useContext } from 'react';
import { useLocation } from "wouter";
import { User } from '../types';
import { useUserData } from '../hooks/useUserData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetchUserData: () => Promise<unknown>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  refetchUserData: async () => undefined,
  isAuthenticated: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setLocation] = useLocation();
  const { user, loading, error, refetchUserData } = useUserData();
  
  // Xác định xem người dùng đã xác thực hay chưa
  const isAuthenticated = !!user;

  // Redirect to login if auth fails
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    if (!loading && 
        !user && 
        !currentPath.includes('/login') && 
        !currentPath.includes('/register')) {
      console.log('Redirecting to login page - no authenticated user found');
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  // Cast to ensure user is either User or null (not undefined)
  const userData: User | null = user || null;

  return (
    <AuthContext.Provider value={{ 
      user: userData, 
      loading, 
      error, 
      refetchUserData,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
