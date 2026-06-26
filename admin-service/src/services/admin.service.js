import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

const normalize = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) => {
            if (typeof value === "bigint") {
                return Number(value);
            }

            return value;
        })
    );
};

const getPagination = (query) => {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip
    };
};

export const getDashboardStats = async () => {
    const [
        totalUsers,
        totalAdmins,
        totalCustomers,
        totalDrivers,
        activeUsers,
        blockedUsers,
        totalOrders,
        todayOrders,
        totalDriverProfiles,
        totalPayments,
        paidRevenue
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "DRIVER" } }),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { status: "BLOCKED" } }),

        prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM orders.orders
    `,

        prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM orders.orders
      WHERE created_at::date = CURRENT_DATE
    `,

        prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM drivers.drivers
    `,

        prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM payments.payment_transactions
    `,

        prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0)::text AS total
      FROM payments.payment_transactions
      WHERE payment_status = 'PAID'
    `
    ]);

    const orderStatusStats = await prisma.$queryRaw`
    SELECT status::text AS status, COUNT(*)::int AS count
    FROM orders.orders
    GROUP BY status
    ORDER BY status
  `;

    const driverStatusStats = await prisma.$queryRaw`
    SELECT status::text AS status, COUNT(*)::int AS count
    FROM drivers.drivers
    GROUP BY status
    ORDER BY status
  `;

    const paymentStatusStats = await prisma.$queryRaw`
    SELECT payment_status::text AS status, COUNT(*)::int AS count
    FROM payments.payment_transactions
    GROUP BY payment_status
    ORDER BY payment_status
  `;

    return normalize({
        users: {
            total: totalUsers,
            admins: totalAdmins,
            customers: totalCustomers,
            drivers: totalDrivers,
            active: activeUsers,
            blocked: blockedUsers
        },
        orders: {
            total: totalOrders[0]?.count || 0,
            today: todayOrders[0]?.count || 0,
            byStatus: orderStatusStats
        },
        drivers: {
            total: totalDriverProfiles[0]?.count || 0,
            byStatus: driverStatusStats
        },
        payments: {
            total: totalPayments[0]?.count || 0,
            paidRevenue: Number(paidRevenue[0]?.total || 0),
            byStatus: paymentStatusStats
        }
    });
};

export const getUsers = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const where = {
        status: query.status || undefined,
        role: query.role || undefined,
        OR: query.search
            ? [
                {
                    fullName: {
                        contains: query.search,
                        mode: "insensitive"
                    }
                },
                {
                    phone: {
                        contains: query.search,
                        mode: "insensitive"
                    }
                },
                {
                    email: {
                        contains: query.search,
                        mode: "insensitive"
                    }
                }
            ]
            : undefined
    };

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        }),
        prisma.user.count({ where })
    ]);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getUserById = async (id) => {
    const user = await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const createUser = async (data) => {
    const { fullName, phone, email, password, role } = data;

    if (!fullName || !phone || !password || !role) {
        throw new Error("fullName, phone, password and role are required");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.create({
        data: {
            fullName,
            phone,
            email: email || null,
            passwordHash,
            role,
            status: "ACTIVE"
        },
        select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
        }
    });
};

export const updateUser = async (id, data) => {
    await getUserById(id);

    const allowedData = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        role: data.role,
        status: data.status,
        updatedAt: new Date()
    };

    Object.keys(allowedData).forEach((key) => {
        if (allowedData[key] === undefined) {
            delete allowedData[key];
        }
    });

    return prisma.user.update({
        where: {
            id
        },
        data: allowedData,
        select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            updatedAt: true
        }
    });
};

export const blockUser = async (id) => {
    await getUserById(id);

    return prisma.user.update({
        where: {
            id
        },
        data: {
            status: "BLOCKED",
            updatedAt: new Date()
        },
        select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            status: true
        }
    });
};

export const unblockUser = async (id) => {
    await getUserById(id);

    return prisma.user.update({
        where: {
            id
        },
        data: {
            status: "ACTIVE",
            updatedAt: new Date()
        },
        select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            status: true
        }
    });
};

export const deleteUser = async (id) => {
    await getUserById(id);

    return prisma.user.update({
        where: {
            id
        },
        data: {
            status: "DELETED",
            updatedAt: new Date()
        },
        select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            status: true
        }
    });
};

export const getOrders = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const items = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM orders.orders
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
        limit,
        skip
    );

    const total = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM orders.orders
  `;

    return normalize({
        items,
        pagination: {
            page,
            limit,
            total: total[0]?.count || 0,
            totalPages: Math.ceil((total[0]?.count || 0) / limit)
        }
    });
};

export const getDrivers = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const items = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM drivers.drivers
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
        limit,
        skip
    );

    const total = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM drivers.drivers
  `;

    return normalize({
        items,
        pagination: {
            page,
            limit,
            total: total[0]?.count || 0,
            totalPages: Math.ceil((total[0]?.count || 0) / limit)
        }
    });
};

export const getPayments = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const items = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM payments.payment_transactions
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
        limit,
        skip
    );

    const total = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM payments.payment_transactions
  `;

    return normalize({
        items,
        pagination: {
            page,
            limit,
            total: total[0]?.count || 0,
            totalPages: Math.ceil((total[0]?.count || 0) / limit)
        }
    });
};

