const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma'); // Import Prisma client
const { JWT_SECRET } = require('../config');
// Enums are typically available via the Prisma client instance or directly from @prisma/client
// For example: const { Role } = require('@prisma/client');
// However, Prisma often maps string values directly. For validation, let's define them or import properly.

// Define Role enum values as expected by Prisma schema for validation.
const validRoles = ['CLIENT', 'ADMIN']; // Matches enum Role in schema.prisma

exports.register = async (req, res) => {
    let { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.toLowerCase(); // Standardize email to lowercase

    if (role) {
        role = role.toUpperCase();
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }
    } else {
        role = 'CLIENT'; // Default role as a string, Prisma maps it
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                email: email,
                passwordHash: passwordHash,
                role: role, // Pass the string e.g., "CLIENT" or "ADMIN"
            },
        });

        const userForResponse = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };

        res.status(201).json({ user: userForResponse, message: 'User registered successfully' });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
             return res.status(409).json({ message: 'User already exists (unique constraint failed).' });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (user not found)' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('JWT sign error:', err);
                    return res.status(500).json({ message: 'Error generating token' });
                };
                const userForResponse = { id: user.id, email: user.email, role: user.role };
                res.json({ token, user: userForResponse });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// GET /api/users - List all users (Admin only)
exports.listUsers = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can list users.' });
    }
    try {
        const users = await prisma.user.findMany({
            select: { // Select specific fields to avoid exposing passwordHash
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: { // Example of counting related records
                    select: { licenses: true, subscriptions: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ message: 'Server error while listing users.' });
    }
};
