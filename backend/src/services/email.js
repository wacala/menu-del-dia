const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

async function sendVerificationEmail(toEmail, firstName, token) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Menú del Día" <${config.email.user}>`,
    to: toEmail,
    subject: 'Verifica tu correo — Menú del Día',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>¡Hola, ${firstName}!</h2>
        <p>Gracias por registrarte en <strong>Menú del Día</strong>.</p>
        <p>Por favor verifica tu correo haciendo clic en el siguiente enlace:</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verificar correo
        </a>
        <p style="margin-top:16px;color:#666;font-size:14px;">
          Este enlace expira en 24 horas.<br/>
          Si no creaste esta cuenta puedes ignorar este mensaje.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
