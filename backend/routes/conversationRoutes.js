import express from 'express';
import { prisma } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for the current user
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user.id;

        const conversations = await prisma.conversation.findMany({
            where: {
                members: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                lastSeen: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        timestamp: true,
                        senderId: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.json(conversations);
    } catch (error) {
        next(error);
    }
});

// Create a new conversation
router.post('/', async (req, res, next) => {
    try {
        const { name, type, memberIds } = req.body;
        const userId = req.user.id;

        // Validation
        if (type === 'GROUP' && !name) {
            return res.status(400).json({ error: 'Group conversations require a name' });
        }

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'At least one member is required' });
        }

        // For direct conversations, check if one already exists
        if (type === 'DIRECT' && memberIds.length === 1) {
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    members: {
                        every: {
                            userId: {
                                in: [userId, memberIds[0]]
                            }
                        }
                    }
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    lastSeen: true
                                }
                            }
                        }
                    }
                }
            });

            if (existingConversation && existingConversation.members.length === 2) {
                return res.json(existingConversation);
            }
        }

        // Create conversation with members
        const conversation = await prisma.conversation.create({
            data: {
                name,
                type: type || 'DIRECT',
                members: {
                    create: [
                        { userId: userId, role: 'ADMIN' },
                        ...memberIds.map(id => ({ userId: id, role: 'MEMBER' }))
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                lastSeen: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(conversation);
    } catch (error) {
        next(error);
    }
});

// Get messages for a conversation
router.get('/:conversationId/messages', async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const { limit = 50, before } = req.query;

        // Check if user is a member of the conversation
        const member = await prisma.conversationMember.findFirst({
            where: {
                conversationId,
                userId
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get messages
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                ...(before && { timestamp: { lt: new Date(before) } })
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit)
        });

        res.json(messages.reverse());
    } catch (error) {
        next(error);
    }
});

// Delete a conversation
router.delete('/:conversationId', async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Check if user is admin of the conversation
        const member = await prisma.conversationMember.findFirst({
            where: {
                conversationId,
                userId,
                role: 'ADMIN'
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Only admins can delete conversations' });
        }

        await prisma.conversation.delete({
            where: { id: conversationId }
        });

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
