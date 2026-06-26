import * as paymentRepository from "../repositories/payment.repository.js";

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isAdmin = (user) => user?.role === "ADMIN";
const isCustomer = (user) => user?.role === "CUSTOMER";

const assertAdmin = (user) => {
    if (!isAdmin(user)) {
        throw createHttpError("Only admin can perform this action", 403);
    }
};

const assertCanAccessPayment = (payment, user) => {
    if (!payment) {
        throw createHttpError("Payment not found", 404);
    }

    if (isAdmin(user)) {
        return;
    }

    if (isCustomer(user) && payment.customerId === user.id) {
        return;
    }

    throw createHttpError("Forbidden", 403);
};

export const createPayment = async (user, data) => {
    const {
        orderId,
        customerId,
        amount,
        paymentMethod,
        provider,
        providerTransactionId,
        note
    } = data;

    if (!orderId || !amount || !paymentMethod) {
        throw createHttpError("orderId, amount and paymentMethod are required", 400);
    }

    if (Number(amount) <= 0) {
        throw createHttpError("amount must be greater than 0", 400);
    }

    const orderCustomerId = await paymentRepository.getOrderCustomerId(orderId);

    if (!orderCustomerId) {
        throw createHttpError("Order not found", 404);
    }

    if (isCustomer(user) && orderCustomerId !== user.id) {
        throw createHttpError("Forbidden", 403);
    }

    const finalCustomerId =
        isAdmin(user) && customerId ? customerId : orderCustomerId;

    if (finalCustomerId !== orderCustomerId) {
        throw createHttpError("customerId does not match order owner", 400);
    }

    const paymentStatus = paymentMethod === "COD" ? "UNPAID" : "PENDING";

    const transactionType =
        paymentMethod === "COD" ? "COD_COLLECTION" : "PAYMENT";

    return paymentRepository.createPaymentTransaction({
        orderId,
        customerId: finalCustomerId,
        amount,
        paymentMethod,
        paymentStatus,
        transactionType,
        provider,
        providerTransactionId,
        note
    });
};

export const getMyPayments = async (userId) => {
    return paymentRepository.findMyPayments(userId);
};

export const getPaymentById = async (user, paymentId) => {
    const payment = await paymentRepository.findPaymentById(paymentId);

    assertCanAccessPayment(payment, user);

    return payment;
};

export const getPaymentsByOrderId = async (user, orderId) => {
    if (isAdmin(user)) {
        return paymentRepository.findPaymentsByOrderId({
            orderId
        });
    }

    if (!isCustomer(user)) {
        throw createHttpError("Forbidden", 403);
    }

    const orderCustomerId = await paymentRepository.getOrderCustomerId(orderId);

    if (orderCustomerId && orderCustomerId !== user.id) {
        throw createHttpError("Forbidden", 403);
    }

    return paymentRepository.findPaymentsByOrderId({
        orderId,
        customerId: user.id
    });
};

export const markPaymentPaid = async (
    user,
    paymentId,
    { providerTransactionId, note } = {}
) => {
    assertAdmin(user);

    const payment = await paymentRepository.findPaymentById(paymentId);

    if (!payment) {
        throw createHttpError("Payment not found", 404);
    }

    if (payment.paymentStatus === "REFUNDED") {
        throw createHttpError("Refunded payment cannot be marked as paid", 400);
    }

    if (payment.paymentStatus === "CANCELLED") {
        throw createHttpError("Cancelled payment cannot be marked as paid", 400);
    }

    return paymentRepository.markPaymentPaid({
        paymentId,
        providerTransactionId:
            providerTransactionId || payment.providerTransactionId,
        note: note || payment.note
    });
};

export const markPaymentFailed = async (
    user,
    paymentId,
    { failureReason, note } = {}
) => {
    assertAdmin(user);

    const payment = await paymentRepository.findPaymentById(paymentId);

    if (!payment) {
        throw createHttpError("Payment not found", 404);
    }

    if (payment.paymentStatus === "PAID") {
        throw createHttpError("Paid payment cannot be marked as failed", 400);
    }

    if (payment.paymentStatus === "REFUNDED") {
        throw createHttpError("Refunded payment cannot be marked as failed", 400);
    }

    return paymentRepository.markPaymentFailed({
        paymentId,
        failureReason: failureReason || note || "Payment failed"
    });
};

export const refundPayment = async (
    user,
    paymentId,
    { amount, providerTransactionId, note } = {}
) => {
    assertAdmin(user);

    const payment = await paymentRepository.findPaymentById(paymentId);

    if (!payment) {
        throw createHttpError("Payment not found", 404);
    }

    if (payment.paymentStatus !== "PAID") {
        throw createHttpError("Only PAID payment can be refunded", 400);
    }

    const refundAmount = amount || payment.amount;

    if (Number(refundAmount) <= 0) {
        throw createHttpError("refund amount must be greater than 0", 400);
    }

    if (Number(refundAmount) > Number(payment.amount)) {
        throw createHttpError("refund amount cannot exceed payment amount", 400);
    }

    return paymentRepository.refundPayment({
        paymentId,
        payment,
        refundAmount,
        providerTransactionId,
        note
    });
};