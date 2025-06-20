const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user; // Add user from payload to request object
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
