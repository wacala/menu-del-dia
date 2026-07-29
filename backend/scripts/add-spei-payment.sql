-- Add SPEI as a valid payment method
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'spei';
