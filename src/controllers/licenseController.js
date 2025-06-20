// In-memory store for licenses as a placeholder for DB interaction
const licensesStore = [];
let licenseIdCounter = 1;

// Helper to generate a UUID-like string for license keys
function generateLicenseKey() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// POST /api/licenses - Create a new license
exports.createLicense = async (req, res) => {
    const { userId, status = 'inactive', expiresAt, productId } = req.body; // Assuming productId might be passed

    // Basic validation (can be expanded)
    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    // For admin roles - check req.user.role (assuming authMiddleware adds user to req)
    if (req.user && req.user.role !== 'admin') {
        // return res.status(403).json({ message: 'Forbidden: Only admins can create licenses directly.' });
        // For now, let's allow it for testing, but this check should be active
        console.warn("Warning: Non-admin user creating license. This should be restricted in production.");
    }

    try {
        const newLicense = {
            id: licenseIdCounter++,
            license_key: generateLicenseKey(),
            user_id: parseInt(userId), // Ensure userId is an integer if coming from req.body
            status: status,
            expires_at: expiresAt ? new Date(expiresAt) : null,
            product_id: productId, // Store associated product/module
            created_at: new Date(),
            updated_at: new Date()
        };
        licensesStore.push(newLicense);
        console.log('In-memory licensesStore after creation:', licensesStore);
        res.status(201).json(newLicense);
    } catch (error) {
        console.error('Create license error:', error);
        res.status(500).json({ message: 'Server error during license creation' });
    }
};

// GET /api/licenses - List all licenses (admin) or user's licenses
exports.getLicenses = async (req, res) => {
    try {
        if (req.user && req.user.role === 'admin') {
            res.json(licensesStore);
        } else if (req.user) {
            const userLicenses = licensesStore.filter(lic => lic.user_id === req.user.id);
            res.json(userLicenses);
        } else {
            // Should not happen if middleware is applied correctly
            return res.status(401).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Get licenses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/licenses/:id - Get a specific license
exports.getLicenseById = async (req, res) => {
    const licenseId = parseInt(req.params.id);
    try {
        const license = licensesStore.find(lic => lic.id === licenseId);
        if (!license) {
            return res.status(404).json({ message: 'License not found' });
        }

        // Check ownership or admin role
        if (req.user.role === 'admin' || (req.user.id === license.user_id)) {
            res.json(license);
        } else {
            res.status(403).json({ message: 'Forbidden: You do not have access to this license' });
        }
    } catch (error) {
        console.error('Get license by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/licenses/:id - Update a license
exports.updateLicense = async (req, res) => {
    const licenseId = parseInt(req.params.id);
    const { status, expiresAt } = req.body;

    // For admin roles only
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can update licenses.' });
    }

    try {
        const licenseIndex = licensesStore.findIndex(lic => lic.id === licenseId);
        if (licenseIndex === -1) {
            return res.status(404).json({ message: 'License not found' });
        }

        const originalLicense = licensesStore[licenseIndex];
        const updatedLicense = {
            ...originalLicense,
            status: status !== undefined ? status : originalLicense.status,
            expires_at: expiresAt !== undefined ? new Date(expiresAt) : originalLicense.expires_at,
            updated_at: new Date()
        };
        licensesStore[licenseIndex] = updatedLicense;
        console.log('In-memory licensesStore after update:', licensesStore);
        res.json(updatedLicense);
    } catch (error) {
        console.error('Update license error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/licenses/:id - Delete a license
exports.deleteLicense = async (req, res) => {
    const licenseId = parseInt(req.params.id);

    // For admin roles only
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete licenses.' });
    }

    try {
        const licenseIndex = licensesStore.findIndex(lic => lic.id === licenseId);
        if (licenseIndex === -1) {
            return res.status(404).json({ message: 'License not found' });
        }
        licensesStore.splice(licenseIndex, 1);
        console.log('In-memory licensesStore after deletion:', licensesStore);
        res.status(200).json({ message: 'License deleted successfully' });
    } catch (error) {
        console.error('Delete license error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/licenses/validate - Validate a license key
exports.validateLicense = async (req, res) => {
    const { licenseKey } = req.body;
    if (!licenseKey) {
        return res.status(400).json({ message: 'licenseKey is required' });
    }
    try {
        const license = licensesStore.find(lic => lic.license_key === licenseKey);
        if (!license) {
            return res.status(404).json({ isValid: false, message: 'License key not found' });
        }

        if (license.status !== 'active') {
            return res.status(403).json({ isValid: false, message: `License is not active. Status: ${license.status}` });
        }

        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            // Optionally update status to 'expired' here
            const licenseIndex = licensesStore.findIndex(lic => lic.license_key === licenseKey);
            if(licenseIndex !== -1) licensesStore[licenseIndex].status = 'expired';
            return res.status(403).json({ isValid: false, message: 'License has expired' });
        }

        // TODO: Add checks for product/module association if necessary

        res.json({ isValid: true, message: 'License is valid', licenseDetails: { userId: license.user_id, status: license.status, expiresAt: license.expires_at, productId: license.product_id } });
    } catch (error) {
        console.error('Validate license error:', error);
        res.status(500).json({ message: 'Server error during license validation' });
    }
};
