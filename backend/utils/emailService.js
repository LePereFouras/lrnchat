import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
    constructor() {
        // Configure email transporter
        // For production, use a real email service (Gmail, SendGrid, etc.)
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // For development without email credentials
        if (!process.env.EMAIL_USER) {
            console.warn('⚠️  EMAIL_USER not configured. Emails will be logged to console only.');
            this.devMode = true;
        }
    }

    // Generate verification token
    generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Send verification email
    async sendVerificationEmail(email, username, token) {
        const verificationUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"LRN CHAT" <noreply@lrnchat.com>',
            to: email,
            subject: 'Vérifiez votre adresse email - LRN CHAT 🔐',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #667eea; margin-bottom: 20px;">🔐 LRN CHAT</h1>
            <h2 style="color: #333;">Bienvenue ${username} !</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Merci de vous être inscrit sur LRN CHAT, votre plateforme de messagerie chiffrée.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Vérifier mon email
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Ce lien expire dans 24 heures.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              🔒 Vos messages sont chiffrés de bout en bout avec AES-256 GCM
            </p>
          </div>
        </div>
      `
        };

        if (this.devMode) {
            console.log('\n📧 [DEV MODE] Email Verification:');
            console.log('To:', email);
            console.log('Token:', token);
            console.log('URL:', verificationUrl);
            console.log('\n');
            return { success: true, devMode: true };
        }

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error('Email sending failed');
        }
    }

    // Send welcome email after verification
    async sendWelcomeEmail(email, username) {
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"LRN CHAT" <noreply@lrnchat.com>',
            to: email,
            subject: 'Votre compte est activé ! - LRN CHAT 🔐',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #667eea; margin-bottom: 20px;">🎉 Compte activé !</h1>
            <h2 style="color: #333;">Bienvenue ${username} !</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Votre compte LRN CHAT est maintenant actif. Vous pouvez commencer à envoyer des messages chiffrés en toute sécurité.
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.8;">
              <li>✅ Chiffrement end-to-end AES-256 GCM</li>
              <li>✅ Messagerie temps réel</li>
              <li>✅ Application disponible sur web et mobile</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.WEB_URL || 'http://localhost:5173'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ouvrir LRN CHAT
              </a>
            </div>
          </div>
        </div>
      `
        };

        if (this.devMode) {
            console.log('\n📧 [DEV MODE] Welcome Email to:', email);
            return { success: true, devMode: true };
        }

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't throw, welcome email is not critical
        }
    }
}

export default new EmailService();
