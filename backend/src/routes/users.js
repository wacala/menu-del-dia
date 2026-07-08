const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me - get my profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at,
              cp.bio, cp.cuisine_type, cp.rating, cp.total_orders, cp.verified, cp.status AS cook_status,
              mp.default_address, mp.total_orders AS member_orders
       FROM users u
       LEFT JOIN cook_profiles cp ON cp.user_id = u.id
       LEFT JOIN member_profiles mp ON mp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/users/me - update my profile
router.put(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, phone } = req.body;

      const result = await db.query(
        `UPDATE users
         SET first_name = COALESCE($1, first_name),
             last_name  = COALESCE($2, last_name),
             phone      = COALESCE($3, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, first_name, last_name, phone, role`,
        [firstName, lastName, phone, req.user.userId],
      );

      return res.json({ user: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  },
);

// PUT /api/users/me/cook-profile - update cook profile
router.put(
  '/me/cook-profile',
  authenticate,
  authorize(['cook']),
  [
    body('bio').optional().trim(),
    body('cuisineType').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bio, cuisineType } = req.body;

      const result = await db.query(
        `UPDATE cook_profiles
         SET bio          = COALESCE($1, bio),
             cuisine_type = COALESCE($2, cuisine_type),
             updated_at   = CURRENT_TIMESTAMP
         WHERE user_id = $3
         RETURNING *`,
        [bio, cuisineType, req.user.userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cook profile not found' });
      }

      return res.json({ profile: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /api/users/cooks - list all approved cooks (public)
router.get('/cooks', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.first_name, u.last_name, cp.bio, cp.cuisine_type, cp.rating, cp.total_orders
       FROM users u
       JOIN cook_profiles cp ON cp.user_id = u.id
       WHERE cp.status = 'approved' AND u.status = 'active'
       ORDER BY cp.rating DESC`,
    );

    return res.json({ cooks: result.rows });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
