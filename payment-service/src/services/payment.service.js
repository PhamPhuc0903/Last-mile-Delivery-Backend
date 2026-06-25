import prisma from "../config/prisma.js";

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
        throw new Error("orderId, amount and paymentMethod are required");
    }

    const finalCustomerId =
        user.role === "ADMIN" && customerId ? customerId : user.id;

    const paymentStatus = paymentMethod === "COD" ? "UNPAID" : "PENDING";

    const transactionType =
        paymentMethod === "COD" ? "COD_COLLECTION" : "PAYMENT";

    return prisma.paymentTransaction.create({
        data: {
            orderId,
            customerId: finalCustomerId,
            amount,
            paymentMethod,
            paymentStatus,
            transactionType,
            provider,
            providerTransactionId,
            note
        }
    });
};

export const getMyPayments = async (userId) => {
    return prisma.paymentTransaction.findMany({
        where: {
            customerId: userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const getPaymentById = async (user, paymentId) => {
    const payment = await prisma.paymentTransaction.findFirst({
        where:
            user.role === "ADMIN"
                ? { id: paymentId }
                : {
                    id: paymentId,
                    customerId: user.id
                }
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    return payment;
};

export const getPaymentsByOrderId = async (user, orderId) => {
    const where =
        user.role === "ADMIN"
            ? { orderId }
            : {
                orderId,
                customerId: user.id
            };

    return prisma.paymentTransaction.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const markPaymentPaid = async (
    paymentId,
    { providerTransactionId, note }
) => {
    const payment = await prisma.paymentTransaction.findUnique({
        where: {
            id: paymentId
        }
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.paymentStatus === "REFUNDED") {
        throw new Error("Refunded payment cannot be marked as paid");
    }

    return prisma.paymentTransaction.update({
        where: {
            id: paymentId
        },
        data: {
            paymentStatus: "PAID",
            providerTransactionId:
                providerTransactionId || payment.providerTransactionId,
            note: note || payment.note,
            paidAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const markPaymentFailed = async (paymentId, { failureReason }) => {
    const payment = await prisma.paymentTransaction.findUnique({
        where: {
            id: paymentId
        }
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.paymentStatus === "PAID") {
        throw new Error("Paid payment cannot be marked as failed");
    }

    return prisma.paymentTransaction.update({
        where: {
            id: paymentId
        },
        data: {
            paymentStatus: "FAILED",
            failureReason: failureReason || "Payment failed",
            updatedAt: new Date()
        }
    });
};

export const refundPayment = async (
    paymentId,
    { amount, providerTransactionId, note }
) => {
    const payment = await prisma.paymentTransaction.findUnique({
        where: {
            id: paymentId
        }
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.paymentStatus !== "PAID") {
        throw new Error("Only PAID payment can be refunded");
    }

    const refundAmount = amount || payment.amount;

    const result = await prisma.$transaction(async (tx) => {
        const updatedOriginalPayment = await tx.paymentTransaction.update({
            where: {
                id: paymentId
            },
            data: {
                paymentStatus: "REFUNDED",
                refundedAt: new Date(),
                updatedAt: new Date()
            }
        });

        const refundTransaction = await tx.paymentTransaction.create({
            data: {
                orderId: payment.orderId,
                customerId: payment.customerId,
                amount: refundAmount,
                paymentMethod: payment.paymentMethod,
                paymentStatus: "REFUNDED",
                transactionType: "REFUND",
                provider: payment.provider,
                providerTransactionId,
                note: note || "Payment refunded",
                refundedAt: new Date()
            }
        });

        return {
            originalPayment: updatedOriginalPayment,
            refundTransaction
        };
    });

    return result;
};