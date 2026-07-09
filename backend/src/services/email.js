const { Resend } = require('resend');
const config = require('../config');

const resend = new Resend(config.email.resendApiKey);

async function sendVerificationEmail(toEmail, firstName, token) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  // In development/testing, Resend only allows sending to the account owner email
  const recipient = config.email.testEmail || toEmail;

  await resend.emails.send({
    from: 'Menú del Día <onboarding@resend.dev>',
    to: recipient,
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
