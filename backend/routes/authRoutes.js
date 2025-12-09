import express from 'express';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { prisma } from '../server.js';
import { generateToken } from '../middleware/auth.js';
import emailService from '../utils/emailService.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Username validation
        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' });
        }

        // Username format validation (alphanumeric, underscore, hyphen)
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({ error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores' });
        }

        // Email is now required for verification
        if (!email) {
            return res.status(400).json({ error: 'L\'adresse email est requise pour la vérification' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Adresse email invalide' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Check if username already exists
        const existingUsername = await prisma.user.findUnique({
            where: { username: username }
        });

        if (existingUsername) {
            return res.status(409).json({
                error: 'Ce nom d\'utilisateur est déjà pris',
                field: 'username'
            });
        }

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingEmail) {
            return res.status(409).json({
                error: 'Cette adresse email est déjà utilisée',
                field: 'email'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = emailService.generateVerificationToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                emailVerified: false,
                verificationToken,
                tokenExpiry
            },
            select: {
                id: true,
                username: true,
                email: true,
                emailVerified: true,
                createdAt: true
            }
        });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, username, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue anyway - user is created, they can request a new verification email
        }

        res.status(201).json({
            user,
            message: 'Compte créé ! Veuillez vérifier votre email pour activer votre compte.',
            emailSent: true
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
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Email non vérifié. Veuillez vérifier votre email avant de vous connecter.',
                emailVerified: false,
                email: user.email
            });
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
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        next(error);
    }
});

// Verify email with token
router.get('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token de vérification manquant' });
        }

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                tokenExpiry: {
                    gte: new Date() // Token not expired
                }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        // Update user - mark as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                tokenExpiry: null
            }
        });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user.email, user.username);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.json({
            success: true,
            message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
        });
    } catch (error) {
        next(error);
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requis' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if email exists
            return res.json({ message: 'Si cet email existe, un nouveau lien de vérification a été envoyé.' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: 'Cet email est déjà vérifié' });
        }

        // Generate new token
        const verificationToken = emailService.generateVerificationToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                tokenExpiry
            }
        });

        // Send new verification email
        await emailService.sendVerificationEmail(user.email, user.username, verificationToken);

        res.json({ message: 'Un nouveau lien de vérification a été envoyé à votre email.' });
    } catch (error) {
        next(error);
    }
});

export default router;
