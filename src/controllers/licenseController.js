const prisma = require('../lib/prisma'); // Import Prisma client
// const { LicenseStatus } = require('@prisma/client'); // Or rely on string mapping

// Define LicenseStatus enum values for validation if not importing directly
const validLicenseStatuses = ['INACTIVE', 'ACTIVE', 'EXPIRED', 'BLOCKED'];

// Remove in-memory store for licenses
// const licensesStore = [];
// let licenseIdCounter = 1;

// POST /api/licenses - Create a new license
exports.createLicense = async (req, res) => {
    let { userId, status, expiresAt, productId } = req.body; // productId for potential LicenseProductAccess

    // Validate status
    if (status) {
        status = status.toUpperCase();
        if (!validLicenseStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validLicenseStatuses.join(', ')}` });
        }
    } else {
        status = 'INACTIVE'; // Default status
    }

    // For admin roles - check req.user.role (assuming authMiddleware adds user to req)
    // For now, allowing non-admin for testing as per original logic, with a warning.
    // This should be strictly enforced in a production scenario.
    if (req.user && req.user.role !== 'ADMIN' && userId && parseInt(userId) !== req.user.id) {
         console.warn("Warning: Non-admin user attempting to create license for another user.");
        // return res.status(403).json({ message: 'Forbidden: You can only create licenses for yourself unless you are an admin.' });
    }
    if (req.user && req.user.role !== 'ADMIN' && !userId) { // If creating for self, userId can be omitted by non-admin
        userId = req.user.id;
    }


    try {
        const licenseData = {
            status: status,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        };
        if (userId) {
            licenseData.userId = parseInt(userId);
        }

        const newLicense = await prisma.license.create({
            data: licenseData,
            include: { user: { select: { id: true, email: true } } } // Include some user details
        });

        // If productId is provided, create LicenseProductAccess entry (simplified for now)
        if (productId && newLicense) {
            await prisma.licenseProductAccess.create({
                data: {
                    licenseId: newLicense.id,
                    productId: parseInt(productId)
                }
            }).catch(err => console.error("Failed to create LicenseProductAccess:", err)); // Log error but don't fail license creation
        }

        res.status(201).json(newLicense);
    } catch (error) {
        console.error('Create license error:', error);
        if (error.code === 'P2003' && error.message.includes('foreign key constraint failed on the field: `userId`')) {
            return res.status(400).json({ message: 'Invalid userId: User does not exist.' });
        }
        if (error.code === 'P2003' && error.message.includes('foreign key constraint failed on the field: `productId`')) {
             // This part is tricky if LicenseProductAccess fails after license creation.
             // Ideally, this should be a transaction.
            console.error('Error linking product to license. License created, but product link failed.');
            // Potentially return a specific error or just the created license with a warning.
        }
        res.status(500).json({ message: 'Server error during license creation' });
    }
};

// GET /api/licenses - List all licenses (admin) or user's licenses
exports.getLicenses = async (req, res) => {
    try {
        let licenses;
        const queryOptions = {
            include: {
                user: { select: { id: true, email: true, role: true } },
                grantedProducts: { include: { product: {select: {id: true, name: true}} } }
            }
        };

        if (req.user && req.user.role === 'ADMIN') {
            licenses = await prisma.license.findMany(queryOptions);
        } else if (req.user) {
            licenses = await prisma.license.findMany({
                where: { userId: req.user.id },
                ...queryOptions
            });
        } else {
            return res.status(401).json({ message: 'Unauthorized' }); // Should be caught by authMiddleware
        }
        res.json(licenses);
    } catch (error) {
        console.error('Get licenses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/licenses/:id - Get a specific license
exports.getLicenseById = async (req, res) => {
    const licenseId = parseInt(req.params.id);
    if (isNaN(licenseId)) {
        return res.status(400).json({ message: 'Invalid license ID format.' });
    }

    try {
        const license = await prisma.license.findUnique({
            where: { id: licenseId },
            include: {
                user: { select: { id: true, email: true, role: true } },
                grantedProducts: { include: { product: {select: {id: true, name: true}} } }
            }
        });

        if (!license) {
            return res.status(404).json({ message: 'License not found' });
        }

        // Check ownership or admin role
        if (req.user.role === 'ADMIN' || (license.userId && req.user.id === license.userId)) {
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
    if (isNaN(licenseId)) {
        return res.status(400).json({ message: 'Invalid license ID format.' });
    }

    let { status, expiresAt } = req.body;

    // For admin roles only
    if (req.user && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can update licenses.' });
    }

    if (status) {
        status = status.toUpperCase();
        if (!validLicenseStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validLicenseStatuses.join(', ')}` });
        }
    }

    try {
        const updatedLicense = await prisma.license.update({
            where: { id: licenseId },
            data: {
                status: status, // status will be undefined if not provided, Prisma won't update it
                expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
            },
            include: { user: { select: { id: true, email: true } } }
        });
        res.json(updatedLicense);
    } catch (error) {
        console.error('Update license error:', error);
        if (error.code === 'P2025') { // Record to update not found
            return res.status(404).json({ message: 'License not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/licenses/:id - Delete a license
exports.deleteLicense = async (req, res) => {
    const licenseId = parseInt(req.params.id);
    if (isNaN(licenseId)) {
        return res.status(400).json({ message: 'Invalid license ID format.' });
    }

    // For admin roles only
    if (req.user && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete licenses.' });
    }

    try {
        await prisma.license.delete({
            where: { id: licenseId },
        });
        res.status(200).json({ message: 'License deleted successfully' });
    } catch (error) {
        console.error('Delete license error:', error);
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ message: 'License not found' });
        }
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
        const license = await prisma.license.findUnique({
            where: { licenseKey: licenseKey },
            include: { grantedProducts: { include: { product: {select: {id: true, name: true}} } } }
        });

        if (!license) {
            return res.status(404).json({ isValid: false, message: 'License key not found' });
        }

        if (license.status === 'EXPIRED' || (license.expiresAt && new Date(license.expiresAt) < new Date() && license.status !== 'EXPIRED')) {
            if (license.status !== 'EXPIRED') {
                // License has passed expiry date and status is not yet EXPIRED, update it.
                await prisma.license.update({
                    where: { licenseKey: licenseKey },
                    data: { status: 'EXPIRED' }
                });
            }
            return res.status(403).json({ isValid: false, message: 'License has expired', status: 'EXPIRED' });
        }

        if (license.status !== 'ACTIVE') {
            return res.status(403).json({ isValid: false, message: `License is not active. Status: ${license.status}`, status: license.status });
        }

        res.json({
            isValid: true,
            message: 'License is valid',
            licenseDetails: {
                userId: license.userId,
                status: license.status,
                expiresAt: license.expiresAt,
                products: license.grantedProducts.map(gp => gp.product)
            }
        });
    } catch (error) {
        console.error('Validate license error:', error);
        res.status(500).json({ message: 'Server error during license validation' });
    }
};
