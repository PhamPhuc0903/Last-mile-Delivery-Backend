import prisma from "../config/prisma.js";

export const getOrderOwnerId = async (orderId) => {
    const rows = await prisma.$queryRaw`
        SELECT customer_id::text AS "customerId"
        FROM orders.orders
        WHERE id = ${orderId}::uuid
        LIMIT 1
    `;

    return rows[0]?.customerId || null;
};

export const getDriverProfileIdByUserId = async (userId) => {
    const rows = await prisma.$queryRaw`
        SELECT id::text AS id
        FROM drivers.drivers
        WHERE user_id = ${userId}::uuid
        LIMIT 1
    `;

    return rows[0]?.id || null;
};

export const isDriverAssignedToOrder = async (orderId, userId) => {
    const rows = await prisma.$queryRaw`
        SELECT da.id::text AS id
        FROM dispatch.delivery_assignments da
        WHERE da.order_id = ${orderId}::uuid
          AND da.driver_user_id = ${userId}::uuid
          AND da.status IN ('PENDING', 'ACCEPTED', 'COMPLETED')
        LIMIT 1
    `;

    return rows.length > 0;
};

export const createTrackingLog = async ({
                                            orderId,
                                            driverUserId,
                                            driverProfileId,
                                            lat,
                                            lng,
                                            heading,
                                            speed,
                                            eventType,
                                            note
                                        }) => {
    return prisma.trackingLog.create({
        data: {
            orderId,
            driverUserId,
            driverProfileId,
            lat,
            lng,
            heading,
            speed,
            eventType,
            note
        }
    });
};

export const findCurrentLocationByOrderId = async (orderId) => {
    return prisma.trackingLog.findFirst({
        where: {
            orderId
        },
        orderBy: {
            recordedAt: "desc"
        }
    });
};

export const findTrackingLogs = async ({ where, skip, limit }) => {
    return prisma.trackingLog.findMany({
        where,
        orderBy: {
            recordedAt: "asc"
        },
        skip,
        take: limit
    });
};

export const countTrackingLogs = async (where) => {
    return prisma.trackingLog.count({
        where
    });
};

export const findTrackingRouteByOrderId = async (orderId) => {
    return prisma.trackingLog.findMany({
        where: {
            orderId
        },
        select: {
            id: true,
            lat: true,
            lng: true,
            heading: true,
            speed: true,
            eventType: true,
            recordedAt: true
        },
        orderBy: {
            recordedAt: "asc"
        }
    });
};