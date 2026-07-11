const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const config = require('../config');
const db = require('../config/database');
const { sendVerificationEmail } = require('../services/email');

const router = express.Router();

const generateToken = (userId, email, role) => jwt.sign(
  { userId, email, role },
  config.jwt.secret,
  { expiresIn: config.jwt.expiresIn },
);

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('role').isIn(['cook', 'member']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email, password, firstName, lastName, role,
      } = req.body;

      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role`,
        [email, passwordHash, firstName, lastName || '', role],
      );

      const user = result.rows[0];

      // Create role-specific profile
      if (role === 'cook') {
        await db.query(
          `INSERT INTO cook_profiles (user_id, status)
           VALUES ($1, 'approved')`,
          [user.id],
        );
      } else if (role === 'member') {
        await db.query(
          `INSERT INTO member_profiles (user_id)
           VALUES ($1)`,
          [user.id],
        );
      }

      // Create email verification token (expires in 24h)
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, verificationToken, expiresAt],
      );

      // Send verification email (non-blocking — don't fail registration if email fails)
      if (config.email.resendApiKey) {
        sendVerificationEmail(email, firstName, verificationToken).catch((err) => {
          console.error('Failed to send verification email:', err.message);
        });
      }

      // Don't issue token yet — user must verify email first
      return res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        emailVerificationRequired: true,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await db.query(
        'SELECT id, email, password_hash, role, email_verified FROM users WHERE email = $1',
        [email],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const passwordValid = await bcrypt.compare(password, user.password_hash);

      if (!passwordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.email_verified) {
        return res.status(403).json({
          message: 'Please verify your email before logging in. Check your inbox.',
          emailVerificationRequired: true,
        });
      }

      const token = generateToken(user.id, user.email, user.role);

      return res.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, role: user.role },
        token,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const result = await db.query(
      `SELECT ev.*, u.email, u.first_name
       FROM email_verifications ev
       JOIN users u ON u.id = ev.user_id
       WHERE ev.token = $1 AND ev.used = FALSE AND ev.expires_at > NOW()`,
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    const { user_id: userId } = result.rows[0];

    await db.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);
    await db.query('UPDATE email_verifications SET used = TRUE WHERE token = $1', [token]);

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    return next(error);
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const userResult = await db.query(
      'SELECT id, first_name, email_verified FROM users WHERE email = $1',
      [email],
    );

    // Always respond OK to avoid email enumeration
    if (userResult.rows.length === 0 || userResult.rows[0].email_verified) {
      return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }

    const user = userResult.rows[0];

    // Invalidate old tokens
    await db.query('UPDATE email_verifications SET used = TRUE WHERE user_id = $1', [user.id]);

    // Create new token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, expiresAt],
    );

    if (config.email.resendApiKey) {
      sendVerificationEmail(email, user.first_name, verificationToken).catch((err) => {
        console.error('Failed to send verification email:', err.message);
      });
    }

    return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
