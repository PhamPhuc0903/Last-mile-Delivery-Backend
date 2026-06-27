import { z } from "zod";

export const uuidParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const createSessionSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().optional().nullable(),
        title: z.string().max(200).optional().nullable()
    }).optional()
});

export const sendMessageSchema = z.object({
    body: z.object({
        sessionId: z.string().uuid().optional().nullable(),
        orderId: z.string().uuid().optional().nullable(),
        message: z.string().min(1)
    })
});