import prisma from "../config/prisma.js";

export const getOrderInfo = async (orderId) => {
    const rows = await prisma.$queryRaw`
        SELECT id::text AS id, status::text AS status
        FROM orders.orders
        WHERE id = ${orderId}::uuid
        LIMIT 1
    `;

    return rows[0] || null;
};

export const getDriverByProfileId = async (driverProfileId) => {
    const rows = await prisma.$queryRaw`
        SELECT 
            id::text AS id,
            user_id::text AS "userId",
            status::text AS status,
            verification_status::text AS "verificationStatus"
        FROM drivers.drivers
        WHERE id = ${driverProfileId}::uuid
        LIMIT 1
    `;

    return rows[0] || null;
};

export const getDriverByUserId = async (driverUserId) => {
    const rows = await prisma.$queryRaw`
        SELECT 
            id::text AS id,
            user_id::text AS "userId",
            status::text AS status,
            verification_status::text AS "verificationStatus"
        FROM drivers.drivers
        WHERE user_id = ${driverUserId}::uuid
        LIMIT 1
    `;

    return rows[0] || null;
};

export const findActiveAssignmentByOrderId = async ({
                                                        orderId,
                                                        activeStatuses
                                                    }) => {
    return prisma.deliveryAssignment.findFirst({
        where: {
            orderId,
            status: {
                in: activeStatuses
            }
        }
    });
};

export const findActiveAssignmentByDriverUserId = async ({
                                                             driverUserId,
                                                             activeStatuses
                                                         }) => {
    return prisma.deliveryAssignment.findFirst({
        where: {
            driverUserId,
            status: {
                in: activeStatuses
            }
        }
    });
};

export const createAssignment = async ({
                                           orderId,
                                           driverUserId,
                                           driverProfileId,
                                           assignedBy,
                                           note
                                       }) => {
    return prisma.deliveryAssignment.create({
        data: {
            orderId,
            driverUserId,
            driverProfileId,
            assignedBy,
            note
        }
    });
};

export const findAssignments = async ({ where, skip, limit }) => {
    return prisma.deliveryAssignment.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countAssignments = async (where) => {
    return prisma.deliveryAssignment.count({
        where
    });
};

export const findAssignmentsByDriverUserId = async (driverUserId) => {
    return prisma.deliveryAssignment.findMany({
        where: {
            driverUserId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findCurrentAssignmentByDriverUserId = async ({
                                                              driverUserId,
                                                              activeStatuses
                                                          }) => {
    return prisma.deliveryAssignment.findFirst({
        where: {
            driverUserId,
            status: {
                in: activeStatuses
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findHistoryByDriverUserId = async (driverUserId) => {
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

export const findAssignmentById = async (assignmentId) => {
    return prisma.deliveryAssignment.findUnique({
        where: {
            id: assignmentId
        }
    });
};

export const findAcceptedAssignmentOfDriverExcept = async ({
                                                               driverUserId,
                                                               assignmentId
                                                           }) => {
    return prisma.deliveryAssignment.findFirst({
        where: {
            driverUserId,
            status: "ACCEPTED",
            id: {
                not: assignmentId
            }
        }
    });
};

export const findActiveAssignmentById = async ({
                                                   assignmentId,
                                                   activeStatuses
                                               }) => {
    return prisma.deliveryAssignment.findFirst({
        where: {
            id: assignmentId,
            status: {
                in: activeStatuses
            }
        }
    });
};

export const updateAssignment = async ({ assignmentId, data }) => {
    return prisma.deliveryAssignment.update({
        where: {
            id: assignmentId
        },
        data
    });
};