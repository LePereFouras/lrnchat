import express from 'express';
import { prisma } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Search users by username
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        const userId = req.user.id;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: q,
                    mode: 'insensitive'
                },
                NOT: {
                    id: userId // Exclude current user
                }
            },
            select: {
                id: true,
                username: true,
                lastSeen: true
            },
            take: 20
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
});

// Get user's encryption keys
router.get('/:userId/keys', async (req, res, next) => {
    try {
        const { userId } = req.params;

        const keys = await prisma.encryptionKey.findMany({
            where: {
                userId,
                keyType: {
                    in: ['IDENTITY', 'SIGNED_PREKEY']
                }
            },
            select: {
                id: true,
                keyType: true,
                publicKey: true,
                signedPreKey: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 1
        });

        res.json(keys);
    } catch (error) {
        next(error);
    }
});

// Get current user profile
router.get('/me', async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                lastSeen: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

export default router;
