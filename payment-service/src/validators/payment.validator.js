import { z } from "zod";

export const uuidParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const orderIdParamSchema = z.object({
    params: z.object({
        orderId: z.string().uuid()
    })
});

export const createPaymentSchema = z.object({
    body: z.object({
        orderId: z.string().uuid(),
        customerId: z.string().uuid().optional(),
        amount: z.number().positive(),
        paymentMethod: z.enum(["COD", "BANK_TRANSFER", "MOMO", "VNPAY"]),
        provider: z.string().optional().nullable(),
        note: z.string().optional().nullable()
    })
});

export const markPaymentPaidSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        providerTransactionId: z.string().optional().nullable(),
        note: z.string().optional().nullable()
    }).optional()
});

export const markPaymentFailedSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        failureReason: z.string().min(1)
    })
});

export const refundPaymentSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        note: z.string().optional().nullable()
    }).optional()
});