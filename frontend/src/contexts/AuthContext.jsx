import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';
import axios from 'axios'; // For setting default headers

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [token, setToken] = useState(AuthService.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!AuthService.getToken());

  useEffect(() => {
    const currentToken = AuthService.getToken();
    if (currentToken) {
      axios.defaults.headers.common['x-auth-token'] = currentToken;
      setToken(currentToken);
      setUser(AuthService.getCurrentUser());
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      axios.defaults.headers.common['x-auth-token'] = data.token;
      return data;
    } catch (error) {
      logout(); // Clear any partial state on error
      throw error;
    }
  };

  const register = async (email, password, role) => {
    try {
      // Optionally log in user directly after registration
      const response = await AuthService.register(email, password, role);
      // If backend doesn't auto-login, user needs to login separately
      return response;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
