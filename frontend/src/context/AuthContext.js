import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load user on mount
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    const { token: newToken, ...user } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const sendReminders = async (reminderData) => {
    try {
      const res = await api.post('/api/users/send-reminders');
      return res.data;
    } catch (error) {
      // if token expired or unauthorized, clear auth state
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
      throw error;
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const res = await api.post('/api/users/send-sms-reminders');
      return res.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
      throw error;
    }
  };

  // Note: add `sendReminders` to the AuthContext.Provider value so consumers can call it.

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser, sendReminders, sendMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

