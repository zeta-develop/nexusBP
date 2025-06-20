import React, { useState, useEffect, useCallback } from 'react';
import SubscriptionService from '../services/SubscriptionService';
import SubscriptionForm from '../components/SubscriptionForm';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');


  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let response;
      if (filterUserId) {
        response = await SubscriptionService.getSubscriptionsByUserId(filterUserId);
      } else {
        response = await SubscriptionService.getAllSubscriptions(); // Admin gets all
      }
      setSubscriptions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subscriptions.');
      console.error("Fetch subscriptions error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterUserId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCreateSubscription = async (subscriptionData) => {
    setError('');
    try {
      await SubscriptionService.createSubscription(subscriptionData);
      fetchSubscriptions();
      setShowCreateForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription.');
      console.error("Create subscription error:", err);
    }
  };

  const handleUpdateSubscription = async (subscriptionData) => {
    if (!editingSubscription) return;
    setError('');
    try {
      await SubscriptionService.updateSubscription(editingSubscription.id, subscriptionData);
      setEditingSubscription(null);
      fetchSubscriptions();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update subscription ${editingSubscription.id}.`);
      console.error("Update subscription error:", err);
    }
  };

  const openEditForm = (subscription) => {
    setEditingSubscription(subscription);
    setShowCreateForm(false);
  };

  if (isLoading) return <p>Loading subscriptions...</p>;

  return (
    <div className="page-container">
      <h2>Manage Subscriptions (Admin)</h2>
      {error && <p className="error-message">{error}</p>}

      <div>
        <label htmlFor="filterUserId">Filter by User ID: </label>
        <input
          type="text"
          id="filterUserId"
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          placeholder="Enter User ID or leave blank for all"
        />
        <button onClick={fetchSubscriptions} style={{marginLeft: '5px'}}>Filter</button>
      </div>

      <hr />

      {!editingSubscription && !showCreateForm && (
        <button onClick={() => { setShowCreateForm(true); setEditingSubscription(null); }}>Create New Subscription</button>
      )}

      {showCreateForm && (
        <div>
          <h3>Create Subscription</h3>
          <SubscriptionForm onSubmit={handleCreateSubscription} initialData={{ userId: filterUserId }} />
          <button onClick={() => setShowCreateForm(false)}>Cancel</button>
        </div>
      )}

      {editingSubscription && (
        <div>
          <h3>Edit Subscription ID: {editingSubscription.id}</h3>
          <SubscriptionForm onSubmit={handleUpdateSubscription} initialData={editingSubscription} isEdit={true} />
          <button onClick={() => setEditingSubscription(null)}>Cancel Edit</button>
        </div>
      )}

      <h3>Existing Subscriptions</h3>
      {subscriptions.length === 0 && !isLoading && <p>No subscriptions found for this filter.</p>}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>User Email</th>
            <th>License ID</th>
            <th>Plan Type</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id}>
              <td>{sub.id}</td>
              <td>{sub.userId}</td>
              <td>{sub.user?.email || 'N/A'}</td>
              <td>{sub.licenseId || 'N/A'}</td>
              <td>{sub.planType}</td>
              <td>{sub.status}</td>
              <td>{new Date(sub.startDate).toLocaleDateString()}</td>
              <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</td>
              <td>
                <button onClick={() => openEditForm(sub)}>Edit</button>
                {/* Delete subscription might be added later if needed */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionsPage;
