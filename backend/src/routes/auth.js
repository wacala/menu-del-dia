const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const config = require('../config');
const db = require('../config/database');

const router = express.Router();

const generateToken = (userId, email, role) => jwt.sign(
  { userId, email, role },
  config.jwt.secret,
  { expiresIn: config.jwt.expiresIn },
);

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
      const token = generateToken(user.id, user.email, user.role);

      return res.status(201).json({ message: 'User registered successfully', user, token });
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
        'SELECT id, email, password_hash, role FROM users WHERE email = $1',
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

module.exports = router;
