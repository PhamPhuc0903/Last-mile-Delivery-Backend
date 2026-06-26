import prisma from "../config/prisma.js";

export const getOrderCustomerId = async (orderId) => {
    const rows = await prisma.$queryRaw`
        SELECT customer_id::text AS "customerId"
        FROM orders.orders
        WHERE id = ${orderId}::uuid
        LIMIT 1
    `;

    return rows[0]?.customerId || null;
};

export const createPaymentTransaction = async (data) => {
    return prisma.paymentTransaction.create({
        data
    });
};

export const findMyPayments = async (customerId) => {
    return prisma.paymentTransaction.findMany({
        where: {
            customerId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findPaymentById = async (paymentId) => {
    return prisma.paymentTransaction.findUnique({
        where: {
            id: paymentId
        }
    });
};

export const findPaymentsByOrderId = async ({ orderId, customerId }) => {
    const where = {
        orderId
    };

    if (customerId) {
        where.customerId = customerId;
    }

    return prisma.paymentTransaction.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const markPaymentPaid = async ({
                                          paymentId,
                                          providerTransactionId,
                                          note
                                      }) => {
    return prisma.paymentTransaction.update({
        where: {
            id: paymentId
        },
        data: {
            paymentStatus: "PAID",
            providerTransactionId,
            note,
            paidAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const markPaymentFailed = async ({ paymentId, failureReason }) => {
    return prisma.paymentTransaction.update({
        where: {
            id: paymentId
        },
        data: {
            paymentStatus: "FAILED",
            failureReason,
            updatedAt: new Date()
        }
    });
};

export const refundPayment = async ({
                                        paymentId,
                                        payment,
                                        refundAmount,
                                        providerTransactionId,
                                        note
                                    }) => {
    return prisma.$transaction(async (tx) => {
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
};