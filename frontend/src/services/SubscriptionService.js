import apiClient from './api';

// Assuming default axios headers include x-auth-token set by AuthContext

const getAllSubscriptions = () => { // For Admin
  return apiClient.get('/api/subscriptions');
};

const getSubscriptionsByUserId = (userId) => { // For Admin to get specific user's subs
  return apiClient.get(`/api/users/${userId}/subscriptions`);
};

const getMySubscriptions = () => { // For logged-in user's own subscriptions
  return apiClient.get('/api/subscriptions/mine');
};

const createSubscription = (subscriptionData) => {
  // { userId, licenseId (optional), planType, endDate (optional), status (optional) }
  return apiClient.post('/api/subscriptions', subscriptionData);
};

const updateSubscription = (id, subscriptionData) => {
  // { planType, endDate, status, licenseId }
  return apiClient.put(`/api/subscriptions/${id}`, subscriptionData);
};

// No delete subscription endpoint defined in backend plan, can be added if needed.

const SubscriptionService = {
  getAllSubscriptions,
  getSubscriptionsByUserId,
  getMySubscriptions,
  createSubscription,
  updateSubscription,
};

export default SubscriptionService;
