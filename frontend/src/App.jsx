import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom'; // Added NavLink
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import LicensesPage from './pages/LicensesPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import UsersPage from './pages/UsersPage';

// Placeholder for HomePage
const HomePage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  return (
    <div className="page-container">
      <h1>Welcome to the License Management System</h1>
      {isAuthenticated ? (
        <div>
          <p>Hello, {user?.email} ({user?.role})</p>
          <button onClick={logout}>Logout</button>
          {user?.role === 'ADMIN' && <p><Link to="/admin">Admin Dashboard</Link></p>}
          {user?.role !== 'ADMIN' && <p><Link to="/my-licenses">My Licenses</Link></p>}
        </div>
      ) : (
        <p>
          <NavLink to="/login">Login</NavLink> or <NavLink to="/register">Register</NavLink>
        </p>
      )}
    </div>
  );
};

const AdminDashboardPage = () => (
  <div className="page-container admin-dashboard">
    <h2>Admin Dashboard</h2>
    <p>This is a protected admin area.</p>
    <ul>
      <li><NavLink to="/admin/users">Manage Users</NavLink></li>
      <li><NavLink to="/admin/licenses">Manage Licenses</NavLink></li>
      <li><NavLink to="/admin/subscriptions">Manage Subscriptions</NavLink></li>
    </ul>
  </div>
);

const MyLicensesPage = () => {
    const {user} = useAuth();
    return (
        <div className="page-container">
            <h2>My Licenses</h2>
            <p>This page will show licenses for {user?.email}.</p>
            {/* TODO: Implement this page properly */}
        </div>
    )
};


function AppContent() {
  const { isAuthenticated, user } = useAuth();
  return (
    <Router>
      <nav> {/* This nav will be styled by index.css */}
        <NavLink to="/">Home</NavLink>
        {!isAuthenticated && <NavLink to="/login">Login</NavLink>}
        {!isAuthenticated && <NavLink to="/register">Register</NavLink>}
        {isAuthenticated && user?.role === 'ADMIN' && <NavLink to="/admin">Admin</Link>}
        {/* Add more common authenticated links here if needed */}
      </nav>
      <div className="main-content-area"> {/* Wrapper for page content */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly={true}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/licenses"
            element={
              <ProtectedRoute adminOnly={true}>
                <LicensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <ProtectedRoute adminOnly={true}>
                <SubscriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-licenses"
            element={
              <ProtectedRoute>
                <MyLicensesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
