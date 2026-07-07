const db = require('../src/config/database');

const schema = `
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ratings_reviews CASCADE;
DROP TABLE IF EXISTS member_favorites CASCADE;
DROP TABLE IF EXISTS cook_payouts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS member_addresses CASCADE;
DROP TABLE IF EXISTS member_profiles CASCADE;
DROP TABLE IF EXISTS cook_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS delivery_type CASCADE;
DROP TYPE IF EXISTS cook_status CASCADE;
DROP TYPE IF EXISTS payout_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS menu_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('cook', 'member', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE menu_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'stripe');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE cook_status AS ENUM ('pending_approval', 'approved', 'rejected');
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery');
CREATE TYPE notification_type AS ENUM ('order_received', 'order_confirmed', 'order_ready', 'order_delivered', 'payment_received', 'system');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url VARCHAR(500),
  role user_role NOT NULL,
  status user_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cook_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cuisine_type VARCHAR(100),
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  total_orders INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,
  stripe_account_id VARCHAR(255),
  bank_account_last4 VARCHAR(4),
  status cook_status DEFAULT 'pending_approval',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_address TEXT,
  default_address_lat DECIMAL(10,8),
  default_address_lng DECIMAL(11,8),
  phone_verified BOOLEAN DEFAULT FALSE,
  total_orders INT DEFAULT 0,
  favorite_cooks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_addresses (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  label VARCHAR(50),
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menus (
  id BIGSERIAL PRIMARY KEY,
  cook_id BIGINT NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL,
  title VARCHAR(200),
  description TEXT,
  order_start_time TIMESTAMP NOT NULL,
  order_end_time TIMESTAMP NOT NULL,
  pickup_available BOOLEAN DEFAULT TRUE,
  delivery_available BOOLEAN DEFAULT FALSE,
  delivery_fee DECIMAL(10,2),
  delivery_radius_km DECIMAL(5,2),
  pickup_location TEXT,
  pickup_location_lat DECIMAL(10,8),
  pickup_location_lng DECIMAL(11,8),
  status menu_status DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
  id BIGSERIAL PRIMARY KEY,
  menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INT NOT NULL,
  quantity_sold INT DEFAULT 0,
  ingredients TEXT,
  allergens TEXT,
  dietary_tags TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  menu_id BIGINT NOT NULL REFERENCES menus(id),
  member_id BIGINT NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  cook_id BIGINT NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_type delivery_type NOT NULL,
  delivery_address TEXT,
  delivery_address_lat DECIMAL(10,8),
  delivery_address_lng DECIMAL(11,8),
  pickup_time TIMESTAMP,
  estimated_delivery_time TIMESTAMP,
  payment_method payment_method DEFAULT 'cash',
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  special_instructions TEXT,
  cook_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  ready_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cook_id BIGINT NOT NULL REFERENCES cook_profiles(id),
  member_id BIGINT NOT NULL REFERENCES member_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cook_payouts (
  id BIGSERIAL PRIMARY KEY,
  cook_id BIGINT NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  total_orders INT NOT NULL,
  payout_status payout_status DEFAULT 'pending',
  stripe_payout_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE member_favorites (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  cook_id BIGINT NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, cook_id)
);

CREATE TABLE ratings_reviews (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cook_id BIGINT NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'system',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cook_profiles_user_id ON cook_profiles(user_id);
CREATE INDEX idx_cook_profiles_status ON cook_profiles(status);
CREATE INDEX idx_member_profiles_user_id ON member_profiles(user_id);
CREATE INDEX idx_menus_cook_id ON menus(cook_id);
CREATE INDEX idx_menus_menu_date ON menus(menu_date);
CREATE INDEX idx_menus_status ON menus(status);
CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_orders_cook_id ON orders(cook_id);
CREATE INDEX idx_orders_menu_id ON orders(menu_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_cook_id ON payments(cook_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_cook_payouts_cook_id ON cook_payouts(cook_id);
CREATE INDEX idx_member_favorites_member_id ON member_favorites(member_id);
CREATE INDEX idx_member_favorites_cook_id ON member_favorites(cook_id);
CREATE INDEX idx_ratings_cook_id ON ratings_reviews(cook_id);
CREATE INDEX idx_ratings_order_id ON ratings_reviews(order_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
`;

async function migrate() {
  try {
    console.log('Starting database migration...');
    await db.query(schema);
    console.log('Database migration completed successfully');
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await db.pool.end();
    process.exit(1);
  }
}

migrate();
