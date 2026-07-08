const express = require('express');
const twilio = require('twilio');

const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

const getClient = () => {
  const { accountSid, authToken } = config.twilio;
  if (!accountSid || !authToken || accountSid === '') return null;
  return twilio(accountSid, authToken);
};

const sendWhatsApp = async (to, body) => {
  const client = getClient();
  if (!client) {
    console.log(`[WhatsApp MOCK] To: ${to}\n${body}`);
    return { mock: true };
  }
  const from = config.twilio.whatsappFrom;
  return client.messages.create({ from, to: `whatsapp:${to}`, body });
};

const orderStatusMessages = {
  confirmed: (order) => `✅ *Menú del Día* — Tu pedido #${order.order_number} ha sido confirmado. ¡Ya lo estamos preparando!`,
  ready: (order) => `🟢 *Menú del Día* — Tu pedido #${order.order_number} está listo para recoger. ¡Buen provecho!`,
  delivered: (order) => `🎉 *Menú del Día* — Tu pedido #${order.order_number} ha sido entregado. Gracias por tu compra.`,
  cancelled: (order) => `❌ *Menú del Día* — Tu pedido #${order.order_number} ha sido cancelado. Disculpa los inconvenientes.`,
  placed: (order) => `⏳ *Menú del Día* — Hemos recibido tu pedido #${order.order_number} por $${order.total_amount}. Espera confirmación del cocinero.`,
};

// POST /api/notifications/order/:id - manually trigger notification (cook or admin)
router.post('/order/:id', authenticate, authorize(['cook']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { messageType } = req.body;

    if (!orderStatusMessages[messageType]) {
      return res.status(400).json({ message: `Invalid messageType. Use: ${Object.keys(orderStatusMessages).join(', ')}` });
    }

    const result = await db.query(
      `SELECT o.order_number, o.total_amount,
              u.phone AS member_phone, u.first_name AS member_name
       FROM orders o
       JOIN member_profiles mp ON mp.id = o.member_id
       JOIN users u ON u.id = mp.user_id
       WHERE o.id = $1 AND o.cook_id = (SELECT id FROM cook_profiles WHERE user_id = $2)`,
      [id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    if (!order.member_phone) {
      return res.status(400).json({ message: 'Member has no phone number on file' });
    }

    const message = orderStatusMessages[messageType](order);
    await sendWhatsApp(order.member_phone, message);

    return res.json({ message: 'Notification sent', to: order.member_phone });
  } catch (error) {
    return next(error);
  }
});

// Internal helper: notify member after order status change (used by orders route)
const notifyOrderStatus = async (orderId, status) => {
  try {
    const result = await db.query(
      `SELECT o.order_number, o.total_amount, u.phone, u.first_name
       FROM orders o
       JOIN member_profiles mp ON mp.id = o.member_id
       JOIN users u ON u.id = mp.user_id
       WHERE o.id = $1`,
      [orderId],
    );

    if (result.rows.length === 0 || !result.rows[0].phone) return;

    const order = result.rows[0];
    const msgFn = orderStatusMessages[status];
    if (!msgFn) return;

    const message = msgFn(order);
    await sendWhatsApp(order.phone, message);
  } catch (err) {
    console.error('WhatsApp notification error:', err.message);
  }
};

module.exports = router;
module.exports.notifyOrderStatus = notifyOrderStatus;
