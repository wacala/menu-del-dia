require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

// Railway provides a single DATABASE_URL; parse it if available
function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 5432),
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }
}

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
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    testEmail: process.env.EMAIL_TEST_RECIPIENT || '',
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
    database: process.env.DATABASE_URL
      ? parseDatabaseUrl(process.env.DATABASE_URL)
      : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
  },
};

if (environment === 'production') {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasIndividualVars = (
    process.env.DB_HOST && process.env.DB_USER
    && process.env.DB_PASSWORD && process.env.DB_NAME
  );

  if (!hasDbUrl && !hasIndividualVars) {
    throw new Error('Missing database configuration: set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
}

module.exports = configByEnv[environment];
