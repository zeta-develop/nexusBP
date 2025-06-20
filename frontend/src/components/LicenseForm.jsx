import React, { useState, useEffect } from 'react';

const LicenseForm = ({ onSubmit, initialData = {}, isEdit = false }) => {
  const [userId, setUserId] = useState(initialData.userId || '');
  const [status, setStatus] = useState(initialData.status || 'INACTIVE');
  const [expiresAt, setExpiresAt] = useState(
    initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : ''
  );
  const [productId, setProductId] = useState(initialData.productId || ''); // Assuming productId is relevant

  useEffect(() => {
    if (isEdit && initialData) {
      setUserId(initialData.userId || '');
      setStatus(initialData.status || 'INACTIVE');
      setExpiresAt(initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : '');
      setProductId(initialData.productId || '');
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const licenseData = {
      status,
      expiresAt: expiresAt || null, // Send null if empty
    };
    if (userId) licenseData.userId = parseInt(userId); // Only include if provided
    if (productId) licenseData.productId = parseInt(productId); // Only include if provided

    // For edit, we might not want to send userId if it's not changeable
    // Or the backend handles it. For now, sending what's in form.
    onSubmit(licenseData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {!isEdit && ( // Only show userId field for creation, assuming admin context
        <div>
          <label htmlFor="userId">User ID (for whom to create):</label>
          <input
            type="number"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Optional: User ID"
          />
        </div>
      )}
      <div>
        <label htmlFor="status">Status:</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="INACTIVE">Inactive</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>
      <div>
        <label htmlFor="expiresAt">Expires At (YYYY-MM-DD):</label>
        <input
          type="date"
          id="expiresAt"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="productId">Product ID (optional):</label>
        <input
          type="number"
          id="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Optional: Product ID"
        />
      </div>
      <button type="submit">{isEdit ? 'Update License' : 'Create License'}</button>
    </form>
  );
};

export default LicenseForm;
