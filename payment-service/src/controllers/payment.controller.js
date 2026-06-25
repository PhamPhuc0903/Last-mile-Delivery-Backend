import * as paymentService from "../services/payment.service.js";

export const createPayment = async (req, res) => {
    try {
        const payment = await paymentService.createPayment(req.user, req.body);

        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error("Create payment error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyPayments = async (req, res) => {
    try {
        const payments = await paymentService.getMyPayments(req.user.id);

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error("Get my payments error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentById(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error("Get payment error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const getPaymentsByOrderId = async (req, res) => {
    try {
        const payments = await paymentService.getPaymentsByOrderId(
            req.user,
            req.params.orderId
        );

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error("Get order payments error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const markPaymentPaid = async (req, res) => {
    try {
        const payment = await paymentService.markPaymentPaid(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error("Mark payment paid error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const markPaymentFailed = async (req, res) => {
    try {
        const payment = await paymentService.markPaymentFailed(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error("Mark payment failed error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const refundPayment = async (req, res) => {
    try {
        const result = await paymentService.refundPayment(req.params.id, req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Refund payment error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};