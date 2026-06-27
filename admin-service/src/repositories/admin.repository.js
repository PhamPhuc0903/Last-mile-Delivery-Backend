import prisma from "../config/prisma.js";

const userSelect = {
    id: true,
    fullName: true,
    phone: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true
};

export const countUsers = async (where = {}) => {
    return prisma.user.count({
        where
    });
};

export const findUsers = async ({ where, skip, limit }) => {
    return prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            createdAt: "desc"
        },
        select: userSelect
    });
};

export const findUserById = async (id) => {
    return prisma.user.findUnique({
        where: {
            id
        },
        select: userSelect
    });
};

export const findUserByContact = async ({ phone, email, excludedUserId = null }) => {
    const conditions = [];

    if (phone) {
        conditions.push({ phone });
    }

    if (email) {
        conditions.push({ email });
    }

    if (conditions.length === 0) {
        return null;
    }

    return prisma.user.findFirst({
        where: {
            OR: conditions,
            ...(excludedUserId
                ? {
                    id: {
                        not: excludedUserId
                    }
                }
                : {})
        }
    });
};

export const createUser = async ({
                                     fullName,
                                     phone,
                                     email,
                                     passwordHash,
                                     role
                                 }) => {
    return prisma.user.create({
        data: {
            fullName,
            phone,
            email: email || null,
            passwordHash,
            role,
            status: "ACTIVE"
        },
        select: userSelect
    });
};

export const updateUser = async ({ id, data }) => {
    return prisma.user.update({
        where: {
            id
        },
        data,
        select: userSelect
    });
};

export const getDashboardOrderCount = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM orders.orders
    `;
};

export const getDashboardTodayOrderCount = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM orders.orders
        WHERE created_at::date = CURRENT_DATE
    `;
};

export const getDashboardDriverProfileCount = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM drivers.drivers
    `;
};

export const getDashboardPaymentCount = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM payments.payment_transactions
    `;
};

export const getDashboardPaidRevenue = async () => {
    return prisma.$queryRaw`
        SELECT COALESCE(SUM(amount), 0)::text AS total
        FROM payments.payment_transactions
        WHERE payment_status = 'PAID'
    `;
};

export const getOrderStatusStats = async () => {
    return prisma.$queryRaw`
        SELECT status::text AS status, COUNT(*)::int AS count
        FROM orders.orders
        GROUP BY status
        ORDER BY status
    `;
};

export const getDriverStatusStats = async () => {
    return prisma.$queryRaw`
        SELECT status::text AS status, COUNT(*)::int AS count
        FROM drivers.drivers
        GROUP BY status
        ORDER BY status
    `;
};

export const getPaymentStatusStats = async () => {
    return prisma.$queryRaw`
        SELECT payment_status::text AS status, COUNT(*)::int AS count
        FROM payments.payment_transactions
        GROUP BY payment_status
        ORDER BY payment_status
    `;
};

export const findOrders = async ({ limit, skip }) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM orders.orders
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        limit,
        skip
    );
};

export const countOrders = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM orders.orders
    `;
};

export const findOrderById = async (id) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM orders.orders
        WHERE id = $1::uuid
        LIMIT 1
        `,
        id
    );
};

export const findOrderItems = async (orderId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM orders.order_items
        WHERE order_id = $1::uuid
        ORDER BY created_at ASC
        `,
        orderId
    );
};

export const findOrderTimeline = async (orderId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM orders.order_status_logs
        WHERE order_id = $1::uuid
        ORDER BY created_at ASC
        `,
        orderId
    );
};

export const findOrderPayments = async (orderId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM payments.payment_transactions
        WHERE order_id = $1::uuid
        ORDER BY created_at DESC
        `,
        orderId
    );
};

export const findOrderTrackingLogs = async (orderId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM tracking.tracking_logs
        WHERE order_id = $1::uuid
        ORDER BY recorded_at DESC
        LIMIT 20
        `,
        orderId
    );
};

export const findOrderAssignments = async (orderId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM dispatch.delivery_assignments
        WHERE order_id = $1::uuid
        ORDER BY created_at DESC
        `,
        orderId
    );
};

export const findDrivers = async ({ limit, skip }) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM drivers.drivers
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        limit,
        skip
    );
};

export const countDrivers = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM drivers.drivers
    `;
};

export const findDriverById = async (id) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM drivers.drivers
        WHERE id = $1::uuid
        LIMIT 1
        `,
        id
    );
};

export const findDriverLocations = async (driverProfileId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM drivers.driver_locations
        WHERE driver_id = $1::uuid
        ORDER BY recorded_at DESC
        LIMIT 10
        `,
        driverProfileId
    );
};

export const findDriverAssignments = async (driverProfileId) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM dispatch.delivery_assignments
        WHERE driver_profile_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT 20
        `,
        driverProfileId
    );
};

export const updateDriverStatus = async ({ id, status }) => {
    return prisma.$queryRawUnsafe(
        `
        UPDATE drivers.drivers
        SET status = $2::drivers."DriverStatus",
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
        RETURNING *
        `,
        id,
        status
    );
};

export const findPayments = async ({ limit, skip }) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM payments.payment_transactions
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        limit,
        skip
    );
};

export const countPayments = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM payments.payment_transactions
    `;
};

export const findAiRecommendationLogs = async ({ limit, skip }) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM ai.ai_driver_recommendation_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        limit,
        skip
    );
};

export const countAiRecommendationLogs = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM ai.ai_driver_recommendation_logs
    `;
};

export const findAiAnomalyLogs = async ({ limit, skip }) => {
    return prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM ai.ai_anomaly_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        limit,
        skip
    );
};

export const countAiAnomalyLogs = async () => {
    return prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM ai.ai_anomaly_logs
    `;
};