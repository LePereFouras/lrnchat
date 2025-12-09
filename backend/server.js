import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { socketHandler } from './socketHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: [
            process.env.WEB_URL || 'http://localhost:5173',
            process.env.MOBILE_URL || 'exp://localhost:19000'
        ],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: [
        process.env.WEB_URL || 'http://localhost:5173',
        process.env.MOBILE_URL || 'exp://localhost:19000'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.IO handlers
socketHandler(io);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await prisma.$disconnect();
    server.close(() => {
        console.log('HTTP server closed');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 LRN CHAT Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔒 End-to-end encryption enabled`);
});

export { io };