export const getOrderById = async (id) => {
    const orders = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM orders.orders
    WHERE id = $1::uuid
    LIMIT 1
    `,
        id
    );

    if (!orders.length) {
        throw new Error("Order not found");
    }

    const items = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM orders.order_items
    WHERE order_id = $1::uuid
    ORDER BY created_at ASC
    `,
        id
    );

    const timeline = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM orders.order_status_logs
    WHERE order_id = $1::uuid
    ORDER BY created_at ASC
    `,
        id
    );

    const payments = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM payments.payment_transactions
    WHERE order_id = $1::uuid
    ORDER BY created_at DESC
    `,
        id
    );

    const trackingLogs = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM tracking.tracking_logs
    WHERE order_id = $1::uuid
    ORDER BY created_at DESC
    LIMIT 20
    `,
        id
    );

    const assignments = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM dispatch.delivery_assignments
    WHERE order_id = $1::uuid
    ORDER BY created_at DESC
    `,
        id
    );

    return normalize({
        order: orders[0],
        items,
        timeline,
        payments,
        trackingLogs,
        assignments
    });
};

export const getDriverById = async (id) => {
    const drivers = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM drivers.drivers
    WHERE id = $1::uuid
    LIMIT 1
    `,
        id
    );

    if (!drivers.length) {
        throw new Error("Driver not found");
    }

    const locations = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM drivers.driver_locations
    WHERE driver_id = $1::uuid
    ORDER BY updated_at DESC
    LIMIT 10
    `,
        id
    );

    const assignments = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM dispatch.delivery_assignments
    WHERE driver_id = $1::uuid
    ORDER BY created_at DESC
    LIMIT 20
    `,
        id
    );

    return normalize({
        driver: drivers[0],
        recentLocations: locations,
        recentAssignments: assignments
    });
};

export const updateDriverStatus = async (id, data) => {
    const { status } = data;

    const allowedStatuses = ["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"];

    if (!status || !allowedStatuses.includes(status)) {
        throw new Error(
            "status must be one of: OFFLINE, ONLINE, BUSY, SUSPENDED"
        );
    }

    const drivers = await prisma.$queryRawUnsafe(
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

    if (!drivers.length) {
        throw new Error("Driver not found");
    }

    return normalize(drivers[0]);
};

export const getAiRecommendationLogs = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const items = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM ai.ai_driver_recommendation_logs
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
        limit,
        skip
    );

    const total = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM ai.ai_driver_recommendation_logs
  `;

    return normalize({
        items,
        pagination: {
            page,
            limit,
            total: total[0]?.count || 0,
            totalPages: Math.ceil((total[0]?.count || 0) / limit)
        }
    });
};

export const getAiAnomalyLogs = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const items = await prisma.$queryRawUnsafe(
        `
    SELECT *
    FROM ai.ai_anomaly_logs
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
        limit,
        skip
    );

    const total = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM ai.ai_anomaly_logs
  `;

    return normalize({
        items,
        pagination: {
            page,
            limit,
            total: total[0]?.count || 0,
            totalPages: Math.ceil((total[0]?.count || 0) / limit)
        }
    });
};

const checkServiceHealth = async (name, url) => {
    const startedAt = Date.now();

    try {
        const response = await fetch(`${url}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(3000)
        });

        const responseTimeMs = Date.now() - startedAt;

        if (!response.ok) {
            return {
                name,
                url,
                status: "DOWN",
                responseTimeMs,
                error: `HTTP ${response.status}`
            };
        }

        const data = await response.json().catch(() => null);

        return {
            name,
            url,
            status: "UP",
            responseTimeMs,
            data
        };
    } catch (error) {
        return {
            name,
            url,
            status: "DOWN",
            responseTimeMs: Date.now() - startedAt,
            error: error.message
        };
    }
};

export const getSystemHealth = async () => {
    const services = [
        {
            name: "auth-service",
            url: process.env.AUTH_SERVICE_URL || "http://localhost:3001"
        },
        {
            name: "user-service",
            url: process.env.USER_SERVICE_URL || "http://localhost:3008"
        },
        {
            name: "order-service",
            url: process.env.ORDER_SERVICE_URL || "http://localhost:3002"
        },
        {
            name: "payment-service",
            url: process.env.PAYMENT_SERVICE_URL || "http://localhost:3011"
        },
        {
            name: "driver-service",
            url: process.env.DRIVER_SERVICE_URL || "http://localhost:3003"
        },
        {
            name: "tracking-service",
            url: process.env.TRACKING_SERVICE_URL || "http://localhost:3004"
        },
        {
            name: "dispatch-service",
            url: process.env.DISPATCH_SERVICE_URL || "http://localhost:3005"
        },
        {
            name: "notification-service",
            url:
                process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"
        },
        {
            name: "ai-service",
            url: process.env.AI_SERVICE_URL || "http://localhost:3007"
        },
        {
            name: "chatbot-service",
            url: process.env.CHATBOT_SERVICE_URL || "http://localhost:3010"
        }
    ];

    const results = await Promise.all(
        services.map((service) =>
            checkServiceHealth(service.name, service.url)
        )
    );

    const up = results.filter((item) => item.status === "UP").length;
    const down = results.filter((item) => item.status === "DOWN").length;

    return {
        status: down === 0 ? "UP" : "DEGRADED",
        summary: {
            total: results.length,
            up,
            down
        },
        services: results,
        checkedAt: new Date().toISOString()
    };
};