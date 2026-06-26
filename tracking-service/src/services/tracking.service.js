import * as trackingRepository from "../repositories/tracking.repository.js";

const TRACKING_EVENTS = [
    "LOCATION_UPDATE",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED"
];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isAdmin = (user) => user?.role === "ADMIN";
const isCustomer = (user) => user?.role === "CUSTOMER";
const isDriver = (user) => user?.role === "DRIVER";

const assertOrderExists = async (orderId) => {
    const customerId = await trackingRepository.getOrderOwnerId(orderId);

    if (!customerId) {
        throw createHttpError("Order not found", 404);
    }

    return customerId;
};

const assertCanReadTracking = async (user, orderId) => {
    const customerId = await assertOrderExists(orderId);

    if (isAdmin(user)) {
        return;
    }

    if (isCustomer(user) && customerId === user.id) {
        return;
    }

    if (isDriver(user)) {
        const assigned = await trackingRepository.isDriverAssignedToOrder(
            orderId,
            user.id
        );

        if (assigned) {
            return;
        }
    }

    throw createHttpError("Forbidden", 403);
};

const assertCanCreateTracking = async (user, orderId) => {
    await assertOrderExists(orderId);

    if (isAdmin(user)) {
        return;
    }

    if (isDriver(user)) {
        const assigned = await trackingRepository.isDriverAssignedToOrder(
            orderId,
            user.id
        );

        if (assigned) {
            return;
        }
    }

    throw createHttpError("Forbidden", 403);
};

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
        throw createHttpError("orderId is required", 400);
    }

    if (lat === undefined || lng === undefined) {
        throw createHttpError("lat and lng are required", 400);
    }

    const finalEventType = eventType || "LOCATION_UPDATE";

    if (!TRACKING_EVENTS.includes(finalEventType)) {
        throw createHttpError("Invalid tracking event type", 400);
    }

    await assertCanCreateTracking(user, orderId);

    let finalDriverUserId = null;
    let finalDriverProfileId = null;

    if (isDriver(user)) {
        finalDriverUserId = user.id;
        finalDriverProfileId =
            driverProfileId ||
            (await trackingRepository.getDriverProfileIdByUserId(user.id));
    }

    if (isAdmin(user)) {
        finalDriverUserId = driverUserId || null;
        finalDriverProfileId = driverProfileId || null;
    }

    return trackingRepository.createTrackingLog({
        orderId,
        driverUserId: finalDriverUserId,
        driverProfileId: finalDriverProfileId,
        lat,
        lng,
        heading,
        speed,
        eventType: finalEventType,
        note
    });
};

export const getCurrentLocation = async (user, orderId) => {
    await assertCanReadTracking(user, orderId);

    const currentLocation = await trackingRepository.findCurrentLocationByOrderId(
        orderId
    );

    if (!currentLocation) {
        throw createHttpError("No tracking data found for this order", 404);
    }

    return currentLocation;
};

export const getTrackingHistory = async (user, orderId, query = {}) => {
    await assertCanReadTracking(user, orderId);

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 50;
    const skip = (page - 1) * limit;

    const where = {
        orderId
    };

    if (query.eventType) {
        if (!TRACKING_EVENTS.includes(query.eventType)) {
            throw createHttpError("Invalid tracking event type", 400);
        }

        where.eventType = query.eventType;
    }

    const [logs, total] = await Promise.all([
        trackingRepository.findTrackingLogs({
            where,
            skip,
            limit
        }),
        trackingRepository.countTrackingLogs(where)
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

export const getTrackingRoute = async (user, orderId) => {
    await assertCanReadTracking(user, orderId);

    return trackingRepository.findTrackingRouteByOrderId(orderId);
};