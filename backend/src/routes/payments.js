const express = require('express');
const stripe = require('stripe');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();
const stripeClient = config.stripe.secretKey ? stripe(config.stripe.secretKey) : null;

// POST /api/payments/intent - create payment intent for an order
router.post('/intent', authenticate, authorize(['member']), async (req, res, next) => {
  try {
    if (!stripeClient) {
      return res.status(503).json({ message: 'Stripe not configured' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const orderResult = await db.query(
      `SELECT o.id, o.total_amount, o.payment_method, o.payment_status,
              u.first_name, u.last_name
       FROM orders o
       JOIN member_profiles mp ON mp.id = o.member_id
       JOIN users u ON u.id = mp.user_id
       WHERE o.id = $1 AND mp.user_id = $2`,
      [orderId, req.user.userId],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'completed') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const intent = await stripeClient.paymentIntents.create({
      amount: Math.round(parseFloat(order.total_amount) * 100),
      currency: 'usd',
      metadata: { orderId: String(order.id), userId: String(req.user.userId) },
      // eslint-disable-next-line max-len
      description: `Menú del Día – Order #${order.id} (${order.first_name} ${order.last_name})`,
    });

    await db.query(
      'UPDATE orders SET payment_method = $1, stripe_payment_intent_id = $2 WHERE id = $3',
      ['stripe', intent.id, orderId],
    );

    const { client_secret: clientSecret } = intent;
    return res.json({ clientSecret, publishableKey: config.stripe.publicKey });
  } catch (error) {
    return next(error);
  }
});

// POST /api/payments/confirm - record successful client-side payment
router.post('/confirm', authenticate, authorize(['member']), async (req, res, next) => {
  try {
    if (!stripeClient) {
      return res.status(503).json({ message: 'Stripe not configured' });
    }

    const { orderId, paymentIntentId } = req.body;
    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ message: 'orderId and paymentIntentId required' });
    }

    const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ message: `Payment not completed: ${intent.status}` });
    }

    const result = await db.query(
      `UPDATE orders SET payment_status = 'completed', stripe_payment_intent_id = $2, updated_at = NOW()
       WHERE id = $1 AND member_id = (SELECT id FROM member_profiles WHERE user_id = $3)
       RETURNING id, status, payment_status`,
      [orderId, paymentIntentId, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ message: 'Payment confirmed', order: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

// POST /api/payments/webhook - Stripe webhook (raw body required)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    if (!stripeClient) {
      return res.status(503).json({ message: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch (err) {
      return res.status(400).json({ message: `Webhook signature error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const { id: intentId, metadata } = event.data.object;
      const { orderId } = metadata;
      await db.query(
        'UPDATE orders SET payment_status = \'completed\', stripe_payment_intent_id = $1 WHERE id = $2',
        [intentId, orderId],
      );
    } else if (event.type === 'payment_intent.payment_failed') {
      const { id: intentId, metadata } = event.data.object;
      const { orderId } = metadata;
      await db.query(
        'UPDATE orders SET payment_status = \'failed\', stripe_payment_intent_id = $1 WHERE id = $2',
        [intentId, orderId],
      );
    }

    return res.json({ received: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
