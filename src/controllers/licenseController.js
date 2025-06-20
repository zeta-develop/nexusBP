const crypto = require('crypto'); // For generating UUIDs
const prisma = require('../lib/prisma');

const validLicenseStatuses = ['INACTIVE', 'ACTIVE', 'EXPIRED', 'BLOCKED'];

exports.createLicense = async (req, res) => {
    let { userId, status, expiresAt, productId } = req.body;

    if (status) {
        status = status.toUpperCase();
        if (!validLicenseStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validLicenseStatuses.join(', ')}` });
        }
    } else {
        status = 'INACTIVE';
    }

    if (req.user && req.user.role !== 'ADMIN' && userId && parseInt(userId) !== req.user.id) {
        console.warn("Warning: Non-admin user attempting to create license for another user.");
        // In production, return res.status(403) here.
    }
    if (req.user && req.user.role !== 'ADMIN' && !userId) { // Non-admin creating for self
        userId = req.user.id;
    }

    const generatedLicenseKey = `inv-${crypto.randomUUID()}`; // Generate prefixed UUID

    try {
        const licenseData = {
            licenseKey: generatedLicenseKey, // Use the generated key
            status: status,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        };
        // Only include userId if it's defined (either passed by admin or set for self)
        if (userId !== undefined && userId !== null) {
            licenseData.userId = parseInt(userId);
        }


        const newLicense = await prisma.license.create({
            data: licenseData,
            include: { user: { select: { id: true, email: true } } }
        });

        if (productId && newLicense) {
            await prisma.licenseProductAccess.create({
                data: {
                    licenseId: newLicense.id,
                    productId: parseInt(productId)
                }
            }).catch(err => console.error("Failed to create LicenseProductAccess:", err)); // Log error, but don't fail license creation for this
        }

        res.status(201).json(newLicense);
    } catch (error) {
        console.error('Create license error:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('licenseKey')) {
            // This case should be extremely rare with UUIDs.
            // If it happens, it implies a UUID collision or a non-UUID value was somehow attempted.
            return res.status(500).json({ message: 'Failed to generate a unique license key. Please try again.' });
        }
        if (error.code === 'P2003' && error.meta?.field_name?.includes('userId')) {
            return res.status(400).json({ message: 'Invalid userId: User does not exist.' });
        }
        // Handle other potential errors like productId not found if that's a hard requirement
        if (error.code === 'P2003' && error.meta?.field_name?.includes('productId')) {
             console.error('Error linking product to license. Product may not exist.');
             // Depending on requirements, you might still return the license or a specific error
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
            return res.status(401).json({ message: 'Unauthorized' });
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
                status: status,
                expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
            },
            include: { user: { select: { id: true, email: true } } }
        });
        res.json(updatedLicense);
    } catch (error) {
        console.error('Update license error:', error);
        if (error.code === 'P2025') {
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

    if (req.user && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete licenses.' });
    }

    try {
        // Prisma requires related records in LicenseProductAccess to be deleted first
        // if onDelete: Cascade is not fully effective or if there are other constraints.
        // For simplicity, this assumes cascade delete on LicenseProductAccess via schema works.
        await prisma.license.delete({
            where: { id: licenseId },
        });
        res.status(200).json({ message: 'License deleted successfully' });
    } catch (error) {
        console.error('Delete license error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'License not found' });
        }
        // Handle P2003 if foreign key constraints prevent deletion (e.g. Subscription points to it without onDelete: Cascade or SET NULL)
        if (error.code === 'P2003' && error.meta?.field_name?.includes('Subscription_licenseId_fkey')) {
            return res.status(400).json({ message: 'Cannot delete license: It is still referenced by subscriptions.'});
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
