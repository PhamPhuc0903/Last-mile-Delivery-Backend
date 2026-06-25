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