require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

const baseConfig = {
  port: Number(process.env.PORT || 3001),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
  },
};

const configByEnv = {
  development: {
    ...baseConfig,
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'menu_del_dia',
    },
  },
  test: {
    ...baseConfig,
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'menu_del_dia_test',
    },
  },
  production: {
    ...baseConfig,
    database: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  },
};

if (environment === 'production') {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = configByEnv[environment];
