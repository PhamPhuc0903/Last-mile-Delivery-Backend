import prisma from "../config/prisma.js";

const calculateShippingFee = (distanceKm) => {
    if (!distanceKm) {
        return 15000;
    }

    const baseFee = 15000;
    const feePerKm = 5000;

    return baseFee + distanceKm * feePerKm;
};

export const createOrder = async (userId, data) => {
    const {
        pickupAddressLine,
        pickupWard,
        pickupDistrict,
        pickupCity,
        pickupLat,
        pickupLng,

        receiverName,
        receiverPhone,

        deliveryAddressLine,
        deliveryWard,
        deliveryDistrict,
        deliveryCity,
        deliveryLat,
        deliveryLng,

        distanceKm,
        shippingFee,

        paymentMethod,
        note,
        items
    } = data;

    if (!pickupAddressLine || !receiverName || !receiverPhone || !deliveryAddressLine) {
        throw new Error(
            "pickupAddressLine, receiverName, receiverPhone and deliveryAddressLine are required"
        );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Order must have at least one item");
    }

    const finalShippingFee =
        shippingFee !== undefined && shippingFee !== null
            ? shippingFee
            : calculateShippingFee(distanceKm);

    const order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
            data: {
                customerId: userId,

                pickupAddressLine,
                pickupWard,
                pickupDistrict,
                pickupCity,
                pickupLat,
                pickupLng,

                receiverName,
                receiverPhone,

                deliveryAddressLine,
                deliveryWard,
                deliveryDistrict,
                deliveryCity,
                deliveryLat,
                deliveryLng,

                distanceKm,
                shippingFee: finalShippingFee,

                paymentMethod: paymentMethod || "COD",
                note,

                items: {
                    create: items.map((item) => ({
                        itemName: item.itemName,
                        quantity: item.quantity || 1,
                        weightKg: item.weightKg,
                        note: item.note
                    }))
                }
            },
            include: {
                items: true,
                statusLogs: true
            }
        });

        await tx.orderStatusLog.create({
            data: {
                orderId: createdOrder.id,
                status: "PENDING",
                changedBy: userId,
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

    return order;
};

export const getMyOrders = async (userId) => {
    return prisma.order.findMany({
        where: {
            customerId: userId
        },
        include: {
            items: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const getOrderById = async (user, orderId) => {
    const where =
        user.role === "ADMIN"
            ? {
                id: orderId
            }
            : {
                id: orderId,
                customerId: user.id
            };

    const order = await prisma.order.findFirst({
        where,
        include: {
            items: true,
            statusLogs: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return order;
};

export const cancelOrder = async (userId, orderId) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            customerId: userId
        }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw new Error("Only PENDING or CONFIRMED orders can be cancelled");
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
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
                note: "Order cancelled by customer"
            }
        });

        return cancelledOrder;
    });

    return updatedOrder;
};

export const updateOrderStatus = async (userId, orderId, { status, note }) => {
    if (!status) {
        throw new Error("status is required");
    }

    const allowedStatuses = [
        "PENDING",
        "CONFIRMED",
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "CANCELLED",
        "FAILED"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid order status");
    }

    const order = await prisma.order.findUnique({
        where: {
            id: orderId
        }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const result = await tx.order.update({
            where: {
                id: orderId
            },
            data: {
                status,
                updatedAt: new Date()
            },
            include: {
                items: true
            }
        });

        await tx.orderStatusLog.create({
            data: {
                orderId,
                status,
                changedBy: userId,
                note: note || `Order status changed to ${status}`
            }
        });

        return result;
    });

    return updatedOrder;
};
export const getOrders = async (user, query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (user.role !== "ADMIN") {
        where.customerId = user.id;
    }

    if (user.role === "ADMIN" && query.customerId) {
        where.customerId = query.customerId;
    }

    if (query.status) {
        where.status = query.status;
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: true
            },
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limit
        }),
        prisma.order.count({
            where
        })
    ]);

    return {
        items: orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const updateOrder = async (user, orderId, data) => {
    const existingOrder = await prisma.order.findFirst({
        where:
            user.role === "ADMIN"
                ? { id: orderId }
                : {
                    id: orderId,
                    customerId: user.id
                },
        include: {
            items: true
        }
    });

    if (!existingOrder) {
        throw new Error("Order not found");
    }

    if (!["PENDING", "CONFIRMED"].includes(existingOrder.status)) {
        throw new Error("Only PENDING or CONFIRMED orders can be updated");
    }

    const {
        pickupAddressLine,
        pickupWard,
        pickupDistrict,
        pickupCity,
        pickupLat,
        pickupLng,

        receiverName,
        receiverPhone,

        deliveryAddressLine,
        deliveryWard,
        deliveryDistrict,
        deliveryCity,
        deliveryLat,
        deliveryLng,

        distanceKm,
        shippingFee,
        paymentMethod,
        note,
        items
    } = data;

    if (items !== undefined) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("items must be a non-empty array");
        }

        for (const item of items) {
            if (!item.itemName) {
                throw new Error("itemName is required");
            }
        }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
            where: {
                id: orderId
            },
            data: {
                pickupAddressLine,
                pickupWard,
                pickupDistrict,
                pickupCity,
                pickupLat,
                pickupLng,

                receiverName,
                receiverPhone,

                deliveryAddressLine,
                deliveryWard,
                deliveryDistrict,
                deliveryCity,
                deliveryLat,
                deliveryLng,

                distanceKm,
                shippingFee,
                paymentMethod,
                note,

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
                changedBy: user.id,
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

    return updatedOrder;
};

export const getOrderTimeline = async (user, orderId) => {
    const order = await prisma.order.findFirst({
        where:
            user.role === "ADMIN"
                ? { id: orderId }
                : {
                    id: orderId,
                    customerId: user.id
                }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return prisma.orderStatusLog.findMany({
        where: {
            orderId
        },
        orderBy: {
            createdAt: "asc"
        }
    });
};

const getDateRange = (type) => {
    const now = new Date();

    let startDate;
    let endDate;

    if (type === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    if (type === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    if (type === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
    }

    return {
        startDate,
        endDate
    };
};

export const getOrderStats = async (type) => {
    const { startDate, endDate } = getDateRange(type);

    const where = {
        createdAt: {
            gte: startDate,
            lt: endDate
        }
    };

    const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        assignedOrders,
        pickedUpOrders,
        inTransitOrders,
        deliveredOrders,
        cancelledOrders,
        failedOrders,
        shippingFeeResult
    ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.count({ where: { ...where, status: "PENDING" } }),
        prisma.order.count({ where: { ...where, status: "CONFIRMED" } }),
        prisma.order.count({ where: { ...where, status: "ASSIGNED" } }),
        prisma.order.count({ where: { ...where, status: "PICKED_UP" } }),
        prisma.order.count({ where: { ...where, status: "IN_TRANSIT" } }),
        prisma.order.count({ where: { ...where, status: "DELIVERED" } }),
        prisma.order.count({ where: { ...where, status: "CANCELLED" } }),
        prisma.order.count({ where: { ...where, status: "FAILED" } }),
        prisma.order.aggregate({
            where: {
                ...where,
                status: "DELIVERED"
            },
            _sum: {
                shippingFee: true
            }
        })
    ]);

    return {
        period: type,
        from: startDate,
        to: endDate,
        totalOrders,
        byStatus: {
            PENDING: pendingOrders,
            CONFIRMED: confirmedOrders,
            ASSIGNED: assignedOrders,
            PICKED_UP: pickedUpOrders,
            IN_TRANSIT: inTransitOrders,
            DELIVERED: deliveredOrders,
            CANCELLED: cancelledOrders,
            FAILED: failedOrders
        },
        totalShippingFee: shippingFeeResult._sum.shippingFee || 0
    };
};