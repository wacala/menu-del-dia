const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/ratings — submit a rating (member only, must have ordered)
router.post(
  '/',
  authenticate,
  authorize(['member']),
  body('order_id').isInt({ min: 1 }),
  body('cook_id').isInt({ min: 1 }),
  body('rating').isInt({ min: 1, max: 5 }),
  body('review_text').optional().trim().isLength({ max: 500 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: req.t('Datos inválidos'), errors: errors.array() });
      }

      const {
        order_id: orderId,
        cook_id: cookId,
        rating,
        review_text: reviewText,
      } = req.body;
      const { userId } = req.user;

      // Get member profile id
      const memberRes = await db.query(
        'SELECT id FROM member_profiles WHERE user_id = $1',
        [userId],
      );
      if (memberRes.rows.length === 0) {
        return res.status(403).json({ message: 'Perfil de miembro no encontrado' });
      }
      const memberId = memberRes.rows[0].id;

      // Verify the order belongs to this member and is delivered
      const orderCheck = await db.query(
        'SELECT id FROM orders WHERE id = $1 AND member_id = $2 AND status = $3',
        [orderId, memberId, 'delivered'],
      );
      if (orderCheck.rows.length === 0) {
        return res.status(403).json({ message: 'No puedes calificar esta orden' });
      }

      // Check existing rating
      const existing = await db.query(
        'SELECT id FROM ratings_reviews WHERE order_id = $1 AND reviewer_id = $2',
        [orderId, userId],
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Ya calificaste esta orden' });
      }

      // Insert rating
      const result = await db.query(
        `INSERT INTO ratings_reviews (order_id, reviewer_id, cook_id, rating, review_text)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [orderId, userId, cookId, rating, reviewText || ''],
      );

      // Update cook's average rating
      await db.query(
        `UPDATE cook_profiles SET rating = (
          SELECT ROUND(AVG(rating)::numeric, 1) FROM ratings_reviews WHERE cook_id = $1
        ) WHERE id = $1`,
        [cookId],
      );

      return res.status(201).json({ message: 'Calificación guardada', id: result.rows[0].id });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /api/ratings/:cookId — get ratings for a cook (public)
router.get('/:cookId', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.rating, r.review_text, r.created_at,
              u.first_name, u.last_name
       FROM ratings_reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.cook_id = $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [req.params.cookId],
    );
    return res.json({ ratings: result.rows });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
