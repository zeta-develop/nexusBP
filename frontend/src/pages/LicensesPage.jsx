import React, { useState, useEffect, useCallback } from 'react';
import LicenseService from '../services/LicenseService';
import LicenseForm from '../components/LicenseForm'; // Assuming LicenseForm is for creation here
import { Link } from 'react-router-dom'; // For navigation to detail/edit pages

const LicensesPage = () => {
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // State for editing a license (simplified, could be a modal or separate page)
  const [editingLicense, setEditingLicense] = useState(null);

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await LicenseService.getLicenses();
      setLicenses(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch licenses.');
      console.error("Fetch licenses error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handleCreateLicense = async (licenseData) => {
    setError('');
    try {
      await LicenseService.createLicense(licenseData);
      fetchLicenses(); // Refresh list
      setShowCreateForm(false); // Hide form
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create license.');
      console.error("Create license error:", err);
    }
  };

  const handleUpdateLicense = async (licenseData) => {
    if (!editingLicense) return;
    setError('');
    try {
      await LicenseService.updateLicense(editingLicense.id, licenseData);
      setEditingLicense(null); // Close edit form/modal
      fetchLicenses(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update license ${editingLicense.id}.`);
      console.error("Update license error:", err);
    }
  };

  const handleDeleteLicense = async (licenseId) => {
    if (!window.confirm(`Are you sure you want to delete license ID ${licenseId}?`)) return;
    setError('');
    try {
      await LicenseService.deleteLicense(licenseId);
      fetchLicenses(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || `Failed to delete license ${licenseId}.`);
      console.error("Delete license error:", err);
    }
  };

  const openEditForm = (license) => {
    setEditingLicense(license);
    setShowCreateForm(false); // Ensure create form is hidden
  };

  if (isLoading) return <p>Loading licenses...</p>;

  return (
    <div className="page-container">
      <h2>Manage Licenses (Admin)</h2>
      {error && <p className="error-message">{error}</p>}

      {!editingLicense && !showCreateForm && (
        <button onClick={() => { setShowCreateForm(true); setEditingLicense(null); }}>Create New License</button>
      )}

      {showCreateForm && (
        <div>
          <h3>Create License</h3>
          <LicenseForm onSubmit={handleCreateLicense} />
          <button onClick={() => setShowCreateForm(false)}>Cancel</button>
        </div>
      )}

      {editingLicense && (
        <div>
          <h3>Edit License ID: {editingLicense.id} (Key: {editingLicense.licenseKey})</h3>
          <LicenseForm onSubmit={handleUpdateLicense} initialData={editingLicense} isEdit={true} />
          <button onClick={() => setEditingLicense(null)}>Cancel Edit</button>
        </div>
      )}

      <h3>Existing Licenses</h3>
      {licenses.length === 0 && !isLoading && <p>No licenses found.</p>}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>License Key</th>
            <th>User ID</th>
            <th>User Email</th>
            <th>Status</th>
            <th>Expires At</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((license) => (
            <tr key={license.id}>
              <td>{license.id}</td>
              <td>{license.licenseKey}</td>
              <td>{license.userId || 'N/A'}</td>
              <td>{license.user?.email || 'N/A'}</td>
              <td>{license.status}</td>
              <td>{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'N/A'}</td>
              <td>
                {license.grantedProducts?.map(gp => gp.product.name).join(', ') || 'None'}
              </td>
              <td>
                <button onClick={() => openEditForm(license)}>Edit</button>
                <button onClick={() => handleDeleteLicense(license.id)} style={{marginLeft: '5px'}}>Delete</button>
                {/* <Link to={`/admin/licenses/${license.id}`}>View</Link> Placeholder for detail view */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LicensesPage;
