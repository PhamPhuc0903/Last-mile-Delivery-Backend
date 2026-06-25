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

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS drivers;

DO $$
BEGIN
CREATE TYPE drivers."DriverStatus" AS ENUM (
        'OFFLINE',
        'ONLINE',
        'BUSY',
        'SUSPENDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE drivers."DriverVerificationStatus" AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE drivers."VehicleType" AS ENUM (
        'MOTORBIKE',
        'CAR',
        'VAN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS drivers.drivers (
                                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL,

    license_number VARCHAR(100),
    vehicle_type drivers."VehicleType" NOT NULL DEFAULT 'MOTORBIKE',
    vehicle_plate VARCHAR(50),

    status drivers."DriverStatus" NOT NULL DEFAULT 'OFFLINE',
    verification_status drivers."DriverVerificationStatus" NOT NULL DEFAULT 'PENDING',

    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,

    rating DOUBLE PRECISION DEFAULT 5,
    total_deliveries INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS drivers.driver_locations (
                                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    driver_id UUID NOT NULL REFERENCES drivers.drivers(id) ON DELETE CASCADE,

    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_drivers_user_id
    ON drivers.drivers(user_id);

CREATE INDEX IF NOT EXISTS idx_drivers_status
    ON drivers.drivers(status);

CREATE INDEX IF NOT EXISTS idx_drivers_verification_status
    ON drivers.drivers(verification_status);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id
    ON drivers.driver_locations(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at
    ON drivers.driver_locations(recorded_at);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS dispatch;

DO $$
BEGIN
CREATE TYPE dispatch."AssignmentStatus" AS ENUM (
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'CANCELLED',
        'COMPLETED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS dispatch.delivery_assignments (
                                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,

    driver_user_id UUID NOT NULL,
    driver_profile_id UUID,

    assigned_by UUID,

    status dispatch."AssignmentStatus" NOT NULL DEFAULT 'PENDING',

    reject_reason TEXT,
    note TEXT,

    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id
    ON dispatch.delivery_assignments(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver_user_id
    ON dispatch.delivery_assignments(driver_user_id);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status
    ON dispatch.delivery_assignments(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment_order
    ON dispatch.delivery_assignments(order_id)
    WHERE status IN ('PENDING', 'ACCEPTED');

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment_driver
    ON dispatch.delivery_assignments(driver_user_id)
    WHERE status IN ('PENDING', 'ACCEPTED');

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS tracking;

DO $$
BEGIN
CREATE TYPE tracking."TrackingEventType" AS ENUM (
        'LOCATION_UPDATE',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tracking.tracking_logs (
                                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,

    driver_user_id UUID,
    driver_profile_id UUID,

    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,

    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,

    event_type tracking."TrackingEventType" NOT NULL DEFAULT 'LOCATION_UPDATE',

    note TEXT,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_tracking_logs_order_id
    ON tracking.tracking_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_driver_user_id
    ON tracking.tracking_logs(driver_user_id);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_recorded_at
    ON tracking.tracking_logs(recorded_at);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS notifications;

DO $$
BEGIN
CREATE TYPE notifications."NotificationType" AS ENUM (
        'ORDER',
        'PAYMENT',
        'DRIVER',
        'DISPATCH',
        'SYSTEM',
        'PROMOTION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE notifications."NotificationChannel" AS ENUM (
        'IN_APP',
        'EMAIL',
        'SMS',
        'PUSH'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
CREATE TYPE notifications."NotificationStatus" AS ENUM (
        'UNREAD',
        'READ'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications.notifications (
                                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    type notifications."NotificationType" NOT NULL DEFAULT 'SYSTEM',
    channel notifications."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    status notifications."NotificationStatus" NOT NULL DEFAULT 'UNREAD',

    metadata JSONB,

    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status
    ON notifications.notifications(status);

CREATE INDEX IF NOT EXISTS idx_notifications_type
    ON notifications.notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications.notifications(created_at);