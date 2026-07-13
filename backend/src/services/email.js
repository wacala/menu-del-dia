const { Resend } = require('resend');
const config = require('../config');

const resend = new Resend(config.email.resendApiKey);

async function sendVerificationEmail(toEmail, firstName, token) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const deepLink = `menu-del-dia://verify?token=${token}`;

  // In development/testing, Resend only allows sending to the account owner email
  const recipient = config.email.testEmail || toEmail;

  await resend.emails.send({
    from: 'Menú del Día <onboarding@resend.dev>',
    to: recipient,
    subject: firstName
      ? `${firstName}, verifica tu correo — Menú del Día`
      : 'Verifica tu correo — Menú del Día',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:440px;margin:0 auto;padding:32px 16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;">🍽️</span>
        </div>
        <h2 style="color:#292524;margin:0 0 8px;">¡Hola${firstName ? `, ${firstName}` : ''}!</h2>
        <p style="color:#78716c;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Gracias por unirte a <strong style="color:#292524;">Menú del Día</strong>.
          Solo falta un paso para activar tu cuenta.
        </p>
        <a href="${verifyUrl}"
           style="display:block;padding:14px 24px;background:#f97316;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;text-align:center;margin-bottom:20px;">
          Verificar mi cuenta
        </a>
        <p style="color:#a8a29e;font-size:12px;line-height:1.5;margin:0 0 16px;">
          Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
        </p>
        <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0;" />
        <p style="color:#a8a29e;font-size:11px;text-align:center;margin:0;">
          Si tienes la app instalada, <a href="${deepLink}" style="color:#f97316;">abrir en la app</a>.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
