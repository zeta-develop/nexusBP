// In-memory store for subscriptions
const subscriptionsStore = [];
let subscriptionIdCounter = 1;

// In-memory store for users (from authController, for checking user existence)
// This is a simplified approach for the subtask. In a real app, you'd query the DB.
// const { usersStore } = require('./authController'); // This direct import might be tricky with how files are evaluated in subtasks.
// For simplicity, we'll assume user validation happens or is less strict in this isolated step.

// POST /api/subscriptions - Create a new subscription
exports.createSubscription = async (req, res) => {
    // req.user is available from authMiddleware
    const loggedInUserId = req.user.id;
    const { userId, licenseId, planType, endDate, status = 'active' } = req.body;

    // Validate input
    const targetUserId = userId ? parseInt(userId) : loggedInUserId; // Default to logged-in user if userId not provided by admin

    if (!targetUserId || !planType) {
        return res.status(400).json({ message: 'UserId (or be logged in) and planType are required' });
    }

    // Admin check: Only admins can create subscriptions for OTHERS. Users can create for themselves.
    if (userId && parseInt(userId) !== loggedInUserId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: You can only create subscriptions for yourself unless you are an admin.' });
    }

    // TODO: Validate that userId exists in the users table
    // TODO: Validate that licenseId (if provided) exists and potentially links to the user

    try {
        const newSubscription = {
            id: subscriptionIdCounter++,
            user_id: targetUserId,
            license_id: licenseId ? parseInt(licenseId) : null,
            plan_type: planType,
            start_date: new Date(),
            end_date: endDate ? new Date(endDate) : null,
            status: status,
            created_at: new Date(),
            updated_at: new Date()
        };
        subscriptionsStore.push(newSubscription);
        console.log('In-memory subscriptionsStore after creation:', subscriptionsStore);
        res.status(201).json(newSubscription);
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: 'Server error during subscription creation' });
    }
};

// GET /api/users/:userId/subscriptions - Get subscriptions for a specific user (Admin access)
// GET /api/subscriptions/mine - Get subscriptions for the logged-in user
exports.getSubscriptions = async (req, res) => {
    try {
        let userSubscriptions;
        if (req.params.userId) { // Endpoint: /api/users/:userId/subscriptions
            if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.userId)) {
                return res.status(403).json({ message: 'Forbidden: You can only view your own subscriptions or you must be an admin.' });
            }
            const targetUserId = parseInt(req.params.userId);
            userSubscriptions = subscriptionsStore.filter(sub => sub.user_id === targetUserId);
        } else { // Endpoint: /api/subscriptions/mine (or a general /api/subscriptions for admins)
            if (req.user.role === 'admin' && !req.originalUrl.endsWith('/mine')) { // Admin getting all subscriptions
                 userSubscriptions = subscriptionsStore;
            } else { // User getting their own subscriptions
                userSubscriptions = subscriptionsStore.filter(sub => sub.user_id === req.user.id);
            }
        }
        res.json(userSubscriptions);
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/subscriptions/:subscriptionId - Update a subscription
exports.updateSubscription = async (req, res) => {
    const subscriptionId = parseInt(req.params.subscriptionId);
    const { planType, endDate, status } = req.body;

    try {
        const subscriptionIndex = subscriptionsStore.findIndex(sub => sub.id === subscriptionId);
        if (subscriptionIndex === -1) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const originalSubscription = subscriptionsStore[subscriptionIndex];

        // Authorization: Admin can update any. User can only update their own (e.g. cancel).
        if (req.user.role !== 'admin' && req.user.id !== originalSubscription.user_id) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this subscription.' });
        }

        // More granular control might be needed here for what a user can update vs an admin
        // For example, a user might only be allowed to change 'status' to 'canceled'.

        const updatedSubscription = {
            ...originalSubscription,
            plan_type: planType !== undefined ? planType : originalSubscription.plan_type,
            end_date: endDate !== undefined ? new Date(endDate) : originalSubscription.end_date,
            status: status !== undefined ? status : originalSubscription.status,
            updated_at: new Date()
        };
        subscriptionsStore[subscriptionIndex] = updatedSubscription;
        console.log('In-memory subscriptionsStore after update:', subscriptionsStore);
        res.json(updatedSubscription);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
