'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthResponse {
  success: boolean;
  message: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me', { withCredentials: true });
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', {
        username,
        email,
        password
      }, { withCredentials: true });
      
      setUser(response.data.user);
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      console.error('Login error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      }, { withCredentials: true });
      
      setUser(response.data.user);
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const promoteUser = async (username: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/users/promote', { username }, { withCredentials: true });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      console.error('Promotion error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Promotion failed';
      return { success: false, message };
    }
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isAuthenticated = (): boolean => {
    return user !== null;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    promoteUser,
    isAdmin,
    isAuthenticated,
  };
};