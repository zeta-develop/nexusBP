const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db'); // Assuming db.js exports a Pool object
const { JWT_SECRET } = require('../config');

// In-memory store for users as a placeholder for DB interaction
const usersStore = [];
let userIdCounter = 1;

exports.register = async (req, res) => {
    const { email, password, role = 'client' } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // TODO: Replace with actual DB check
        // const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        // if (existingUser.rows.length > 0) {
        //     return res.status(409).json({ message: 'User already exists' });
        // }
        const existingUser = usersStore.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists with in-memory store' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // TODO: Replace with actual DB insert
        // const newUser = await pool.query(
        //     'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        //     [email, password_hash, role]
        // );
        // res.status(201).json({ user: newUser.rows[0], message: 'User registered successfully' });

        const newUser = { id: userIdCounter++, email, password_hash, role, created_at: new Date(), updated_at: new Date() };
        usersStore.push(newUser);
        console.log('In-memory usersStore after registration:', usersStore);
        res.status(201).json({ user: { id: newUser.id, email: newUser.email, role: newUser.role }, message: 'User registered successfully (in-memory)' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // TODO: Replace with actual DB query
        // const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        // if (result.rows.length === 0) {
        //     return res.status(401).json({ message: 'Invalid credentials' });
        // }
        // const user = result.rows[0];

        const user = usersStore.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (user not found in-memory)' });
        }
        console.log('User found in-memory for login:', user);


        const isMatch = await bcrypt.compare(password, user.password_hash);
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
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
