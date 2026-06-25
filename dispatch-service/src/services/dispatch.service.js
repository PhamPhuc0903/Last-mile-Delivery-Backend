import prisma from "../config/prisma.js";

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED"];

export const createAssignment = async (adminUserId, data) => {
    const { orderId, driverUserId, driverProfileId, note } = data;

    if (!orderId || !driverUserId) {
        throw new Error("orderId and driverUserId are required");
    }

    const activeOrderAssignment = await prisma.deliveryAssignment.findFirst({
        where: {
            orderId,
            status: {
                in: ACTIVE_STATUSES
            }
        }
    });

    if (activeOrderAssignment) {
        throw new Error("Order already has an active assignment");
    }

    const activeDriverAssignment = await prisma.deliveryAssignment.findFirst({
        where: {
            driverUserId,
            status: {
                in: ACTIVE_STATUSES
            }
        }
    });

    if (activeDriverAssignment) {
        throw new Error("Driver already has an active assignment");
    }

    return prisma.deliveryAssignment.create({
        data: {
            orderId,
            driverUserId,
            driverProfileId: driverProfileId || null,
            assignedBy: adminUserId,
            note
        }
    });
};

export const autoAssign = async (adminUserId, data, authorizationHeader) => {
    const { orderId, pickupLat, pickupLng, radiusKm, note } = data;

    if (!orderId || pickupLat === undefined || pickupLng === undefined) {
        throw new Error("orderId, pickupLat and pickupLng are required");
    }

    const driverServiceUrl =
        process.env.DRIVER_SERVICE_URL || "http://localhost:3003";

    const url =
        `${driverServiceUrl}/drivers/nearby` +
        `?lat=${pickupLat}&lng=${pickupLng}&radiusKm=${radiusKm || 5}`;

    const response = await fetch(url, {
        headers: {
            Authorization: authorizationHeader
        }
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
        throw new Error(json.message || "Cannot get nearby drivers");
    }

    const nearbyDrivers = json.data || [];

    if (nearbyDrivers.length === 0) {
        throw new Error("No nearby driver found");
    }

    const selectedDriver = nearbyDrivers[0];

    const assignment = await createAssignment(adminUserId, {
        orderId,
        driverUserId: selectedDriver.userId,
        driverProfileId: selectedDriver.id,
        note: note || "Auto assigned to nearest driver"
    });

    return {
        assignment,
        selectedDriver
    };
};

export const getAssignments = async (query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
        where.status = query.status;
    }

    if (query.orderId) {
        where.orderId = query.orderId;
    }

    if (query.driverUserId) {
        where.driverUserId = query.driverUserId;
    }

    const [assignments, total] = await Promise.all([
        prisma.deliveryAssignment.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limit
        }),
        prisma.deliveryAssignment.count({
            where
        })
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
    return prisma.deliveryAssignment.findMany({
        where: {
            driverUserId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const getMyCurrentAssignment = async (driverUserId) => {
    return prisma.deliveryAssignment.findFirst({
        where: {
            driverUserId,
            status: {
                in: ACTIVE_STATUSES
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const getMyHistory = async (driverUserId) => {
    return prisma.deliveryAssignment.findMany({
        where: {
            driverUserId,
            status: {
                in: ["REJECTED", "CANCELLED", "COMPLETED", "EXPIRED"]
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const getAssignmentById = async (user, assignmentId) => {
    const where =
        user.role === "ADMIN"
            ? {
                id: assignmentId
            }
            : {
                id: assignmentId,
                driverUserId: user.id
            };

    const assignment = await prisma.deliveryAssignment.findFirst({
        where
    });

    if (!assignment) {
        throw new Error("Assignment not found");
    }

    return assignment;
};

export const acceptAssignment = async (driverUserId, assignmentId) => {
    const assignment = await prisma.deliveryAssignment.findFirst({
        where: {
            id: assignmentId,
            driverUserId,
            status: "PENDING"
        }
    });

    if (!assignment) {
        throw new Error("Pending assignment not found");
    }

    const acceptedAssignment = await prisma.deliveryAssignment.findFirst({
        where: {
            driverUserId,
            status: "ACCEPTED",
            id: {
                not: assignmentId
            }
        }
    });

    if (acceptedAssignment) {
        throw new Error("Driver already has an accepted assignment");
    }

    return prisma.deliveryAssignment.update({
        where: {
            id: assignmentId
        },
        data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const rejectAssignment = async (
    driverUserId,
    assignmentId,
    { rejectReason }
) => {
    const assignment = await prisma.deliveryAssignment.findFirst({
        where: {
            id: assignmentId,
            driverUserId,
            status: "PENDING"
        }
    });

    if (!assignment) {
        throw new Error("Pending assignment not found");
    }

    return prisma.deliveryAssignment.update({
        where: {
            id: assignmentId
        },
        data: {
            status: "REJECTED",
            rejectReason: rejectReason || "Rejected by driver",
            rejectedAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const cancelAssignment = async (assignmentId, { note }) => {
    const assignment = await prisma.deliveryAssignment.findFirst({
        where: {
            id: assignmentId,
            status: {
                in: ACTIVE_STATUSES
            }
        }
    });

    if (!assignment) {
        throw new Error("Active assignment not found");
    }

    return prisma.deliveryAssignment.update({
        where: {
            id: assignmentId
        },
        data: {
            status: "CANCELLED",
            note: note || assignment.note,
            cancelledAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const completeAssignment = async (user, assignmentId, { note }) => {
    const where =
        user.role === "ADMIN"
            ? {
                id: assignmentId,
                status: "ACCEPTED"
            }
            : {
                id: assignmentId,
                driverUserId: user.id,
                status: "ACCEPTED"
            };

    const assignment = await prisma.deliveryAssignment.findFirst({
        where
    });

    if (!assignment) {
        throw new Error("Accepted assignment not found");
    }

    return prisma.deliveryAssignment.update({
        where: {
            id: assignmentId
        },
        data: {
            status: "COMPLETED",
            note: note || assignment.note,
            completedAt: new Date(),
            updatedAt: new Date()
        }
    });
};