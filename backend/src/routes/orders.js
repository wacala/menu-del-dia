const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyOrderStatus } = require('./notifications');

const router = express.Router();

const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${date}-${random}`;
};

// POST /api/orders - member places an order
router.post(
  '/',
  authenticate,
  authorize(['member']),
  [
    body('menuId').isInt(),
    body('items').isArray({ min: 1 }),
    body('items.*.menuItemId').isInt(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('deliveryType').isIn(['pickup', 'delivery']),
    body('deliveryAddress').optional().trim(),
    body('specialInstructions').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        menuId, items, deliveryType, deliveryAddress, specialInstructions,
      } = req.body;

      const memberResult = await db.query(
        'SELECT id FROM member_profiles WHERE user_id = $1',
        [req.user.userId],
      );

      if (memberResult.rows.length === 0) {
        return res.status(404).json({ message: 'Member profile not found' });
      }

      const memberId = memberResult.rows[0].id;

      const menuResult = await db.query(
        'SELECT * FROM menus WHERE id = $1 AND status = \'published\' AND order_end_time > NOW()',
        [menuId],
      );

      if (menuResult.rows.length === 0) {
        return res.status(400).json({ message: 'Menu not available for ordering' });
      }

      const menu = menuResult.rows[0];

      // Fetch all items in parallel
      const itemResults = await Promise.all(
        items.map((item) => db.query(
          'SELECT * FROM menu_items WHERE id = $1 AND menu_id = $2',
          [item.menuItemId, menuId],
        )),
      );

      // Validate availability and calculate totals
      const validatedItems = [];
      let subtotal = 0;

      for (let i = 0; i < items.length; i += 1) {
        const { rows } = itemResults[i];

        if (rows.length === 0) {
          return res.status(400).json({ message: `Item ${items[i].menuItemId} not found in menu` });
        }

        const menuItem = rows[0];
        const available = menuItem.quantity_available - menuItem.quantity_sold;

        if (items[i].quantity > available) {
          return res.status(400).json({
            message: `Only ${available} units of "${menuItem.name}" available`,
          });
        }

        const itemSubtotal = parseFloat(menuItem.price) * items[i].quantity;
        subtotal += itemSubtotal;
        validatedItems.push({ menuItem, quantity: items[i].quantity, subtotal: itemSubtotal });
      }

      const deliveryFee = deliveryType === 'delivery' ? parseFloat(menu.delivery_fee || 0) : 0;
      const totalAmount = subtotal + deliveryFee;
      const orderNumber = generateOrderNumber();

      const orderResult = await db.query(
        `INSERT INTO orders
           (order_number, menu_id, member_id, cook_id, subtotal, delivery_fee,
            total_amount, delivery_type, delivery_address, special_instructions, payment_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'cash')
         RETURNING *`,
        [orderNumber, menuId, memberId, menu.cook_id, subtotal,
          deliveryFee, totalAmount, deliveryType, deliveryAddress, specialInstructions],
      );

      const order = orderResult.rows[0];

      // Insert order items and update sold quantities in parallel
      await Promise.all(
        validatedItems.map(({ menuItem, quantity, subtotal: itemSubtotal }) => Promise.all([
          db.query(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
             VALUES ($1,$2,$3,$4,$5)`,
            [order.id, menuItem.id, quantity, menuItem.price, itemSubtotal],
          ),
          db.query(
            'UPDATE menu_items SET quantity_sold = quantity_sold + $1 WHERE id = $2',
            [quantity, menuItem.id],
          ),
        ])),
      );

      return res.status(201).json({
        message: 'Order placed successfully',
        order: {
          ...order,
          items: validatedItems.map(({ menuItem, quantity, subtotal: s }) => ({
            name: menuItem.name,
            quantity,
            unitPrice: menuItem.price,
            subtotal: s,
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /api/orders/my - member sees their orders
router.get('/my', authenticate, authorize(['member']), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT o.*, m.title AS menu_title, m.menu_date,
              u.first_name AS cook_first_name, u.last_name AS cook_last_name
       FROM orders o
       JOIN menus m ON m.id = o.menu_id
       JOIN cook_profiles cp ON cp.id = o.cook_id
       JOIN users u ON u.id = cp.user_id
       WHERE o.member_id = (SELECT id FROM member_profiles WHERE user_id = $1)
       ORDER BY o.created_at DESC LIMIT 50`,
      [req.user.userId],
    );

    return res.json({ orders: result.rows });
  } catch (error) {
    return next(error);
  }
});

// GET /api/orders/cook - cook sees incoming orders
router.get('/cook', authenticate, authorize(['cook']), async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT o.*,
              u.first_name AS member_first_name, u.last_name AS member_last_name,
              u.phone AS member_phone,
              json_agg(json_build_object(
                'name', mi.name, 'quantity', oi.quantity,
                'unit_price', oi.unit_price, 'subtotal', oi.subtotal
              )) AS items
       FROM orders o
       JOIN member_profiles mp ON mp.id = o.member_id
       JOIN users u ON u.id = mp.user_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE o.cook_id = (SELECT id FROM cook_profiles WHERE user_id = $1)
         AND DATE(o.created_at) = $2
       GROUP BY o.id, u.first_name, u.last_name, u.phone
       ORDER BY o.created_at DESC`,
      [req.user.userId, date],
    );

    return res.json({ orders: result.rows, date });
  } catch (error) {
    return next(error);
  }
});

// GET /api/orders/:id - order detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(`SELECT o.*,
              o.special_instructions AS notes,
              cu.first_name AS cook_first_name, cu.last_name AS cook_last_name,
              mu.first_name AS member_first_name, mu.last_name AS member_last_name
       FROM orders o
       JOIN cook_profiles cp ON cp.id = o.cook_id
       JOIN users cu ON cu.id = cp.user_id
       JOIN member_profiles mp ON mp.id = o.member_id
       JOIN users mu ON mu.id = mp.user_id
       WHERE o.id = $1`, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    const [cookCheck, memberCheck] = await Promise.all([
      db.query('SELECT id FROM cook_profiles WHERE user_id = $1 AND id = $2', [req.user.userId, order.cook_id]),
      db.query('SELECT id FROM member_profiles WHERE user_id = $1 AND id = $2', [req.user.userId, order.member_id]),
    ]);

    if (cookCheck.rows.length === 0 && memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const itemsResult = await db.query(
      `SELECT oi.quantity, oi.unit_price AS price, oi.subtotal, mi.name, mi.description
       FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [order.id],
    );

    order.items = itemsResult.rows;

    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/orders/:id/status - cook updates order status
router.put('/:id/status', authenticate, authorize(['cook']), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'ready', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }

    const timestampField = {
      confirmed: 'confirmed_at',
      ready: 'ready_at',
      delivered: 'delivered_at',
      cancelled: 'cancelled_at',
    }[status];

    const result = await db.query(
      `UPDATE orders SET status = $1, ${timestampField} = NOW(), updated_at = NOW()
       WHERE id = $2 AND cook_id = (SELECT id FROM cook_profiles WHERE user_id = $3)
       RETURNING *`,
      [status, req.params.id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found or not yours' });
    }

    // Fire-and-forget WhatsApp notification
    notifyOrderStatus(req.params.id, status).catch(() => {});

    return res.json({ order: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
