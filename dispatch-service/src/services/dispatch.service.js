import * as dispatchRepository from "../repositories/dispatch.repository.js";

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED"];

const ASSIGNMENT_STATUSES = [
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "COMPLETED",
    "EXPIRED"
];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isAdmin = (user) => user?.role === "ADMIN";
const isDriver = (user) => user?.role === "DRIVER";

const assertAdmin = (user) => {
    if (!isAdmin(user)) {
        throw createHttpError("Only admin can perform this action", 403);
    }
};

const assertAssignableOrder = async (orderId) => {
    const order = await dispatchRepository.getOrderInfo(orderId);

    if (!order) {
        throw createHttpError("Order not found", 404);
    }

    if (["DELIVERED", "CANCELLED", "FAILED"].includes(order.status)) {
        throw createHttpError("This order cannot be assigned", 400);
    }

    return order;
};

const resolveDriver = async (data) => {
    const driverProfileId = data.driverProfileId || data.driverId || null;
    const driverUserId = data.driverUserId || null;

    if (!driverProfileId && !driverUserId) {
        throw createHttpError("driverUserId or driverProfileId is required", 400);
    }

    if (driverProfileId) {
        const driver = await dispatchRepository.getDriverByProfileId(
            driverProfileId
        );

        if (!driver) {
            throw createHttpError("Driver profile not found", 404);
        }

        if (driverUserId && driver.userId !== driverUserId) {
            throw createHttpError("driverUserId does not match driverProfileId", 400);
        }

        return {
            driver,
            driverUserId: driver.userId,
            driverProfileId: driver.id
        };
    }

    const driver = await dispatchRepository.getDriverByUserId(driverUserId);

    if (!driver) {
        throw createHttpError("Driver profile not found", 404);
    }

    return {
        driver,
        driverUserId: driver.userId,
        driverProfileId: driver.id
    };
};

const assertDriverCanReceiveAssignment = (driver) => {
    if (driver.verificationStatus !== "APPROVED") {
        throw createHttpError("Driver must be approved before assignment", 400);
    }

    if (driver.status === "SUSPENDED") {
        throw createHttpError("Suspended driver cannot receive assignment", 400);
    }
};

const assertCanAccessAssignment = (user, assignment) => {
    if (!assignment) {
        throw createHttpError("Assignment not found", 404);
    }

    if (isAdmin(user)) {
        return;
    }

    if (isDriver(user) && assignment.driverUserId === user.id) {
        return;
    }

    throw createHttpError("Forbidden", 403);
};

export const createAssignment = async (user, data) => {
    assertAdmin(user);

    const { orderId, note } = data;

    if (!orderId) {
        throw createHttpError("orderId is required", 400);
    }

    await assertAssignableOrder(orderId);

    const { driver, driverUserId, driverProfileId } = await resolveDriver(data);

    assertDriverCanReceiveAssignment(driver);

    const activeOrderAssignment =
        await dispatchRepository.findActiveAssignmentByOrderId({
            orderId,
            activeStatuses: ACTIVE_STATUSES
        });

    if (activeOrderAssignment) {
        throw createHttpError("Order already has an active assignment", 400);
    }

    const activeDriverAssignment =
        await dispatchRepository.findActiveAssignmentByDriverUserId({
            driverUserId,
            activeStatuses: ACTIVE_STATUSES
        });

    if (activeDriverAssignment) {
        throw createHttpError("Driver already has an active assignment", 400);
    }

    return dispatchRepository.createAssignment({
        orderId,
        driverUserId,
        driverProfileId,
        assignedBy: user.id,
        note
    });
};

