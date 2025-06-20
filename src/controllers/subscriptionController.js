const prisma = require('../lib/prisma'); // Import Prisma client

// Define SubscriptionStatus enum values for validation
const validSubscriptionStatuses = ['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INACTIVE'];

// Remove in-memory store
// const subscriptionsStore = [];
// let subscriptionIdCounter = 1;

// POST /api/subscriptions - Create a new subscription
exports.createSubscription = async (req, res) => {
    const loggedInUserId = req.user.id;
    let { userId, licenseId, planType, endDate, status } = req.body;

    const targetUserId = userId ? parseInt(userId) : loggedInUserId;

    if (!targetUserId || !planType) {
        return res.status(400).json({ message: 'User ID (or be logged in) and planType are required' });
    }

    if (userId && parseInt(userId) !== loggedInUserId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: You can only create subscriptions for yourself unless you are an admin.' });
    }

    if (status) {
        status = status.toUpperCase();
        if (!validSubscriptionStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validSubscriptionStatuses.join(', ')}` });
        }
    } else {
        status = 'INACTIVE'; // Default status
    }

    try {
        const subscriptionData = {
            userId: targetUserId,
            planType: planType,
            status: status,
            startDate: new Date(), // Or allow startDate from req.body
            endDate: endDate ? new Date(endDate) : null,
        };
        if (licenseId) {
            subscriptionData.licenseId = parseInt(licenseId);
        }

        const newSubscription = await prisma.subscription.create({
            data: subscriptionData,
            include: {
                user: { select: { id: true, email: true } },
                license: { select: { id: true, licenseKey: true } }
            }
        });
        res.status(201).json(newSubscription);
    } catch (error) {
        console.error('Create subscription error:', error);
        if (error.code === 'P2003') { // Foreign key constraint failed
             if (error.meta?.field_name?.includes('userId')) {
                return res.status(400).json({ message: 'Invalid userId: User does not exist.' });
            }
            if (error.meta?.field_name?.includes('licenseId')) {
                return res.status(400).json({ message: 'Invalid licenseId: License does not exist.' });
            }
        }
        res.status(500).json({ message: 'Server error during subscription creation' });
    }
};

// GET /api/users/:userId/subscriptions - Get subscriptions for a specific user (Admin or self)
// GET /api/subscriptions/mine - Get subscriptions for the logged-in user
// GET /api/subscriptions - Get all subscriptions (Admin only)
exports.getSubscriptions = async (req, res) => {
    try {
        let queryConditions = {};
        const includeOptions = {
            user: { select: { id: true, email: true } },
            license: { select: { id: true, licenseKey: true } }
        };

        if (req.params.userId) { // Endpoint: /api/users/:userId/subscriptions
            const targetUserId = parseInt(req.params.userId);
            if (isNaN(targetUserId)) {
                return res.status(400).json({ message: 'Invalid user ID format.'});
            }
            if (req.user.role !== 'ADMIN' && req.user.id !== targetUserId) {
                return res.status(403).json({ message: 'Forbidden: You can only view your own subscriptions or you must be an admin.' });
            }
            queryConditions.where = { userId: targetUserId };
        } else { // Endpoints: /api/subscriptions/mine or /api/subscriptions
            if (req.originalUrl.endsWith('/mine')) { // User getting their own subscriptions
                queryConditions.where = { userId: req.user.id };
            } else { // Admin getting all subscriptions via /api/subscriptions
                if (req.user.role !== 'ADMIN') {
                    // If not admin and not /mine, it's like /api/subscriptions for a non-admin: treat as /mine
                    queryConditions.where = { userId: req.user.id };
                }
                // If admin, no specific where clause here means all subscriptions
            }
        }

        queryConditions.include = includeOptions;
        const subscriptions = await prisma.subscription.findMany(queryConditions);
        res.json(subscriptions);

    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/subscriptions/:subscriptionId - Update a subscription
exports.updateSubscription = async (req, res) => {
    const subscriptionId = parseInt(req.params.subscriptionId);
    if (isNaN(subscriptionId)) {
        return res.status(400).json({ message: 'Invalid subscription ID format.' });
    }

    let { planType, endDate, status, licenseId } = req.body;

    // Validate status if provided
    if (status) {
        status = status.toUpperCase();
        if (!validSubscriptionStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validSubscriptionStatuses.join(', ')}` });
        }
    }

    try {
        // First, find the subscription to check ownership if not admin
        const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (req.user.role !== 'ADMIN' && req.user.id !== subscription.userId) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this subscription.' });
        }

        // Admin can update more fields, user might be restricted (e.g., only status to 'CANCELED')
        // For now, allowing fields to be updated if user is owner or admin.
        const dataToUpdate = {};
        if (planType !== undefined) dataToUpdate.planType = planType;
        if (endDate !== undefined) dataToUpdate.endDate = endDate ? new Date(endDate) : null;
        if (status !== undefined) dataToUpdate.status = status;
        if (licenseId !== undefined) dataToUpdate.licenseId = licenseId ? parseInt(licenseId) : null;


        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: dataToUpdate,
            include: {
                user: { select: { id: true, email: true } },
                license: { select: { id: true, licenseKey: true } }
            }
        });
        res.json(updatedSubscription);
    } catch (error) {
        console.error('Update subscription error:', error);
        if (error.code === 'P2025') { // Record to update not found (already checked, but good for safety)
            return res.status(404).json({ message: 'Subscription not found during update.' });
        }
        if (error.code === 'P2003' && error.meta?.field_name?.includes('licenseId')) { // Foreign key constraint for licenseId
            return res.status(400).json({ message: 'Invalid licenseId: License does not exist.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
