const Sentry = require('@sentry/node');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Request error:', err);

  if (process.env.SENTRY_DSN && (err.status || 500) >= 500) {
    Sentry.captureException(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
};

module.exports = { errorHandler };
