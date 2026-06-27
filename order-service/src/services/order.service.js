import * as orderRepository from "../repositories/order.repository.js";

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isAdmin = (user) => user?.role === "ADMIN";
const isCustomer = (user) => user?.role === "CUSTOMER";
const isDriver = (user) => user?.role === "DRIVER";

const calculateShippingFee = (distanceKm) => {
    if (!distanceKm) {
        return 15000;
    }

    const baseFee = 15000;
    const feePerKm = 5000;

    return baseFee + distanceKm * feePerKm;
};

const assertCanAccessOrder = async (order, user) => {
    if (!order) {
        throw createHttpError("Order not found", 404);
    }

    if (isAdmin(user)) {
        return;
    }

    if (isCustomer(user) && order.customerId === user.id) {
        return;
    }

    if (isDriver(user)) {
        const assigned = await orderRepository.isDriverAssignedToOrder(
            order.id,
            user.id
        );

        if (assigned) {
            return;
        }
    }

    throw createHttpError("Forbidden", 403);
};

const assertCanModifyOrder = (order, user) => {
    if (!order) {
        throw createHttpError("Order not found", 404);
    }

    if (isAdmin(user)) {
        return;
    }

    if (isCustomer(user) && order.customerId === user.id) {
        return;
    }

    throw createHttpError("Forbidden", 403);
};

const assertCanUpdateOrderStatus = (user) => {
    if (!isAdmin(user)) {
        throw createHttpError("Only admin can update order status", 403);
    }
};

const allowedOrderStatuses = [
    "PENDING",
    "CONFIRMED",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "FAILED"
];

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

    if (
        !pickupAddressLine ||
        !receiverName ||
        !receiverPhone ||
        !deliveryAddressLine
    ) {
        throw createHttpError(
            "pickupAddressLine, receiverName, receiverPhone and deliveryAddressLine are required",
            400
        );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw createHttpError("Order must have at least one item", 400);
    }

    const finalShippingFee =
        shippingFee !== undefined && shippingFee !== null
            ? shippingFee
            : calculateShippingFee(distanceKm);

    const orderData = {
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
        note
    };

    return orderRepository.createOrderWithItemsAndInitialLog({
        customerId: userId,
        orderData,
        items
    });
};

export const getMyOrders = async (userId) => {
    return orderRepository.findMyOrders(userId);
};

export const getOrderById = async (user, orderId) => {
    const order = await orderRepository.findOrderByIdWithDetails(orderId);

    await assertCanAccessOrder(order, user);

    return order;
};

export const cancelOrder = async (user, orderId, data = {}) => {
    const order = await orderRepository.findOrderById(orderId);

    assertCanModifyOrder(order, user);

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw createHttpError("Only PENDING or CONFIRMED orders can be cancelled", 400);
    }

    const note =
        data.reason ||
        (isAdmin(user)
            ? "Order cancelled by admin"
            : "Order cancelled by customer");

    return orderRepository.cancelOrderWithLog({
        orderId,
        userId: user.id,
        note
    });
};

export const updateOrderStatus = async (user, orderId, { status, note }) => {
    assertCanUpdateOrderStatus(user);

    if (!status) {
        throw createHttpError("status is required", 400);
    }

    if (!allowedOrderStatuses.includes(status)) {
        throw createHttpError("Invalid order status", 400);
    }

    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
        throw createHttpError("Order not found", 404);
    }

    return orderRepository.updateOrderStatusWithLog({
        orderId,
        status,
        userId: user.id,
        note: note || `Order status changed to ${status}`
    });
};

export const getOrders = async (user, query = {}) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (isAdmin(user)) {
        if (query.customerId) {
            where.customerId = query.customerId;
        }
    } else if (isCustomer(user)) {
        where.customerId = user.id;
    } else if (isDriver(user)) {
        const assignedOrderIds = await orderRepository.getAssignedOrderIdsOfDriver(
            user.id
        );

        if (assignedOrderIds.length === 0) {
            return {
                items: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            };
        }

        where.id = {
            in: assignedOrderIds
        };
    } else {
        throw createHttpError("Forbidden", 403);
    }

    if (query.status) {
        where.status = query.status;
    }

    const [orders, total] = await Promise.all([
        orderRepository.findOrders({
            where,
            skip,
            limit
        }),
        orderRepository.countOrders(where)
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
    const existingOrder = await orderRepository.findOrderByIdWithItems(orderId);

    assertCanModifyOrder(existingOrder, user);

    if (!["PENDING", "CONFIRMED"].includes(existingOrder.status)) {
        throw createHttpError("Only PENDING or CONFIRMED orders can be updated", 400);
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
            throw createHttpError("items must be a non-empty array", 400);
        }

        for (const item of items) {
            if (!item.itemName) {
                throw createHttpError("itemName is required", 400);
            }
        }
    }

    const finalShippingFee =
        shippingFee !== undefined && shippingFee !== null
            ? shippingFee
            : distanceKm !== undefined && distanceKm !== null
                ? calculateShippingFee(distanceKm)
                : undefined;

    const orderData = {
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
        paymentMethod,
        note
    };

    return orderRepository.updateOrderWithOptionalItems({
        orderId,
        orderData,
        items,
        userId: user.id
    });
};

export const getOrderTimeline = async (user, orderId) => {
    const order = await orderRepository.findOrderById(orderId);

    await assertCanAccessOrder(order, user);

    return orderRepository.findOrderTimeline(orderId);
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

    if (!startDate || !endDate) {
        throw createHttpError("Invalid stats period", 400);
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
        orderRepository.countOrders(where),
        orderRepository.countOrders({ ...where, status: "PENDING" }),
        orderRepository.countOrders({ ...where, status: "CONFIRMED" }),
        orderRepository.countOrders({ ...where, status: "ASSIGNED" }),
        orderRepository.countOrders({ ...where, status: "PICKED_UP" }),
        orderRepository.countOrders({ ...where, status: "IN_TRANSIT" }),
        orderRepository.countOrders({ ...where, status: "DELIVERED" }),
        orderRepository.countOrders({ ...where, status: "CANCELLED" }),
        orderRepository.countOrders({ ...where, status: "FAILED" }),
        orderRepository.aggregateDeliveredShippingFee(where)
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