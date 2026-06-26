import { z } from "zod";

export const uuidParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const createUserSchema = z.object({
    body: z.object({
        fullName: z.string().min(1).max(100),
        phone: z.string().min(8).max(20),
        email: z.string().email().optional().nullable(),
        password: z.string().min(6),
        role: z.enum(["ADMIN", "CUSTOMER", "DRIVER"])
    })
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        fullName: z.string().min(1).max(100).optional(),
        phone: z.string().min(8).max(20).optional(),
        email: z.string().email().optional().nullable(),
        role: z.enum(["ADMIN", "CUSTOMER", "DRIVER"]).optional(),
        status: z.enum(["ACTIVE", "BLOCKED", "DELETED"]).optional()
    })
});

export const updateDriverStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        status: z.enum(["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"])
    })
});