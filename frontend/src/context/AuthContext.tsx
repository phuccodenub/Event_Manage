import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { User } from '../types';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
      } catch (err) {
        setError('Failed to load user');
        setLocation('/login');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [setLocation]);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
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
