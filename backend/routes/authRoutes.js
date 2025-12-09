import express from 'express';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { prisma } from '../server.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (email && !validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    ...(email ? [{ email: email }] : [])
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email: email || null,
                passwordHash
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        // Generate JWT token
        const token = generateToken(user);

        res.status(201).json({
            user,
            token
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last seen
        await prisma.user.update({
            where: { id: user.id },
            data: { lastSeen: new Date() }
        });

        // Generate token
        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        next(error);
    }
});

export default router;
