import * as orderService from "../services/order.service.js";

export const createOrder = async (req, res) => {
    try {
        const order = await orderService.createOrder(req.user.id, req.body);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Create order error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await orderService.getMyOrders(req.user.id);

        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error("Get my orders error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.user, req.params.id);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Get order error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const order = await orderService.cancelOrder(req.user.id, req.params.id);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const order = await orderService.updateOrderStatus(
            req.user.id,
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Update order status error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrders = async (req, res) => {
    try {
        const result = await orderService.getOrders(req.user, req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get orders error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const order = await orderService.updateOrder(
            req.user,
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Update order error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrderTimeline = async (req, res) => {
    try {
        const timeline = await orderService.getOrderTimeline(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: timeline
        });
    } catch (error) {
        console.error("Get order timeline error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const getTodayStats = async (req, res) => {
    try {
        const stats = await orderService.getOrderStats("today");

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Get today stats error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMonthStats = async (req, res) => {
    try {
        const stats = await orderService.getOrderStats("month");

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Get month stats error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getYearStats = async (req, res) => {
    try {
        const stats = await orderService.getOrderStats("year");

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Get year stats error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};