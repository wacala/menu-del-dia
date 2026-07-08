const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/menus - list today's published menus (public)
router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT m.id, m.title, m.description, m.menu_date,
              m.order_start_time, m.order_end_time,
              m.pickup_available, m.delivery_available, m.delivery_fee,
              m.pickup_location, m.status,
              u.first_name AS cook_first_name, u.last_name AS cook_last_name,
              cp.cuisine_type, cp.rating AS cook_rating,
              json_agg(
                json_build_object(
                  'id', mi.id,
                  'name', mi.name,
                  'description', mi.description,
                  'price', mi.price,
                  'quantity_available', mi.quantity_available - mi.quantity_sold,
                  'dietary_tags', mi.dietary_tags,
                  'image_url', mi.image_url
                )
              ) AS items
       FROM menus m
       JOIN cook_profiles cp ON cp.id = m.cook_id
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN menu_items mi ON mi.menu_id = m.id
       WHERE m.menu_date = $1 AND m.status = 'published'
       GROUP BY m.id, u.first_name, u.last_name, cp.cuisine_type, cp.rating
       ORDER BY cp.rating DESC`,
      [date],
    );

    return res.json({ menus: result.rows, date });
  } catch (error) {
    return next(error);
  }
});

// GET /api/menus/:id - get single menu details (public)
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT m.*, u.first_name AS cook_first_name, u.last_name AS cook_last_name,
              cp.cuisine_type, cp.rating AS cook_rating, cp.bio AS cook_bio
       FROM menus m
       JOIN cook_profiles cp ON cp.id = m.cook_id
       JOIN users u ON u.id = cp.user_id
       WHERE m.id = $1`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const itemsResult = await db.query(
      'SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY id',
      [req.params.id],
    );

    const menu = result.rows[0];
    menu.items = itemsResult.rows;

    return res.json({ menu });
  } catch (error) {
    return next(error);
  }
});

// POST /api/menus - cook creates a menu
router.post(
  '/',
  authenticate,
  authorize(['cook']),
  [
    body('menuDate').isDate(),
    body('title').trim().notEmpty(),
    body('orderStartTime').isISO8601(),
    body('orderEndTime').isISO8601(),
    body('pickupAvailable').optional().isBoolean(),
    body('deliveryAvailable').optional().isBoolean(),
    body('pickupLocation').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get cook profile id
      const cookResult = await db.query(
        'SELECT id FROM cook_profiles WHERE user_id = $1',
        [req.user.userId],
      );

      if (cookResult.rows.length === 0) {
        return res.status(404).json({ message: 'Cook profile not found' });
      }

      const cookId = cookResult.rows[0].id;

      const {
        menuDate, title, description,
        orderStartTime, orderEndTime,
        pickupAvailable = true, deliveryAvailable = false,
        deliveryFee, pickupLocation,
      } = req.body;

      const result = await db.query(
        `INSERT INTO menus
           (cook_id, menu_date, title, description, order_start_time, order_end_time,
            pickup_available, delivery_available, delivery_fee, pickup_location, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft')
         RETURNING *`,
        [cookId, menuDate, title, description, orderStartTime, orderEndTime,
          pickupAvailable, deliveryAvailable, deliveryFee, pickupLocation],
      );

      return res.status(201).json({ menu: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /api/menus/:id/items - add item to menu
router.post(
  '/:id/items',
  authenticate,
  authorize(['cook']),
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('quantityAvailable').isInt({ min: 1 }),
    body('description').optional().trim(),
    body('dietaryTags').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify this menu belongs to this cook
      const cookResult = await db.query(
        `SELECT m.id FROM menus m
         JOIN cook_profiles cp ON cp.id = m.cook_id
         WHERE m.id = $1 AND cp.user_id = $2`,
        [req.params.id, req.user.userId],
      );

      if (cookResult.rows.length === 0) {
        return res.status(403).json({ message: 'Not your menu' });
      }

      const {
        name, description, price, quantityAvailable,
        ingredients, allergens, dietaryTags, imageUrl,
      } = req.body;

      const result = await db.query(
        `INSERT INTO menu_items
           (menu_id, name, description, price, quantity_available,
            ingredients, allergens, dietary_tags, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [req.params.id, name, description, price, quantityAvailable,
          ingredients, allergens, dietaryTags, imageUrl],
      );

      return res.status(201).json({ item: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  },
);

// PUT /api/menus/:id/publish - cook publishes a menu
router.put('/:id/publish', authenticate, authorize(['cook']), async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE menus SET status = 'published', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND cook_id = (SELECT id FROM cook_profiles WHERE user_id = $2)
       RETURNING *`,
      [req.params.id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu not found or not yours' });
    }

    return res.json({ menu: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

// GET /api/menus/my/menus - cook sees their own menus
router.get('/my/menus', authenticate, authorize(['cook']), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT m.*, COUNT(o.id) AS order_count
       FROM menus m
       LEFT JOIN orders o ON o.menu_id = m.id
       WHERE m.cook_id = (SELECT id FROM cook_profiles WHERE user_id = $1)
       GROUP BY m.id
       ORDER BY m.menu_date DESC
       LIMIT 30`,
      [req.user.userId],
    );

    return res.json({ menus: result.rows });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
