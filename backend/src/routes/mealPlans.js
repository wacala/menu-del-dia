/* eslint-disable max-len, no-await-in-loop, object-curly-newline, implicit-arrow-linebreak, function-paren-newline */
const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/meal-plans/suggest — suggest a meal plan based on preferences
router.post(
  '/suggest',
  authenticate,
  authorize(['member']),
  [
    body('people').isInt({ min: 1 }),
    body('meals').isInt({ min: 1 }),
    body('budget').isFloat({ min: 0 }),
    body('restrictions').optional().isString(),
    body('preferredCuisines').optional().isString(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const {
        people, meals, budget, restrictions, preferredCuisines, startDate, endDate,
      } = req.body;
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const menusResult = await db.query(
        `SELECT m.id, m.title, m.description, m.menu_date,
                m.pickup_available, m.delivery_available, m.pickup_location,
                u.first_name AS cook_first_name, u.last_name AS cook_last_name,
                cp.cuisine_type, cp.rating AS cook_rating,
                json_agg(
                  json_build_object(
                    'id', mi.id, 'name', mi.name, 'price', mi.price,
                    'quantity_available', mi.quantity_available - mi.quantity_sold,
                    'dietary_tags', mi.dietary_tags
                  )
                ) FILTER (WHERE mi.id IS NOT NULL AND (mi.quantity_available - mi.quantity_sold) > 0) AS items
         FROM menus m
         JOIN cook_profiles cp ON cp.id = m.cook_id
         JOIN users u ON u.id = cp.user_id
         LEFT JOIN menu_items mi ON mi.menu_id = m.id
         WHERE m.menu_date >= $1 AND m.menu_date <= $2 AND m.status = 'published'
         GROUP BY m.id, u.first_name, u.last_name, cp.cuisine_type, cp.rating
         ORDER BY m.menu_date`,
        [start, end],
      );

      let filtered = menusResult.rows.filter((m) => m.items && m.items.length > 0);

      // Filter by dietary restrictions
      if (restrictions && restrictions.trim()) {
        const r = restrictions.toLowerCase();
        filtered = filtered.filter((menu) => (menu.items || []).every((item) => {
          const tags = (item.dietary_tags || '').toLowerCase();
          if (!tags) return true;
          if (r.includes('vegano') || r.includes('vegan')) return tags.includes('vegano') || tags.includes('vegan');
          if (r.includes('gluten')) return !tags.includes('gluten');
          if (r.includes('lactosa') || r.includes('lactose')) return !tags.includes('lactosa') && !tags.includes('lactose');
          return true;
        }));
      }

      // Filter by preferred cuisines
      if (preferredCuisines && preferredCuisines.trim()) {
        const cuisines = preferredCuisines.toLowerCase().split(',').map((c) => c.trim());
        filtered = filtered.filter((m) => cuisines.some((c) => (m.cuisine_type || '').toLowerCase().includes(c)));
      }

      // Greedy suggestion: pick cheapest items that fit budget
      const perMealBudget = budget / meals;
      const suggestions = [];
      let totalCost = 0;
      let mealsPlanned = 0;

      const sorted = [...filtered].sort((a, b) => {
        const aMin = Math.min(...(a.items || []).map((i) => parseFloat(i.price || 0)));
        const bMin = Math.min(...(b.items || []).map((i) => parseFloat(i.price || 0)));
        return aMin - bMin;
      });

      // eslint-disable-next-line no-restricted-syntax
      for (const menu of sorted) {
        if (mealsPlanned >= meals) break;
        const affordable = (menu.items || []).filter((i) => parseFloat(i.price) <= perMealBudget * 1.2);
        if (affordable.length > 0) {
          const chosen = affordable[0];
          const cost = parseFloat(chosen.price) * people;
          if (totalCost + cost <= budget * 1.1) {
            suggestions.push({
              menuId: menu.id,
              menuTitle: menu.title,
              menuDate: menu.menu_date,
              cookName: `${menu.cook_first_name} ${menu.cook_last_name}`,
              cuisineType: menu.cuisine_type,
              cookRating: menu.cook_rating,
              pickupLocation: menu.pickup_location,
              item: {
                id: chosen.id, name: chosen.name, price: chosen.price, dietaryTags: chosen.dietary_tags, quantity: people,
              },
              total: cost.toFixed(2),
            });
            totalCost += cost;
            mealsPlanned += 1;
          }
        }
      }

      return res.json({
        suggestions,
        summary: {
          mealsPlanned,
          totalCost: totalCost.toFixed(2),
          budget: parseFloat(budget).toFixed(2),
          remaining: (budget - totalCost).toFixed(2),
          people,
        },
        availableMenus: filtered.length,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /api/meal-plans/order — order all suggestions at once
router.post(
  '/order',
  authenticate,
  authorize(['member']),
  [
    body('suggestions').isArray({ min: 1 }),
    body('suggestions.*.menuId').isInt(),
    body('suggestions.*.item.id').isInt(),
    body('suggestions.*.item.quantity').isInt({ min: 1 }),
    body('deliveryType').isIn(['pickup', 'delivery']),
    body('deliveryAddress').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { suggestions, deliveryType, deliveryAddress } = req.body;
      const memberResult = await db.query('SELECT id FROM member_profiles WHERE user_id = $1', [req.user.userId]);
      const memberId = memberResult.rows[0].id;
      const orders = [];

      await Promise.all(suggestions.map(async (s) => {
        const orderResult = await db.query(
          `INSERT INTO orders (menu_id, member_id, cook_id, subtotal, delivery_fee, total_amount, delivery_type, status, order_date)
           SELECT $1, $3, m.cook_id, $4, 0, $4, $5, 'pending', NOW()
           FROM menus m WHERE m.id = $2 RETURNING id`,
          [s.menuId, s.menuId, memberId, parseFloat(s.item.price) * s.item.quantity, deliveryType],
        );
        const orderId = orderResult.rows[0].id;

        await db.query(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [orderId, s.item.id, s.item.quantity, parseFloat(s.item.price), parseFloat(s.item.price) * s.item.quantity],
        );

        if (deliveryAddress && deliveryType === 'delivery') {
          await db.query('UPDATE orders SET delivery_address = $1 WHERE id = $2', [deliveryAddress, orderId]);
        }
        orders.push(orderId);
        return orderId;
      }));

      return res.status(201).json({ orders, count: orders.length });
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = router;
