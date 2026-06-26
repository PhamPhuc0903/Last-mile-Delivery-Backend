import prisma from "../config/prisma.js";

export const isDriverAssignedToOrder = async (orderId, userId) => {
    const assignments = await prisma.$queryRaw`
    SELECT da.id::text AS id
    FROM dispatch.delivery_assignments da
    WHERE da.order_id = ${orderId}::uuid
      AND da.driver_user_id = ${userId}::uuid
      AND da.status IN ('PENDING', 'ACCEPTED', 'COMPLETED')
    LIMIT 1
  `;

    return assignments.length > 0;
};

export const getAssignedOrderIdsOfDriver = async (userId) => {
    const rows = await prisma.$queryRaw`
    SELECT DISTINCT da.order_id::text AS "orderId"
    FROM dispatch.delivery_assignments da
    WHERE da.driver_user_id = ${userId}::uuid
      AND da.status IN ('PENDING', 'ACCEPTED', 'COMPLETED')
  `;

    return rows.map((row) => row.orderId);
};

export const createOrderWithItemsAndInitialLog = async ({
                                                            customerId,
                                                            orderData,
                                                            items
                                                        }) => {
    return prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
            data: {
                customerId,
                ...orderData,
                items: {
                    create: items.map((item) => ({
                        itemName: item.itemName,
                        quantity: item.quantity || 1,
                        weightKg: item.weightKg,
                        note: item.note
                    }))
                }
            }
        });

        await tx.orderStatusLog.create({
            data: {
                orderId: createdOrder.id,
                status: "PENDING",
                changedBy: customerId,
                note: "Order created"
            }
        });

        return tx.order.findUnique({
            where: {
                id: createdOrder.id
            },
            include: {
                items: true,
                statusLogs: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });
    });
};

export const findMyOrders = async (customerId) => {
    return prisma.order.findMany({
        where: {
            customerId
        },
        include: {
            items: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findOrderById = async (orderId) => {
    return prisma.order.findUnique({
        where: {
            id: orderId
        }
    });
};

export const findOrderByIdWithItems = async (orderId) => {
    return prisma.order.findUnique({
        where: {
            id: orderId
        },
        include: {
            items: true
        }
    });
};

export const findOrderByIdWithDetails = async (orderId) => {
    return prisma.order.findUnique({
        where: {
            id: orderId
        },
        include: {
            items: true,
            statusLogs: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });
};

export const cancelOrderWithLog = async ({ orderId, userId, note }) => {
    return prisma.$transaction(async (tx) => {
        const cancelledOrder = await tx.order.update({
            where: {
                id: orderId
            },
            data: {
                status: "CANCELLED",
                updatedAt: new Date()
            },
            include: {
                items: true
            }
        });

        await tx.orderStatusLog.create({
            data: {
                orderId,
                status: "CANCELLED",
                changedBy: userId,
                note
            }
        });

        return cancelledOrder;
    });
};

export const updateOrderStatusWithLog = async ({
                                                   orderId,
                                                   status,
                                                   userId,
                                                   note
                                               }) => {
    return prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: {
                id: orderId
            },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        await tx.orderStatusLog.create({
            data: {
                orderId,
                status,
                changedBy: userId,
                note
            }
        });

        return tx.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                items: true,
                statusLogs: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });
    });
};

export const findOrders = async ({ where, skip, limit }) => {
    return prisma.order.findMany({
        where,
        include: {
            items: true
        },
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countOrders = async (where) => {
    return prisma.order.count({
        where
    });
};

export const updateOrderWithOptionalItems = async ({
                                                       orderId,
                                                       orderData,
                                                       items,
                                                       userId
                                                   }) => {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
            where: {
                id: orderId
            },
            data: {
                ...orderData,
                updatedAt: new Date()
            }
        });

        if (items !== undefined) {
            await tx.orderItem.deleteMany({
                where: {
                    orderId
                }
            });

            await tx.orderItem.createMany({
                data: items.map((item) => ({
                    orderId,
                    itemName: item.itemName,
                    quantity: item.quantity || 1,
                    weightKg: item.weightKg,
                    note: item.note
                }))
            });
        }

        await tx.orderStatusLog.create({
            data: {
                orderId,
                status: order.status,
                changedBy: userId,
                note: "Order information updated"
            }
        });

        return tx.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                items: true,
                statusLogs: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });
    });
};

export const findOrderTimeline = async (orderId) => {
    return prisma.orderStatusLog.findMany({
        where: {
            orderId
        },
        orderBy: {
            createdAt: "asc"
        }
    });
};

export const countOrdersByDateRange = async (where) => {
    return prisma.order.count({
        where
    });
};

export const aggregateDeliveredShippingFee = async (where) => {
    return prisma.order.aggregate({
        where: {
            ...where,
            status: "DELIVERED"
        },
        _sum: {
            shippingFee: true
        }
    });
};