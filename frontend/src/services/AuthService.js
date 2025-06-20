import apiClient from './api';

const API_URL = '/api/auth'; // Assuming the frontend is served such that /api proxies to backend

const register = async (email, password, role = 'CLIENT') => {
  return apiClient.post(`${API_URL}/register`, {
    email,
    password,
    role,
  });
};

const login = async (email, password) => {
  const response = await apiClient.post(`${API_URL}/login`, {
    email,
    password,
  });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const getToken = () => {
  return localStorage.getItem('token');
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
};

export default AuthService;
