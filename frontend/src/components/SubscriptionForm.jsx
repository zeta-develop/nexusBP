import React, { useState, useEffect } from 'react';

const SubscriptionForm = ({ onSubmit, initialData = {}, isEdit = false }) => {
  const [userId, setUserId] = useState(initialData.userId || '');
  const [licenseId, setLicenseId] = useState(initialData.licenseId || '');
  const [planType, setPlanType] = useState(initialData.planType || '');
  const [status, setStatus] = useState(initialData.status || 'INACTIVE');
  const [endDate, setEndDate] = useState(
    initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''
  );

  useEffect(() => {
    if (isEdit && initialData) {
      setUserId(initialData.userId || '');
      setLicenseId(initialData.licenseId || '');
      setPlanType(initialData.planType || '');
      setStatus(initialData.status || 'INACTIVE');
      setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '');
    } else if (!isEdit) { // Reset for create form
      setUserId(initialData.userId || ''); // Can prefill if creating for specific user
      setLicenseId('');
      setPlanType('');
      setStatus('INACTIVE');
      setEndDate('');
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subscriptionData = {
      planType,
      status,
      endDate: endDate || null, // Send null if empty
    };
    // Only include userId if creating and it's provided (admins can create for others)
    // For editing, userId is usually not changed via this form.
    if (!isEdit && userId) subscriptionData.userId = parseInt(userId);
    if (licenseId) subscriptionData.licenseId = parseInt(licenseId); // Optional

    onSubmit(subscriptionData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* For admin creating, userId might be needed. For user creating their own, it's from context. */}
      {!isEdit && (
         <div>
          <label htmlFor="userId">User ID (for whom to create):</label>
          <input
            type="number"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            required // Usually required for admin creation
          />
        </div>
      )}
      <div>
        <label htmlFor="planType">Plan Type:</label>
        <input
          type="text"
          id="planType"
          value={planType}
          onChange={(e) => setPlanType(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="licenseId">License ID (optional):</label>
        <input
          type="number"
          id="licenseId"
          value={licenseId}
          onChange={(e) => setLicenseId(e.target.value)}
          placeholder="Optional License ID"
        />
      </div>
      <div>
        <label htmlFor="status">Status:</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="INACTIVE">Inactive</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELED">Canceled</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="TRIALING">Trialing</option>
        </select>
      </div>
      <div>
        <label htmlFor="endDate">End Date (YYYY-MM-DD):</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <button type="submit">{isEdit ? 'Update Subscription' : 'Create Subscription'}</button>
    </form>
  );
};

export default SubscriptionForm;
