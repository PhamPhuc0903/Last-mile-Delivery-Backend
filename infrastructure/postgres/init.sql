CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TYPE auth."UserRole" AS ENUM ('ADMIN', 'CUSTOMER', 'DRIVER');
CREATE TYPE auth."UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

CREATE TABLE IF NOT EXISTS auth.users (
                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    role auth."UserRole" NOT NULL,
    status auth."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE SCHEMA IF NOT EXISTS user_profile;

CREATE TABLE IF NOT EXISTS user_profile.profiles (
                                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS user_profile.addresses (
                                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    label VARCHAR(50),
    receiver_name VARCHAR(100),
    receiver_phone VARCHAR(20),
    address_line TEXT NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_addresses_user_id
    ON user_profile.addresses(user_id);

CREATE SCHEMA IF NOT EXISTS orders;

DO $$
BEGIN
CREATE TYPE orders."OrderStatus" AS ENUM (
        'PENDING',
        'CONFIRMED',
        'ASSIGNED',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE orders."PaymentMethod" AS ENUM (
        'COD',
        'BANK_TRANSFER',
        'MOMO',
        'VNPAY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE orders."PaymentStatus" AS ENUM (
        'UNPAID',
        'PAID',
        'REFUNDED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders.orders (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL,

    pickup_address_line TEXT NOT NULL,
    pickup_ward VARCHAR(100),
    pickup_district VARCHAR(100),
    pickup_city VARCHAR(100),
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,

    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,

    delivery_address_line TEXT NOT NULL,
    delivery_ward VARCHAR(100),
    delivery_district VARCHAR(100),
    delivery_city VARCHAR(100),
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,

    distance_km DOUBLE PRECISION,
    shipping_fee DOUBLE PRECISION,

    payment_method orders."PaymentMethod" NOT NULL DEFAULT 'COD',
    payment_status orders."PaymentStatus" NOT NULL DEFAULT 'UNPAID',

    status orders."OrderStatus" NOT NULL DEFAULT 'PENDING',

    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS orders.order_items (
                                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,

    item_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight_kg DOUBLE PRECISION,
    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS orders.order_status_logs (
                                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,

    status orders."OrderStatus" NOT NULL,
    changed_by UUID,
    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
    ON orders.orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders.orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON orders.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id
    ON orders.order_status_logs(order_id);

CREATE SCHEMA IF NOT EXISTS payments;

DO $$
BEGIN
CREATE TYPE payments."PaymentMethod" AS ENUM (
        'COD',
        'BANK_TRANSFER',
        'MOMO',
        'VNPAY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE payments."PaymentStatus" AS ENUM (
        'UNPAID',
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE payments."TransactionType" AS ENUM (
        'PAYMENT',
        'REFUND',
        'COD_COLLECTION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS payments.payment_transactions (
                                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,
    customer_id UUID NOT NULL,

    amount DOUBLE PRECISION NOT NULL,

    payment_method payments."PaymentMethod" NOT NULL,
    payment_status payments."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    transaction_type payments."TransactionType" NOT NULL DEFAULT 'PAYMENT',

    provider VARCHAR(50),
    provider_transaction_id VARCHAR(150),

    note TEXT,
    failure_reason TEXT,

    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id
    ON payments.payment_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id
    ON payments.payment_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
    ON payments.payment_transactions(payment_status);