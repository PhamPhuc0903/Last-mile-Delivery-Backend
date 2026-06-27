import { z } from "zod";

export const notificationIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const createNotificationSchema = z.object({
    body: z.object({
        userId: z.string().uuid(),
        title: z.string().min(1).max(200),
        message: z.string().min(1),
        type: z
            .enum(["ORDER", "PAYMENT", "DRIVER", "DISPATCH", "SYSTEM", "PROMOTION"])
            .optional(),
        channel: z.enum(["IN_APP", "EMAIL", "SMS", "PUSH"]).optional(),
        metadata: z.record(z.any()).optional().nullable()
    })
});

export const createBulkNotificationsSchema = z.object({
    body: z.object({
        userIds: z.array(z.string().uuid()).min(1),
        title: z.string().min(1).max(200),
        message: z.string().min(1),
        type: z
            .enum(["ORDER", "PAYMENT", "DRIVER", "DISPATCH", "SYSTEM", "PROMOTION"])
            .optional(),
        channel: z.enum(["IN_APP", "EMAIL", "SMS", "PUSH"]).optional(),
        metadata: z.record(z.any()).optional().nullable()
    })
});