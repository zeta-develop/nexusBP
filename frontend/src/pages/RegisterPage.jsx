import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Or just AuthService directly if not auto-logging in
import AuthService from '../services/AuthService';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENT'); // Default role
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // const { register } = useAuth(); // If register in AuthContext also logs in
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      // Using AuthService directly for registration
      await AuthService.register(email, password, role);
      setMessage('Registration successful! Please login.');
      // navigate('/login'); // Optionally redirect to login
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
      console.error("Registration error:", err);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="role">Role:</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="CLIENT">Client</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
