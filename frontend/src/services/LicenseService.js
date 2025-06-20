import apiClient from './api';

const API_URL = '/api/licenses'; // Assuming default axios headers include x-auth-token

const getLicenses = () => {
  return apiClient.get(API_URL);
};

const getLicenseById = (id) => {
  return apiClient.get(`${API_URL}/${id}`);
};

const createLicense = (licenseData) => {
  // licenseData should include { userId (optional), status, expiresAt (optional), productId (optional) }
  return apiClient.post(API_URL, licenseData);
};

const updateLicense = (id, licenseData) => {
  // licenseData might include { status, expiresAt }
  return apiClient.put(`${API_URL}/${id}`, licenseData);
};

const deleteLicense = (id) => {
  return apiClient.delete(`${API_URL}/${id}`);
};

// We might also need a validateLicense function if admins/UI needs to check a key
const validateLicenseKey = (licenseKey) => {
  return apiClient.post(`${API_URL}/validate`, { licenseKey });
};


const LicenseService = {
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  validateLicenseKey,
};

export default LicenseService;
