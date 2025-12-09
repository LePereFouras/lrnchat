import jwt from 'jsonwebtoken';
import { prisma } from './server.js';

// Connected users map: userId -> socketId
const connectedUsers = new Map();

export const socketHandler = (io) => {
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }
            socket.userId = decoded.id;
            socket.username = decoded.username;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.username} (${socket.id})`);

        // Store connected user
        connectedUsers.set(socket.userId, socket.id);

        // Update user's last seen
        prisma.user.update({
            where: { id: socket.userId },
            data: { lastSeen: new Date() }
        }).catch(console.error);

        // Broadcast user online status
        io.emit('user:status', {
            userId: socket.userId,
            status: 'online'
        });

        // Join conversation rooms
        socket.on('conversation:join', async (conversationId) => {
            try {
                // Verify user is a member
                const member = await prisma.conversationMember.findFirst({
                    where: {
                        conversationId,
                        userId: socket.userId
                    }
                });

                if (member) {
                    socket.join(`conversation:${conversationId}`);
                    console.log(`User ${socket.username} joined conversation ${conversationId}`);
                }
            } catch (error) {
                console.error('Error joining conversation:', error);
            }
        });

        // Leave conversation room
        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`User ${socket.username} left conversation ${conversationId}`);
        });

        // Handle new message
        socket.on('message:send', async (data) => {
            try {
                const { conversationId, encryptedContent, iv } = data;

                // Verify user is a member
                const member = await prisma.conversationMember.findFirst({
                    where: {
                        conversationId,
                        userId: socket.userId
                    }
                });

                if (!member) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                // Save message to database
                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId: socket.userId,
                        encryptedContent,
                        iv
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                });

                // Update conversation's updatedAt
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() }
                });

                // Broadcast message to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', message);

                // Send acknowledgment to sender
                socket.emit('message:sent', {
                    tempId: data.tempId,
                    message
                });

                console.log(`Message sent in conversation ${conversationId} by ${socket.username}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing:start', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit('typing:user', {
                userId: socket.userId,
                username: socket.username,
                conversationId,
                isTyping: true
            });
        });

        socket.on('typing:stop', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit('typing:user', {
                userId: socket.userId,
                username: socket.username,
                conversationId,
                isTyping: false
            });
        });

        // Handle message read receipts
        socket.on('message:read', async ({ messageId, conversationId }) => {
            try {
                await prisma.message.update({
                    where: { id: messageId },
                    data: { readAt: new Date() }
                });

                socket.to(`conversation:${conversationId}`).emit('message:read', {
                    messageId,
                    userId: socket.userId,
                    readAt: new Date()
                });
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.username}`);

            connectedUsers.delete(socket.userId);

            // Update last seen
            prisma.user.update({
                where: { id: socket.userId },
                data: { lastSeen: new Date() }
            }).catch(console.error);

            // Broadcast user offline status
            io.emit('user:status', {
                userId: socket.userId,
                status: 'offline',
                lastSeen: new Date()
            });
        });
    });
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
    return connectedUsers.has(userId);
};

// Helper function to get user's socket ID
export const getUserSocketId = (userId) => {
    return connectedUsers.get(userId);
};
