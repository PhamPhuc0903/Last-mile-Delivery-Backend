import bcrypt from "bcryptjs";
import * as adminRepository from "../repositories/admin.repository.js";

const USER_ROLES = ["ADMIN", "CUSTOMER", "DRIVER"];
const USER_STATUSES = ["ACTIVE", "BLOCKED", "DELETED"];
const DRIVER_STATUSES = ["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

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

const getPagination = (query = {}) => {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip
    };
};

const assertValidUserRole = (role) => {
    if (role && !USER_ROLES.includes(role)) {
        throw createHttpError("Invalid user role", 400);
    }
};

const assertValidUserStatus = (status) => {
    if (status && !USER_STATUSES.includes(status)) {
        throw createHttpError("Invalid user status", 400);
    }
};

const assertValidDriverStatus = (status) => {
    if (!status || !DRIVER_STATUSES.includes(status)) {
        throw createHttpError(
            "status must be one of: OFFLINE, ONLINE, BUSY, SUSPENDED",
            400
        );
    }
};

const assertUniqueUserContact = async ({ phone, email }, excludedUserId = null) => {
    const existingUser = await adminRepository.findUserByContact({
        phone,
        email,
        excludedUserId
    });

    if (existingUser) {
        throw createHttpError("Phone or email already exists", 409);
    }
};

const buildPaginatedRawResult = ({ items, totalRows, page, limit }) => {
    const total = totalRows[0]?.count || 0;

    return normalize({
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
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
        paidRevenue,
        orderStatusStats,
        driverStatusStats,
        paymentStatusStats
    ] = await Promise.all([
        adminRepository.countUsers(),
        adminRepository.countUsers({ role: "ADMIN" }),
        adminRepository.countUsers({ role: "CUSTOMER" }),
        adminRepository.countUsers({ role: "DRIVER" }),
        adminRepository.countUsers({ status: "ACTIVE" }),
        adminRepository.countUsers({ status: "BLOCKED" }),
        adminRepository.getDashboardOrderCount(),
        adminRepository.getDashboardTodayOrderCount(),
        adminRepository.getDashboardDriverProfileCount(),
        adminRepository.getDashboardPaymentCount(),
        adminRepository.getDashboardPaidRevenue(),
        adminRepository.getOrderStatusStats(),
        adminRepository.getDriverStatusStats(),
        adminRepository.getPaymentStatusStats()
    ]);

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

export const getUsers = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    assertValidUserRole(query.role);
    assertValidUserStatus(query.status);

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
        adminRepository.findUsers({
            where,
            skip,
            limit
        }),
        adminRepository.countUsers(where)
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
    const user = await adminRepository.findUserById(id);

    if (!user) {
        throw createHttpError("User not found", 404);
    }

    return user;
};

export const createUser = async (data) => {
    const { fullName, phone, email, password, role } = data;

    if (!fullName || !phone || !password || !role) {
        throw createHttpError("fullName, phone, password and role are required", 400);
    }

    if (password.length < 6) {
        throw createHttpError("Password must be at least 6 characters", 400);
    }

    assertValidUserRole(role);

    await assertUniqueUserContact({
        phone,
        email
    });

    const passwordHash = await bcrypt.hash(password, 10);

    return adminRepository.createUser({
        fullName,
        phone,
        email,
        passwordHash,
        role
    });
};

export const updateUser = async (id, data) => {
    await getUserById(id);

    assertValidUserRole(data.role);
    assertValidUserStatus(data.status);

    await assertUniqueUserContact(
        {
            phone: data.phone,
            email: data.email
        },
        id
    );

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

    return adminRepository.updateUser({
        id,
        data: allowedData
    });
};

export const blockUser = async (id) => {
    const user = await getUserById(id);

    if (user.status === "DELETED") {
        throw createHttpError("Deleted user cannot be blocked", 400);
    }

    return adminRepository.updateUser({
        id,
        data: {
            status: "BLOCKED",
            updatedAt: new Date()
        }
    });
};

export const unblockUser = async (id) => {
    const user = await getUserById(id);

    if (user.status === "DELETED") {
        throw createHttpError("Deleted user cannot be unblocked", 400);
    }

    return adminRepository.updateUser({
        id,
        data: {
            status: "ACTIVE",
            updatedAt: new Date()
        }
    });
};

export const deleteUser = async (id) => {
    await getUserById(id);

    return adminRepository.updateUser({
        id,
        data: {
            status: "DELETED",
            updatedAt: new Date()
        }
    });
};

export const getOrders = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const [items, totalRows] = await Promise.all([
        adminRepository.findOrders({
            limit,
            skip
        }),
        adminRepository.countOrders()
    ]);

    return buildPaginatedRawResult({
        items,
        totalRows,
        page,
        limit
    });
};

export const getOrderById = async (id) => {
    const orders = await adminRepository.findOrderById(id);

    if (!orders.length) {
        throw createHttpError("Order not found", 404);
    }

    const [items, timeline, payments, trackingLogs, assignments] =
        await Promise.all([
            adminRepository.findOrderItems(id),
            adminRepository.findOrderTimeline(id),
            adminRepository.findOrderPayments(id),
            adminRepository.findOrderTrackingLogs(id),
            adminRepository.findOrderAssignments(id)
        ]);

    return normalize({
        order: orders[0],
        items,
        timeline,
        payments,
        trackingLogs,
        assignments
    });
};

export const getDrivers = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const [items, totalRows] = await Promise.all([
        adminRepository.findDrivers({
            limit,
            skip
        }),
        adminRepository.countDrivers()
    ]);

    return buildPaginatedRawResult({
        items,
        totalRows,
        page,
        limit
    });
};

export const getDriverById = async (id) => {
    const drivers = await adminRepository.findDriverById(id);

    if (!drivers.length) {
        throw createHttpError("Driver not found", 404);
    }

    const [locations, assignments] = await Promise.all([
        adminRepository.findDriverLocations(id),
        adminRepository.findDriverAssignments(id)
    ]);

    return normalize({
        driver: drivers[0],
        recentLocations: locations,
        recentAssignments: assignments
    });
};

export const updateDriverStatus = async (id, data) => {
    const { status } = data;

    assertValidDriverStatus(status);

    const drivers = await adminRepository.updateDriverStatus({
        id,
        status
    });

    if (!drivers.length) {
        throw createHttpError("Driver not found", 404);
    }

    return normalize(drivers[0]);
};

export const getPayments = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const [items, totalRows] = await Promise.all([
        adminRepository.findPayments({
            limit,
            skip
        }),
        adminRepository.countPayments()
    ]);

    return buildPaginatedRawResult({
        items,
        totalRows,
        page,
        limit
    });
};

export const getAiRecommendationLogs = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const [items, totalRows] = await Promise.all([
        adminRepository.findAiRecommendationLogs({
            limit,
            skip
        }),
        adminRepository.countAiRecommendationLogs()
    ]);

    return buildPaginatedRawResult({
        items,
        totalRows,
        page,
        limit
    });
};

export const getAiAnomalyLogs = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const [items, totalRows] = await Promise.all([
        adminRepository.findAiAnomalyLogs({
            limit,
            skip
        }),
        adminRepository.countAiAnomalyLogs()
    ]);

    return buildPaginatedRawResult({
        items,
        totalRows,
        page,
        limit
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
            url: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"
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
        services.map((service) => checkServiceHealth(service.name, service.url))
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