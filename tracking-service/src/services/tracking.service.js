import prisma from "../config/prisma.js";

const TRACKING_EVENTS = [
    "LOCATION_UPDATE",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED"
];

export const createTrackingLog = async (user, orderId, data) => {
    const {
        driverUserId,
        driverProfileId,
        lat,
        lng,
        heading,
        speed,
        eventType,
        note
    } = data;

    if (!orderId) {
        throw new Error("orderId is required");
    }

    if (lat === undefined || lng === undefined) {
        throw new Error("lat and lng are required");
    }

    const finalEventType = eventType || "LOCATION_UPDATE";

    if (!TRACKING_EVENTS.includes(finalEventType)) {
        throw new Error("Invalid tracking event type");
    }

    const finalDriverUserId =
        user.role === "DRIVER" ? user.id : driverUserId || null;

    return prisma.trackingLog.create({
        data: {
            orderId,
            driverUserId: finalDriverUserId,
            driverProfileId: driverProfileId || null,
            lat,
            lng,
            heading,
            speed,
            eventType: finalEventType,
            note
        }
    });
};

export const getCurrentLocation = async (orderId) => {
    const currentLocation = await prisma.trackingLog.findFirst({
        where: {
            orderId
        },
        orderBy: {
            recordedAt: "desc"
        }
    });

    if (!currentLocation) {
        throw new Error("No tracking data found for this order");
    }

    return currentLocation;
};

export const getTrackingHistory = async (orderId, query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where = {
        orderId
    };

    if (query.eventType) {
        where.eventType = query.eventType;
    }

    const [logs, total] = await Promise.all([
        prisma.trackingLog.findMany({
            where,
            orderBy: {
                recordedAt: "asc"
            },
            skip,
            take: limit
        }),
        prisma.trackingLog.count({
            where
        })
    ]);

    return {
        items: logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getTrackingRoute = async (orderId) => {
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