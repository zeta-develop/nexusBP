import React, { useState, useEffect, useCallback } from 'react';
import UserService from '../services/UserService';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await UserService.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
      console.error("Fetch users error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isLoading) return <p>Loading users...</p>;

  return (
    <div className="page-container">
      <h2>Manage Users (Admin)</h2>
      {error && <p className="error-message">{error}</p>}

      <h3>All Users</h3>
      {users.length === 0 && !isLoading && <p>No users found.</p>}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Licenses Count</th>
            <th>Subscriptions Count</th>
            {/* Add Actions column if needed later */}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleString()}</td>
              <td>{new Date(user.updatedAt).toLocaleString()}</td>
              <td>{user._count?.licenses || 0}</td>
              <td>{user._count?.subscriptions || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
