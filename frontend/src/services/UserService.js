import apiClient from './api';

// Assuming default axios headers include x-auth-token set by AuthContext

const getUsers = () => { // For Admin
  return apiClient.get('/api/users');
};

// Future functions like updateUserRole(userId, role) could be added here.

const UserService = {
  getUsers,
};

export default UserService;