export const autoAssign = async (user, data, authorizationHeader) => {
    assertAdmin(user);

    const { orderId, pickupLat, pickupLng, radiusKm, maxDistanceKm, note } = data;

    if (!orderId || pickupLat === undefined || pickupLng === undefined) {
        throw createHttpError("orderId, pickupLat and pickupLng are required", 400);
    }

    await assertAssignableOrder(orderId);

    const driverServiceUrl =
        process.env.DRIVER_SERVICE_URL || "http://localhost:3003";

    const finalRadiusKm = radiusKm || maxDistanceKm || 5;

    const url =
        `${driverServiceUrl}/drivers/nearby` +
        `?lat=${pickupLat}&lng=${pickupLng}&radiusKm=${finalRadiusKm}`;

    const response = await fetch(url, {
        headers: {
            Authorization: authorizationHeader || ""
        }
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
        throw createHttpError(json.message || "Cannot get nearby drivers", 400);
    }

    const nearbyDrivers = json.data || [];

    if (nearbyDrivers.length === 0) {
        throw createHttpError("No nearby driver found", 404);
    }

    let lastError = null;

    for (const selectedDriver of nearbyDrivers) {
        try {
            const assignment = await createAssignment(user, {
                orderId,
                driverUserId: selectedDriver.userId,
                driverProfileId: selectedDriver.id,
                note: note || "Auto assigned to nearest driver"
            });

            return {
                assignment,
                selectedDriver
            };
        } catch (error) {
            lastError = error;

            if (error.message === "Driver already has an active assignment") {
                continue;
            }

            throw error;
        }
    }

    throw createHttpError(
        lastError?.message || "No available nearby driver found",
        400
    );
};

export const getAssignments = async (user, query = {}) => {
    assertAdmin(user);

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
        if (!ASSIGNMENT_STATUSES.includes(query.status)) {
            throw createHttpError("Invalid assignment status", 400);
        }

        where.status = query.status;
    }

    if (query.orderId) {
        where.orderId = query.orderId;
    }

    if (query.driverUserId) {
        where.driverUserId = query.driverUserId;
    }

    if (query.driverProfileId) {
        where.driverProfileId = query.driverProfileId;
    }

    const [assignments, total] = await Promise.all([
        dispatchRepository.findAssignments({
            where,
            skip,
            limit
        }),
        dispatchRepository.countAssignments(where)
    ]);

    return {
        items: assignments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getMyAssignments = async (driverUserId) => {
    return dispatchRepository.findAssignmentsByDriverUserId(driverUserId);
};

export const getMyCurrentAssignment = async (driverUserId) => {
    return dispatchRepository.findCurrentAssignmentByDriverUserId({
        driverUserId,
        activeStatuses: ACTIVE_STATUSES
    });
};

export const getMyHistory = async (driverUserId) => {
    return dispatchRepository.findHistoryByDriverUserId(driverUserId);
};

export const getAssignmentById = async (user, assignmentId) => {
    const assignment = await dispatchRepository.findAssignmentById(assignmentId);

    assertCanAccessAssignment(user, assignment);

    return assignment;
};

export const acceptAssignment = async (user, assignmentId) => {
    if (!isDriver(user)) {
        throw createHttpError("Only driver can accept assignment", 403);
    }

    const assignment = await dispatchRepository.findAssignmentById(assignmentId);

    if (!assignment) {
        throw createHttpError("Assignment not found", 404);
    }

    if (assignment.driverUserId !== user.id) {
        throw createHttpError("Forbidden", 403);
    }

    if (assignment.status !== "PENDING") {
        throw createHttpError("Only PENDING assignment can be accepted", 400);
    }

    const acceptedAssignment =
        await dispatchRepository.findAcceptedAssignmentOfDriverExcept({
            driverUserId: user.id,
            assignmentId
        });

    if (acceptedAssignment) {
        throw createHttpError("Driver already has an accepted assignment", 400);
    }

    return dispatchRepository.updateAssignment({
        assignmentId,
        data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const rejectAssignment = async (
    user,
    assignmentId,
    { rejectReason, reason } = {}
) => {
    if (!isDriver(user)) {
        throw createHttpError("Only driver can reject assignment", 403);
    }

    const assignment = await dispatchRepository.findAssignmentById(assignmentId);

    if (!assignment) {
        throw createHttpError("Assignment not found", 404);
    }

    if (assignment.driverUserId !== user.id) {
        throw createHttpError("Forbidden", 403);
    }

    if (assignment.status !== "PENDING") {
        throw createHttpError("Only PENDING assignment can be rejected", 400);
    }

    return dispatchRepository.updateAssignment({
        assignmentId,
        data: {
            status: "REJECTED",
            rejectReason: rejectReason || reason || "Rejected by driver",
            rejectedAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const cancelAssignment = async (user, assignmentId, { note, reason } = {}) => {
    assertAdmin(user);

    const assignment = await dispatchRepository.findActiveAssignmentById({
        assignmentId,
        activeStatuses: ACTIVE_STATUSES
    });

    if (!assignment) {
        throw createHttpError("Active assignment not found", 404);
    }

    return dispatchRepository.updateAssignment({
        assignmentId,
        data: {
            status: "CANCELLED",
            note: reason || note || assignment.note,
            cancelledAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const completeAssignment = async (user, assignmentId, { note } = {}) => {
    const assignment = await dispatchRepository.findAssignmentById(assignmentId);

    if (!assignment) {
        throw createHttpError("Assignment not found", 404);
    }

    if (!isAdmin(user)) {
        if (!isDriver(user)) {
            throw createHttpError("Forbidden", 403);
        }

        if (assignment.driverUserId !== user.id) {
            throw createHttpError("Forbidden", 403);
        }
    }

    if (assignment.status !== "ACCEPTED") {
        throw createHttpError("Only ACCEPTED assignment can be completed", 400);
    }

    return dispatchRepository.updateAssignment({
        assignmentId,
        data: {
            status: "COMPLETED",
            note: note || assignment.note,
            completedAt: new Date(),
            updatedAt: new Date()
        }
    });
};